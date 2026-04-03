import React, { useState, useEffect, useRef, useCallback } from 'react';
import { startChat, nextUser, endChat, getQueueSize, getUserStatus } from '../services/api';
import useChat from '../websocket/useChat';
import MessageBubble, { DateSeparator } from '../components/MessageBubble';
import EmojiPicker from '../components/EmojiPicker';
import VibeSelector from '../components/VibeSelector';
import IcebreakerPrompts from '../components/IcebreakerPrompts';
import ChatTemperature from '../components/ChatTemperature';
import PostChatRating from '../components/PostChatRating';
import AnonAvatar from '../components/AnonAvatar';
import { generateNickname } from '../utils/nickname';
import styles from './ChatPage.module.css';

export default function ChatPage({ userId, onLogout }) {
  const [status, setStatus]             = useState('IDLE');
  const [roomId, setRoomId]             = useState(null);
  const [inputText, setInputText]       = useState('');
  const [queueSize, setQueueSize]       = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [showEmoji, setShowEmoji]       = useState(false);
  const [soundOn, setSoundOn]           = useState(true);
  const [sessionSecs, setSessionSecs]   = useState(0);
  const [atBottom, setAtBottom]         = useState(true);
  const [vibe, setVibe]                 = useState(null);
  const [vanishMode, setVanishMode]     = useState(false);
  const [showRating, setShowRating]     = useState(false);
  const [lastRoomId, setLastRoomId]     = useState(null);
  const [showIcebreaker, setShowIcebreaker] = useState(false);

  // Nicknames for this session
  const myNickname      = generateNickname(userId);
  const partnerNickname = generateNickname(roomId ? roomId + 'partner' : 'stranger');

  const messagesEndRef = useRef(null);
  const messagesBoxRef = useRef(null);
  const typingDebounce = useRef(null);
  const sessionTimer   = useRef(null);
  const audioCtxRef    = useRef(null);
  const prevMsgCount   = useRef(0);

  const {
    messages, connected, reconnecting,
    partnerTyping, partnerSeen,
    sendMessage, sendVanish, sendTyping, sendReadReceipt, sendReaction,
  } = useChat(roomId, userId);

  // ── Session timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === 'MATCHED') {
      setSessionSecs(0);
      setShowIcebreaker(true);
      sessionTimer.current = setInterval(() => setSessionSecs((s) => s + 1), 1000);
    } else {
      clearInterval(sessionTimer.current);
    }
    return () => clearInterval(sessionTimer.current);
  }, [status]);

  // ── Auto-scroll + read receipt + sound ───────────────────────────────────
  useEffect(() => {
    if (atBottom) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    const chatMsgs = messages.filter((m) => m.type === 'CHAT' && m.senderId !== userId);
    if (chatMsgs.length > 0) {
      const last = chatMsgs[chatMsgs.length - 1];
      if (last.id) sendReadReceipt(last.id);
    }

    if (soundOn && messages.length > prevMsgCount.current) {
      const newest = messages[messages.length - 1];
      if (newest?.senderId !== userId && newest?.type === 'CHAT') playBeep();
    }
    prevMsgCount.current = messages.length;
  }, [messages]); // eslint-disable-line

  // ── Scroll detection ──────────────────────────────────────────────────────
  const handleScroll = () => {
    const el = messagesBoxRef.current;
    if (!el) return;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
  };

  // ── Matchmaking polling — auto-cancel after 5 min ───────────────────────
  useEffect(() => {
    if (status !== 'WAITING') return;
    const startedAt = Date.now();
    const MAX_WAIT_MS = 5 * 60 * 1000; // 5 minutes

    const interval = setInterval(async () => {
      // Timeout — stop waiting
      if (Date.now() - startedAt > MAX_WAIT_MS) {
        clearInterval(interval);
        try { await endChat(userId); } catch (_) {}
        setRoomId(null);
        setStatus('ENDED');
        return;
      }
      try {
        const res = await getUserStatus(userId);
        const room = res.data;
        if (room && room !== 'NOT_IN_SESSION') {
          setRoomId(room); setStatus('MATCHED'); clearInterval(interval); return;
        }
        const q = await getQueueSize();
        setQueueSize(q.data ?? 0);
      } catch (_) {}
    }, 2000);
    return () => clearInterval(interval);
  }, [status, userId]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleStart = async () => {
    setActionLoading(true);
    try {
      const res = await startChat(userId, vibe);
      if (res.data.status === 'MATCHED') { setRoomId(res.data.roomId); setStatus('MATCHED'); }
      else setStatus('WAITING');
    } catch (_) {} finally { setActionLoading(false); }
  };

  const handleNext = async () => {
    setActionLoading(true);
    setRoomId(null); setShowIcebreaker(false);
    try {
      const res = await nextUser(userId);
      if (res.data.status === 'MATCHED') { setRoomId(res.data.roomId); setStatus('MATCHED'); }
      else setStatus('WAITING');
    } catch (_) {} finally { setActionLoading(false); }
  };

  const handleEnd = async () => {
    setActionLoading(true);
    try {
      await endChat(userId);
      setLastRoomId(roomId);
      setRoomId(null); setStatus('ENDED'); setShowRating(true); setShowIcebreaker(false);
    } catch (_) {} finally { setActionLoading(false); }
  };

  // ── Send ──────────────────────────────────────────────────────────────────
  const doSend = useCallback(() => {
    const text = inputText.trim();
    if (!text || !connected) return;
    if (vanishMode) sendVanish(text);
    else sendMessage(text);
    setInputText(''); setShowEmoji(false);
  }, [inputText, connected, vanishMode, sendMessage, sendVanish]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); }
    if (e.key === 'Escape') { setShowEmoji(false); }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    clearTimeout(typingDebounce.current);
    typingDebounce.current = setTimeout(sendTyping, 300);
  };

  // ── Beep ──────────────────────────────────────────────────────────────────
  const playBeep = () => {
    try {
      if (!audioCtxRef.current)
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.15);
    } catch (_) {}
  };

  // ── Render messages with date separators ─────────────────────────────────
  const renderMessages = () => {
    const items = [];
    let lastDate = null;
    messages.forEach((msg, i) => {
      const dateStr = msg.timestamp ? formatDate(new Date(msg.timestamp)) : null;
      if (dateStr && dateStr !== lastDate) {
        items.push(<DateSeparator key={`d-${i}`} date={dateStr} />);
        lastDate = dateStr;
      }
      items.push(
        <MessageBubble
          key={msg.id || i}
          msg={msg}
          isMine={msg.senderId === userId}
          partnerSeen={partnerSeen}
          onReact={sendReaction}
        />
      );
    });
    return items;
  };

  // ── Post-chat rating screen ───────────────────────────────────────────────
  if (showRating && lastRoomId) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <span className={styles.logo}>AnonChat</span>
          <button className={styles.btnLogout} onClick={onLogout}>Logout</button>
        </header>
        <main className={styles.main}>
          <PostChatRating
            roomId={lastRoomId}
            userId={userId}
            onDone={() => { setShowRating(false); setLastRoomId(null); }}
          />
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <span className={styles.logo}>AnonChat</span>
        <div className={styles.headerRight}>
          {status === 'MATCHED' && (
            <>
              <AnonAvatar seed={roomId + 'partner'} size={28} label={partnerNickname} />
              <span className={styles.timer}>{formatTime(sessionSecs)}</span>
              <span className={`${styles.dot} ${connected ? styles.online : styles.offline}`} />
            </>
          )}
          <span className={styles.statusLabel}>{statusLabel(status, connected, reconnecting)}</span>
          <button className={styles.btnSound} onClick={() => setSoundOn((v) => !v)}
            title={soundOn ? 'Mute' : 'Unmute'}>
            {soundOn ? '🔔' : '🔕'}
          </button>
          <button className={styles.btnLogout} onClick={onLogout}>Logout</button>
        </div>
      </header>

      {reconnecting && (
        <div className={styles.reconnectBanner}>⚠️ Connection lost — reconnecting...</div>
      )}

      {/* Main */}
      <main className={styles.main}>

        {/* IDLE / ENDED */}
        {(status === 'IDLE' || status === 'ENDED') && (
          <div className={styles.landing}>
            <AnonAvatar seed={userId} size={64} label={`You are ${myNickname}`} />
            <p className={styles.landingText}>
              {status === 'ENDED' ? 'Chat ended.' : 'Ready to meet someone new?'}
            </p>
            <VibeSelector selected={vibe} onChange={setVibe} />
            <button className={styles.btnPrimary} onClick={handleStart} disabled={actionLoading}>
              {actionLoading ? 'Connecting...' : '🎲 Start Chat'}
            </button>
          </div>
        )}

        {/* WAITING */}
        {status === 'WAITING' && (
          <div className={styles.landing}>
            <div className={styles.spinner} />
            <p className={styles.landingText}>Looking for someone{vibe ? ` with ${vibe} vibe` : ''}...</p>
            {queueSize > 0 && <p className={styles.queueInfo}>{queueSize} user(s) in queue</p>}
            <button className={styles.btnDanger} onClick={handleEnd} disabled={actionLoading}>Cancel</button>
          </div>
        )}

        {/* MATCHED */}
        {status === 'MATCHED' && (
          <div className={styles.chatWindow}>
            <ChatTemperature messages={messages} />

            <div className={styles.messages} ref={messagesBoxRef} onScroll={handleScroll}>
              {showIcebreaker && messages.filter(m => m.type === 'CHAT').length === 0 && (
                <IcebreakerPrompts onSend={(text) => { sendMessage(text); setShowIcebreaker(false); }} />
              )}
              {messages.filter(m => m.type === 'CHAT').length === 0 && !showIcebreaker && (
                <div className={styles.emptyState}>👋 Say hello to your new chat partner!</div>
              )}
              {renderMessages()}
              {partnerTyping && <div className={styles.typing}>{partnerNickname} is typing...</div>}
              <div ref={messagesEndRef} />
            </div>

            {!atBottom && (
              <button className={styles.scrollBtn}
                onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}>
                ↓
              </button>
            )}

            {/* Input */}
            <div className={styles.inputRow}>
              <div className={styles.emojiWrap}>
                <button className={styles.emojiBtn} type="button"
                  onClick={() => setShowEmoji((v) => !v)} aria-label="Emoji">😊</button>
                {showEmoji && (
                  <EmojiPicker
                    onSelect={(e) => setInputText((t) => t + e)}
                    onClose={() => setShowEmoji(false)}
                  />
                )}
              </div>

              <button
                className={`${styles.vanishBtn} ${vanishMode ? styles.vanishActive : ''}`}
                onClick={() => setVanishMode((v) => !v)}
                title="Vanish mode — message disappears after 10s"
              >
                💣
              </button>

              <textarea
                className={styles.textarea}
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={vanishMode
                  ? '💣 Vanish mode — disappears in 10s...'
                  : 'Type a message… (Enter to send)'}
                maxLength={1000}
                rows={1}
                autoFocus
              />

              <span className={styles.charCount}>{inputText.length}/1000</span>

              <button className={styles.btnSend} onClick={doSend}
                disabled={!inputText.trim() || !connected}>
                Send
              </button>
            </div>
          </div>
        )}
      </main>

      {status === 'MATCHED' && (
        <footer className={styles.footer}>
          <button className={styles.btnSecondary} onClick={handleNext} disabled={actionLoading}>
            ⏭ Next User
          </button>
          <button className={styles.btnDanger} onClick={handleEnd} disabled={actionLoading}>
            ✕ End Chat
          </button>
        </footer>
      )}
    </div>
  );
}

function statusLabel(status, connected, reconnecting) {
  if (reconnecting) return 'Reconnecting...';
  if (status === 'MATCHED') return connected ? 'Connected' : 'Offline';
  if (status === 'WAITING') return 'Searching...';
  if (status === 'ENDED')   return 'Disconnected';
  return 'Anonymous Chat';
}

function formatTime(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function formatDate(date) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(date, today))     return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}
