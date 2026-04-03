import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { getQueueSize } from '../services/api';
import styles from './HomePage.module.css';

const FEATURES = [
  {
    icon: '🎭',
    title: 'Fully Anonymous',
    desc: 'No names, no profiles, no traces. Just pure conversation between two strangers.',
  },
  {
    icon: '⚡',
    title: 'Instant Matching',
    desc: 'Our Redis-powered queue matches you with someone in seconds. No waiting around.',
  },
  {
    icon: '🎲',
    title: 'Vibe Matching',
    desc: 'Pick your mood — Chill, Deep Talk, Rant, Flirty — and get matched with someone on the same wavelength.',
  },
  {
    icon: '💣',
    title: 'Vanishing Messages',
    desc: 'Send messages that self-destruct in 10 seconds. Say it and forget it.',
  },
  {
    icon: '🌡️',
    title: 'Chat Temperature',
    desc: 'A live vibe meter tracks how hot your conversation is getting in real time.',
  },
  {
    icon: '🔒',
    title: 'No Data Stored',
    desc: 'We never link your identity to your chats. Your secrets stay secret.',
  },
];

const FLOATING_MSGS = [
  { text: 'hey stranger 👋',        delay: 0,    x: 8,  y: 15 },
  { text: 'what\'s your vibe? 😌',  delay: 0.8,  x: 72, y: 10 },
  { text: 'this is so cool 🔥',     delay: 1.6,  x: 20, y: 72 },
  { text: 'tell me a secret 🤫',    delay: 2.4,  x: 65, y: 68 },
  { text: 'deep talk? 🧠',          delay: 3.2,  x: 45, y: 85 },
  { text: 'you seem interesting ✨', delay: 4.0,  x: 5,  y: 45 },
  { text: 'lol same 😂',            delay: 4.8,  x: 80, y: 40 },
];

const STATS = [
  { value: '10K+', label: 'Chats Today' },
  { value: '< 3s', label: 'Match Time' },
  { value: '100%', label: 'Anonymous' },
  { value: '0',    label: 'Data Stored' },
];

