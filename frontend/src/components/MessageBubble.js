import React, { useState, useEffect } from 'react';
import styles from './MessageBubble.module.css';

const REACTION_EMOJIS = ['👍','❤️','😂','😮','😢','😡'];

/**
 * Single message bubble with:
 * - Copy on click
 * - Reaction picker on hover
 * - Reaction display
 * - Read receipt tick (✓ / ✓✓)
 */
export default function MessageBubble({ msg, isMine, partnerSeen, onReact }) {
  const [showReactions, setShowReactions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [vanishSecs, setVanishSecs] = useState(null);

  // Vanish countdown
  useEffect(() => {
    if (!msg.vanishAt) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((msg.vanishAt - Date.now()) / 1000));
      setVanishSecs(remaining);
    };
    tick(); // run immediately
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [msg.vanishAt]);

  if (msg.type === 'SYSTEM' || msg.senderId === 'SYSTEM') {
    return <div className={styles.system}>{msg.message}</div>;
  }

  const time = msg.timestamp
    ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const reactions = msg.reactions || {};
  const reactionEntries = Object.entries(reactions);

  // Read receipt: ✓✓ if partner has seen this message, ✓ if just sent
  const isSeen = isMine && partnerSeen && msg.id && partnerSeen === msg.id;

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.message).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div
      className={`${styles.wrapper} ${isMine ? styles.mine : styles.theirs}`}
      onMouseLeave={() => setShowReactions(false)}
    >
      {/* Reaction trigger */}
      <div className={styles.bubbleGroup}>
        <div
          className={`${styles.bubble} ${isMine ? styles.bubbleMine : styles.bubbleTheirs} ${msg.type === 'VANISH' ? styles.vanish : ''}`}
          onClick={handleCopy}
          title={msg.type === 'VANISH' ? `Vanishes in ${vanishSecs}s` : 'Click to copy'}
        >
          <span className={styles.text}>{msg.message}</span>
          <div className={styles.meta}>
            <span className={styles.time}>{time}</span>
            {msg.type === 'VANISH' && vanishSecs !== null && (
              <span className={styles.vanishTimer}>💣 {vanishSecs}s</span>
            )}
            {isMine && msg.type !== 'VANISH' && (
              <span className={`${styles.tick} ${isSeen ? styles.seen : ''}`}>
                {isSeen ? '✓✓' : '✓'}
              </span>
            )}
          </div>
          {copied && <span className={styles.copiedBadge}>Copied!</span>}
        </div>

        {/* Emoji reaction button */}
        <button
          className={styles.reactBtn}
          onClick={() => setShowReactions((v) => !v)}
          aria-label="React"
        >
          😊
        </button>

        {/* Reaction picker */}
        {showReactions && (
          <div className={`${styles.reactionPicker} ${isMine ? styles.pickerLeft : styles.pickerRight}`}>
            {REACTION_EMOJIS.map((e) => (
              <button
                key={e}
                className={styles.reactionOption}
                onClick={() => { onReact(msg.id, e); setShowReactions(false); }}
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Reaction display below bubble */}
      {reactionEntries.length > 0 && (
        <div className={`${styles.reactions} ${isMine ? styles.reactionsRight : styles.reactionsLeft}`}>
          {reactionEntries.map(([emoji]) => (
            <span key={emoji} className={styles.reactionBadge}>{emoji}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Date separator between messages from different days.
 */
export function DateSeparator({ date }) {
  return <div className={styles.dateSep}>{date}</div>;
}
