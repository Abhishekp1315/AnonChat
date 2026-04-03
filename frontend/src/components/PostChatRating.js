import React, { useState } from 'react';
import { submitRating } from '../services/api';
import styles from './PostChatRating.module.css';

/**
 * Shown after a chat ends. Lets user rate the session 1–5 stars.
 */
export default function PostChatRating({ roomId, userId, onDone }) {
  const [hovered, setHovered]   = useState(0);
  const [selected, setSelected] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleRate = async (stars) => {
    setSelected(stars);
    try {
      await submitRating(roomId, userId, stars);
    } catch (_) {}
    setSubmitted(true);
    setTimeout(onDone, 1200);
  };

  if (submitted) {
    return (
      <div className={styles.container}>
        <p className={styles.thanks}>Thanks for the feedback! ✨</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <p className={styles.title}>How was that chat?</p>
      <div className={styles.stars}>
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            className={`${styles.star} ${s <= (hovered || selected) ? styles.active : ''}`}
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => handleRate(s)}
            aria-label={`${s} star${s > 1 ? 's' : ''}`}
          >
            ★
          </button>
        ))}
      </div>
      <button className={styles.skip} onClick={onDone}>Skip</button>
    </div>
  );
}
