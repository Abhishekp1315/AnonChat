import React, { useEffect, useRef, useState } from 'react';
import styles from './ChatTemperature.module.css';

const LABELS = ['🧊 Cold', '😐 Lukewarm', '🙂 Warm', '🔥 Hot', '🌋 On Fire'];

/**
 * Tracks messages-per-minute and renders a live vibe bar.
 * Decays naturally when messages slow down.
 */
export default function ChatTemperature({ messages }) {
  const [temp, setTemp] = useState(0);
  const timestampsRef = useRef([]); // rolling window of message timestamps

  // Add a timestamp whenever a new CHAT message arrives
  useEffect(() => {
    const chatMsgs = messages.filter((m) => m.type === 'CHAT');
    if (chatMsgs.length === 0) return;
    timestampsRef.current.push(Date.now());
  }, [messages.length]); // eslint-disable-line

  // Recalculate temp every second — this also handles decay
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      // Keep only messages from the last 60 seconds
      timestampsRef.current = timestampsRef.current.filter((t) => now - t < 60_000);
      const mpm = timestampsRef.current.length;
      // Scale: 0→0, 2→20, 5→50, 10+→100
      const scaled = Math.min(100, mpm * 10);
      setTemp(scaled);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const levelIndex = Math.min(
    LABELS.length - 1,
    Math.floor((temp / 100) * LABELS.length)
  );
  const label = LABELS[levelIndex];

  const barColor =
    temp < 25 ? '#45aaf2' :
    temp < 50 ? '#26de81' :
    temp < 75 ? '#f7b731' :
                '#ff6584';

  return (
    <div className={styles.container} title="Chat temperature — based on message frequency">
      <span className={styles.label}>{label}</span>
      <div className={styles.track}>
        <div
          className={styles.fill}
          style={{ width: `${temp}%`, background: barColor }}
        />
      </div>
    </div>
  );
}
