import React, { useState } from 'react';
import { registerUser, loginUser } from '../services/api';
import styles from './AuthPage.module.css';

const COUNTRIES = ['US', 'UK', 'CA', 'AU', 'IN', 'DE', 'FR', 'BR', 'Other'];

/**
 * Combined Login / Register page with tab switching.
 */
export default function AuthPage({ onAuth, onBack }) {
  const [tab, setTab] = useState('login'); // 'login' | 'register'

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {onBack && (
          <button className={styles.backBtn} onClick={onBack}>
            ← Back to Home
          </button>
        )}
        <h1 className={styles.title}>AnonChat</h1>
        <p className={styles.subtitle}>Chat anonymously with strangers</p>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'login' ? styles.activeTab : ''}`}
            onClick={() => setTab('login')}
          >
            Login
          </button>
          <button
            className={`${styles.tab} ${tab === 'register' ? styles.activeTab : ''}`}
            onClick={() => setTab('register')}
          >
            Register
          </button>
        </div>

        {tab === 'login'
          ? <LoginForm onAuth={onAuth} onSwitch={() => setTab('register')} />
          : <RegisterForm onAuth={onAuth} onSwitch={() => setTab('login')} />
        }
      </div>
    </div>
  );
}

/* ── Login Form ── */
function LoginForm({ onAuth, onSwitch }) {
  const [form, setForm] = useState({ email: '', phoneNumber: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginUser(form);
      if (res.success) {
        onAuth(res.data.id);
      } else {
        setError(res.message || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or phone number');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <label>Email
        <input name="email" type="email" value={form.email}
          onChange={handleChange} placeholder="you@example.com" required />
      </label>

      <label>Phone Number
        <input name="phoneNumber" value={form.phoneNumber}
          onChange={handleChange} placeholder="+1234567890" required />
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <button type="submit" className={styles.btnPrimary} disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>

      <p className={styles.switchText}>
        No account?{' '}
        <span className={styles.link} onClick={onSwitch}>Register here</span>
      </p>
    </form>
  );
}

/* ── Register Form ── */
function RegisterForm({ onAuth, onSwitch }) {
  const [form, setForm] = useState({
    name: '', email: '', phoneNumber: '', country: 'US', gender: 'MALE',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await registerUser(form);
      if (res.success) {
        onAuth(res.data.id);
      } else {
        setError(res.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <label>Name
        <input name="name" value={form.name} onChange={handleChange}
          placeholder="Your name" required />
      </label>

      <label>Email
        <input name="email" type="email" value={form.email}
          onChange={handleChange} placeholder="you@example.com" required />
      </label>

      <label>Phone Number
        <input name="phoneNumber" value={form.phoneNumber}
          onChange={handleChange} placeholder="+1234567890" required />
      </label>

      <label>Country
        <select name="country" value={form.country} onChange={handleChange}>
          {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </label>

      <label>Gender
        <select name="gender" value={form.gender} onChange={handleChange}>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
        </select>
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <button type="submit" className={styles.btnPrimary} disabled={loading}>
        {loading ? 'Registering...' : 'Create Account'}
      </button>

      <p className={styles.switchText}>
        Already registered?{' '}
        <span className={styles.link} onClick={onSwitch}>Login here</span>
      </p>
    </form>
  );
}
