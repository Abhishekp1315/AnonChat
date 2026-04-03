import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getRoomHistory } from '../services/api';
import { sanitize } from '../utils/sanitize';

const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:8080/ws';

/**
 * Central chat hook — manages WebSocket, messages, receipts, reactions, typing, idle.
 */
export default function useChat(roomId, userId) {
  const [messages, setMessages]         = useState([]);
  const [connected, setConnected]       = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [partnerSeen, setPartnerSeen]   = useState(null); // last messageId partner saw
  const [reconnecting, setReconnecting] = useState(false);

  const clientRef      = useRef(null);
  const typingTimer    = useRef(null);
  const idleTimer      = useRef(null);
  const IDLE_MS        = 2 * 60 * 1000; // 2 min

  // ── Connect / disconnect when roomId changes ──────────────────────────────
  useEffect(() => {
    if (!roomId) return;

    // Load history first
    getRoomHistory(roomId)
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setMessages(res.data.map(normaliseHistoryMsg));
        }
      })
      .catch(() => {});

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 3000,
      onConnect: () => {
        setConnected(true);
        setReconnecting(false);

        client.subscribe(`/topic/chat/${roomId}`, (frame) => {
          const payload = JSON.parse(frame.body);
          handleIncoming(payload);
        });
      },
      onDisconnect: () => {
        setConnected(false);
        setReconnecting(true);
      },
      onStompError: (frame) => console.error('STOMP error', frame),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      setConnected(false);
      setReconnecting(false);
      setMessages([]);
      setPartnerTyping(false);
    };
  }, [roomId]); // eslint-disable-line

  // ── Incoming message router ───────────────────────────────────────────────
  const handleIncoming = useCallback((payload) => {
    switch (payload.type) {
      case 'TYPING':
        if (payload.senderId !== userId) {
          setPartnerTyping(true);
          clearTimeout(typingTimer.current);
          typingTimer.current = setTimeout(() => setPartnerTyping(false), 2500);
        }
        break;

      case 'READ_RECEIPT':
        if (payload.senderId !== userId) {
          setPartnerSeen(payload.message); // message field carries last-seen msgId
        }
        break;

      case 'REACTION':
        setMessages((prev) => prev.map((m) =>
          m.id === payload.targetMessageId
            ? { ...m, reactions: { ...(m.reactions || {}), [payload.reaction]: payload.senderId } }
            : m
        ));
        break;

      default:
        // CHAT, VANISH, SYSTEM, JOIN, LEAVE
        setMessages((prev) => {
          if (payload.id && prev.some((m) => m.id === payload.id)) return prev;
          const msg = { ...payload };
          // Set vanishAt on BOTH sender and receiver sides
          if (payload.type === 'VANISH') {
            msg.vanishAt = Date.now() + 10_000;
          }
          return [...prev, msg];
        });
    }
  }, [userId]);

  // ── Vanish message cleanup ────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setMessages((prev) => {
        const now = Date.now();
        const filtered = prev.filter((m) => !m.vanishAt || m.vanishAt > now);
        // Only return new array if something was actually removed
        return filtered.length !== prev.length ? filtered : prev;
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // ── Idle detection — reset on any activity ────────────────────────────────
  const resetIdle = useCallback(() => {
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      // Broadcast idle system message locally
      setMessages((prev) => [...prev, {
        type: 'SYSTEM', senderId: 'SYSTEM',
        message: 'You have been idle for 2 minutes.',
        timestamp: new Date().toISOString(),
      }]);
    }, IDLE_MS);
  }, [IDLE_MS]);

  // ── Outbound helpers ──────────────────────────────────────────────────────
  const publish = useCallback((destination, body) => {
    if (!clientRef.current?.connected) return;
    clientRef.current.publish({ destination, body: JSON.stringify(body) });
  }, []);

  const sendMessage = useCallback((text) => {
    if (!roomId) return;
    resetIdle();
    publish('/app/sendMessage', {
      senderId: userId, roomId,
      message: sanitize(text),
      timestamp: new Date().toISOString(),
      type: 'CHAT',
    });
  }, [roomId, userId, publish, resetIdle]);

  const sendVanish = useCallback((text) => {
    if (!roomId) return;
    publish('/app/sendMessage', {
      senderId: userId, roomId,
      message: sanitize(text),
      timestamp: new Date().toISOString(),
      type: 'VANISH',
    });
  }, [roomId, userId, publish]);

  const sendTyping = useCallback(() => {
    if (!roomId) return;
    publish('/app/typing', { senderId: userId, roomId, message: '', type: 'TYPING' });
  }, [roomId, userId, publish]);

  const sendReadReceipt = useCallback((lastMessageId) => {
    if (!roomId || !lastMessageId) return;
    publish('/app/readReceipt', {
      senderId: userId, roomId,
      message: lastMessageId, // carries the last-seen ID
      type: 'READ_RECEIPT',
    });
  }, [roomId, userId, publish]);

  const sendReaction = useCallback((targetMessageId, emoji) => {
    if (!roomId) return;
    publish('/app/react', {
      senderId: userId, roomId,
      targetMessageId, reaction: emoji,
      message: '', type: 'REACTION',
    });
  }, [roomId, userId, publish]);

  return {
    messages, connected, reconnecting,
    partnerTyping, partnerSeen,
    sendMessage, sendVanish, sendTyping, sendReadReceipt, sendReaction,
  };
}

// Normalise MongoDB history records to match live payload shape
function normaliseHistoryMsg(m) {
  return {
    id: m.id,
    senderId: m.senderId,
    roomId: m.roomId,
    message: m.message,
    timestamp: m.timestamp,
    type: m.type,
    reactions: m.reactions || {},
  };
}
