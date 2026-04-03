import React from 'react';
import styles from './EmojiPicker.module.css';

const EMOJIS = ['😀','😂','😍','🥺','😎','😭','🤔','🔥','👍','❤️','😮','😡'];

/**
 * Lightweight emoji picker — no external library needed.
 * Calls onSelect(emoji) when an emoji is clicked.
 */
export default function EmojiPicker({ onSelect, onClose }) {
  return (
    <div className={styles.picker} role="dialog" aria-label="Emoji picker">
      {EMOJIS.map((e) => (
        <button
          key={e}
          className={styles.emoji}
          onClick={() => { onSelect(e); onClose(); }}
          aria-label={e}
        >
          {e}
        </button>
      ))}
    </div>
  );
}
