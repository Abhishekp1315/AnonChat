import React, { useState } from 'react';
import { registerUser } from '../services/api';
import styles from './RegisterPage.module.css';

const COUNTRIES = ['US', 'UK', 'CA', 'AU', 'IN', 'DE', 'FR', 'BR', 'Other'];

/**
 * Registration form page.
 * On success, calls onRegistered(userId) to transition to chat.
 */
export default function RegisterPage({ onRegistered }) {
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
        onRegistered(res.data.id);
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
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>AnonChat</h1>
        <p className={styles.subtitle}>Chat anonymously with strangers</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label>Name
            <input name="name" value={form.name} onChange={handleChange}
              placeholder="Your name" required />
          </label>

          <label>Email
            <input name="email" type="email" value={form.email} onChange={handleChange}
              placeholder="you@example.com" required />
          </label>

          <label>Phone Number
            <input name="phoneNumber" value={form.phoneNumber} onChange={handleChange}
              placeholder="+1234567890" required />
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

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Registering...' : 'Register & Start Chatting'}
          </button>
        </form>
      </div>
    </div>
  );
}
