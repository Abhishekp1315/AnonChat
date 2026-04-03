import React, { useState } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import ChatPage from './pages/ChatPage';
import './App.css';

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button className="theme-toggle" onClick={toggle} title="Toggle theme" aria-label="Toggle theme">
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}

function AppInner() {
  // 'home' | 'auth' | 'chat'
  const [page, setPage] = useState('home');
  const [userId, setUserId] = useState(null);

  const handleAuth = (id) => {
    setUserId(id);
    setPage('chat');
  };

  const handleLogout = () => {
    setUserId(null);
    setPage('home');
  };

  return (
    <div className="app-root">
      {/* Theme toggle — hidden on homepage (it has its own nav) */}
      {page !== 'home' && (
        <div className="top-bar">
          <ThemeToggle />
        </div>
      )}

      {page === 'home' && <HomePage onGetStarted={() => setPage('auth')} />}
      {page === 'auth' && <AuthPage onAuth={handleAuth} onBack={() => setPage('home')} />}
      {page === 'chat' && <ChatPage userId={userId} onLogout={handleLogout} />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
