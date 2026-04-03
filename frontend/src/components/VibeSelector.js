import React from 'react';
import styles from './VibeSelector.module.css';

export const VIBES = [
  { key: 'CHILL',  label: 'Chill',      emoji: '😌' },
  { key: 'RANT',   label: 'Rant',       emoji: '😤' },
  { key: 'BORED',  label: 'Bored',      emoji: '🥱' },
  { key: 'FLIRTY', label: 'Flirty',     emoji: '😏' },
  { key: 'DEEP',   label: 'Deep Talk',  emoji: '🧠' },
];

/**
 * Vibe picker shown before starting a chat.
 * Selecting a vibe improves matchmaking — you'll be paired with someone in the same mood.
 */
export default function VibeSelector({ selected, onChange }) {
  return (
    <div className={styles.container}>
      <p className={styles.label}>What's your vibe right now?</p>
      <div className={styles.vibes}>
        {VIBES.map((v) => (
          <button
            key={v.key}
            className={`${styles.vibe} ${selected === v.key ? styles.active : ''}`}
            onClick={() => onChange(selected === v.key ? null : v.key)}
          >
            <span className={styles.emoji}>{v.emoji}</span>
            <span className={styles.vibeLabel}>{v.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
