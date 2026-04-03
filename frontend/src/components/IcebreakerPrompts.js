import React, { useState, useMemo } from 'react';
import styles from './IcebreakerPrompts.module.css';

const ALL_PROMPTS = [
  'Would you rather live in the past or the future?',
  'Hot take: pineapple on pizza is actually good.',
  'What\'s the most useless skill you have?',
  'If you could only eat one food forever, what would it be?',
  'What\'s a hill you\'d die on?',
  'Would you rather be invisible or be able to fly?',
  'What\'s the weirdest dream you\'ve had recently?',
  'If your life had a theme song, what would it be?',
  'What\'s something you believed as a kid that turned out to be wrong?',
  'Would you rather know when you\'ll die or how you\'ll die?',
  'What\'s the most embarrassing thing you still think about?',
  'If you could master any skill instantly, what would it be?',
];

/**
 * Shows 3 random icebreaker prompts. Clicking one sends it as a message.
 */
export default function IcebreakerPrompts({ onSend }) {
  const [dismissed, setDismissed] = useState(false);

  const prompts = useMemo(() => {
    const shuffled = [...ALL_PROMPTS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, []);

  if (dismissed) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span>💬 Break the ice</span>
        <button className={styles.dismiss} onClick={() => setDismissed(true)}>✕</button>
      </div>
      <div className={styles.prompts}>
        {prompts.map((p, i) => (
          <button
            key={i}
            className={styles.prompt}
            onClick={() => { onSend(p); setDismissed(true); }}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
