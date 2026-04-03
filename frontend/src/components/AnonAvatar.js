import React, { useMemo } from 'react';
import styles from './AnonAvatar.module.css';

const SHAPES = ['circle', 'square', 'triangle', 'diamond'];
const COLORS = ['#6c63ff','#ff6584','#43b89c','#f7b731','#e056fd','#fd9644','#26de81','#45aaf2'];
const PATTERNS = ['dots', 'stripes', 'solid'];

/**
 * Deterministically generates a unique avatar from a seed string (userId or roomId).
 * Pure CSS — no images, no libraries.
 */
export default function AnonAvatar({ seed = '', size = 40, label = '' }) {
  const { color, bg, shape, pattern, initials } = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const abs = Math.abs(hash);
    return {
      color:   COLORS[abs % COLORS.length],
      bg:      COLORS[(abs + 3) % COLORS.length],
      shape:   SHAPES[abs % SHAPES.length],
      pattern: PATTERNS[abs % PATTERNS.length],
      initials: seed.slice(0, 2).toUpperCase(),
    };
  }, [seed]);

  const style = {
    width: size, height: size,
    background: bg,
    color: '#fff',
    fontSize: size * 0.35,
    borderRadius: shape === 'circle' ? '50%'
                : shape === 'square' ? '8px'
                : shape === 'diamond' ? '4px'
                : '4px',
    transform: shape === 'diamond' ? 'rotate(45deg)' : 'none',
    border: `2px solid ${color}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, flexShrink: 0, userSelect: 'none',
    backgroundImage: pattern === 'dots'
      ? `radial-gradient(${color}44 1px, transparent 1px)`
      : pattern === 'stripes'
      ? `repeating-linear-gradient(45deg, ${color}22 0px, ${color}22 2px, transparent 2px, transparent 8px)`
      : 'none',
    backgroundSize: pattern === 'dots' ? '8px 8px' : undefined,
  };

  return (
    <div className={styles.wrap} title={label}>
      <div style={style}>
        <span style={{ transform: shape === 'diamond' ? 'rotate(-45deg)' : 'none' }}>
          {initials}
        </span>
      </div>
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
}