export default function HomePage({ onGetStarted }) {
  const { theme, toggle } = useTheme();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [visibleFeatures, setVisibleFeatures] = useState([]);
  const [onlineCount, setOnlineCount] = useState(null);
  const heroRef = useRef(null);
  const featuresRef = useRef([]);

  // Poll online/queue count every 10s
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getQueueSize();
        setOnlineCount(res.data ?? 0);
      } catch (_) {}
    };
    fetch();
    const id = setInterval(fetch, 10_000);
    return () => clearInterval(id);
  }, []);

  // Parallax on mouse move
  useEffect(() => {
    const handle = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth  - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener('mousemove', handle);
    return () => window.removeEventListener('mousemove', handle);
  }, []);

  // Intersection observer for feature cards
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.dataset.idx);
            setVisibleFeatures((prev) => [...new Set([...prev, idx])]);
          }
        });
      },
      { threshold: 0.2 }
    );
    featuresRef.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.page}>

      {/* ── Navbar ── */}
      <nav className={styles.nav}>
        <span className={styles.navLogo}>AnonChat</span>
        <div className={styles.navRight}>
          <button className={styles.themeBtn} onClick={toggle} aria-label="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className={styles.navCta} onClick={onGetStarted}>
            Get Started →
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className={styles.hero} ref={heroRef}>
        {/* Animated gradient orbs */}
        <div className={styles.orb1} style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }} />
        <div className={styles.orb2} style={{ transform: `translate(${-mousePos.x}px, ${-mousePos.y}px)` }} />
        <div className={styles.orb3} style={{ transform: `translate(${mousePos.y}px, ${mousePos.x}px)` }} />

        {/* Floating chat bubbles */}
        {FLOATING_MSGS.map((m, i) => (
          <div
            key={i}
            className={styles.floatingBubble}
            style={{
              left: `${m.x}%`,
              top:  `${m.y}%`,
              animationDelay: `${m.delay}s`,
            }}
          >
            {m.text}
          </div>
        ))}

        {/* Hero content */}
        <div className={styles.heroContent}>
          <div className={styles.badge}>✨ 100% Anonymous · No Sign-up Required</div>
          {onlineCount !== null && (
            <div className={styles.onlineBadge}>
              <span className={styles.onlineDot} />
              {onlineCount > 0
                ? `${onlineCount} ${onlineCount === 1 ? 'person' : 'people'} waiting to chat`
                : 'Be the first to start a chat'}
            </div>
          )}
          <h1 className={styles.heroTitle}>
            Talk to <span className={styles.gradient}>Strangers.</span>
            <br />Stay <span className={styles.gradient}>Anonymous.</span>
          </h1>
          <p className={styles.heroSub}>
            Meet random people from around the world. No names, no profiles, no judgment.
            Just real conversations — and they vanish when you're done.
          </p>
          <div className={styles.heroBtns}>
            <button className={styles.btnPrimary} onClick={onGetStarted}>
              🎲 Start Chatting
            </button>
            <a href="#features" className={styles.btnGhost}>
              See Features ↓
            </a>
          </div>

          {/* Live typing animation */}
          <div className={styles.typingDemo}>
            <span className={styles.typingDot} />
            <span className={styles.typingDot} />
            <span className={styles.typingDot} />
            <span className={styles.typingLabel}>Stranger is typing...</span>
          </div>
        </div>

        {/* Mock chat window */}
        <div
          className={styles.mockChat}
          style={{ transform: `perspective(1000px) rotateY(${-mousePos.x * 0.3}deg) rotateX(${mousePos.y * 0.3}deg)` }}
        >
          <div className={styles.mockHeader}>
            <span className={styles.mockDot} style={{ background: '#ff5f57' }} />
            <span className={styles.mockDot} style={{ background: '#febc2e' }} />
            <span className={styles.mockDot} style={{ background: '#28c840' }} />
            <span className={styles.mockTitle}>AnonChat · Connected</span>
          </div>
          <div className={styles.mockMessages}>
            <MockMsg text="hey! what's up? 👋" mine={false} delay="0s" />
            <MockMsg text="not much, just vibing 😌" mine={true}  delay="0.4s" />
            <MockMsg text="same lol. where you from?" mine={false} delay="0.8s" />
            <MockMsg text="somewhere on earth 🌍" mine={true}  delay="1.2s" />
            <MockMsg text="haha fair enough 😂" mine={false} delay="1.6s" />
            <div className={styles.mockTyping}>
              <span /><span /><span />
            </div>
          </div>
          <div className={styles.mockInput}>
            <span>Type a message...</span>
            <button>Send</button>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className={styles.stats}>
        {STATS.map((s, i) => (
          <div key={i} className={styles.stat}>
            <span className={styles.statValue}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </section>

      {/* ── Features ── */}
      <section className={styles.features} id="features">
        <h2 className={styles.sectionTitle}>Everything you need. Nothing you don't.</h2>
        <p className={styles.sectionSub}>Built different from every other chat app out there.</p>
        <div className={styles.featureGrid}>
          {FEATURES.map((f, i) => (
            <div
              key={i}
              ref={(el) => (featuresRef.current[i] = el)}
              data-idx={i}
              className={`${styles.featureCard} ${visibleFeatures.includes(i) ? styles.visible : ''}`}
              style={{ transitionDelay: `${(i % 3) * 0.1}s` }}
            >
              <span className={styles.featureIcon}>{f.icon}</span>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className={styles.howItWorks}>
        <h2 className={styles.sectionTitle}>How it works</h2>
        <div className={styles.steps}>
          {[
            { n: '01', title: 'Register once',    desc: 'Quick sign-up. We only need the basics.' },
            { n: '02', title: 'Pick your vibe',   desc: 'Choose your mood and we\'ll find your match.' },
            { n: '03', title: 'Start chatting',   desc: 'Instant connection. No waiting, no awkward intros.' },
            { n: '04', title: 'Move on anytime',  desc: 'Hit Next User whenever you want a fresh start.' },
          ].map((s, i) => (
            <div key={i} className={styles.step}>
              <span className={styles.stepNum}>{s.n}</span>
              <h3 className={styles.stepTitle}>{s.title}</h3>
              <p className={styles.stepDesc}>{s.desc}</p>
              {i < 3 && <div className={styles.stepArrow}>→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className={styles.ctaBanner}>
        <div className={styles.ctaOrb} />
        <h2 className={styles.ctaTitle}>Ready to meet someone new?</h2>
        <p className={styles.ctaSub}>No account needed to explore. Just click and go.</p>
        <button className={styles.btnPrimary} onClick={onGetStarted}>
          🎲 Start Chatting Now
        </button>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <span className={styles.footerLogo}>AnonChat</span>
        <span className={styles.footerText}>Anonymous. Ephemeral. Free.</span>
      </footer>
    </div>
  );
}

function MockMsg({ text, mine, delay }) {
  return (
    <div
      className={`${styles.mockMsg} ${mine ? styles.mockMine : styles.mockTheirs}`}
      style={{ animationDelay: delay }}
    >
      {text}
    </div>
  );
}
