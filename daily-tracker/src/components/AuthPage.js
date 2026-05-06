import React, { useState } from 'react';
import { useAuth, apiCall } from '../App';

export default function AuthPage() {
  const { login } = useAuth();
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    setError('');

    if (!form.email || !form.password) {
      return setError('Please fill all fields.');
    }

    if (tab === 'register' && !form.name) {
      return setError('Name is required.');
    }

    setLoading(true);

    try {
      // ✅ FIXED ENDPOINT
      const endpoint = tab === 'login'
        ? '/.netlify/functions/auth/login'
        : '/.netlify/functions/auth/register';

      const body = tab === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };

      const data = await apiCall(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
      });

      login(data.token, data.user);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <div className="hero-dots" />
        <div className="hero-content">
          <img 
            src="https://raw.githubusercontent.com/shreegokulam/Sandhyavandhanam/main/daily-tracker/public/logo.png" 
            alt="Asthika Samaj Logo" 
            className="hero-logo"
            style={{ width: '120px', height: 'auto', display: 'block', marginBottom: '20px' }}
          />
          <div className="hero-badge"><span />Daily Sandhyavandhanam Tracker</div>
          <h1>Build habits.<br /><em>Track</em> your<br />daily flow.</h1>
          <p>Log your Prathakala, Madhyanika, and Saayamkala Sandhyavandhanam activities.</p>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-logo">Rhythm<span>.</span></div>

        <div className="auth-form-wrapper">
          <div className="auth-tabs">
            <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setError(''); }}>
              Sign In
            </button>
            <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); setError(''); }}>
              Create Account
            </button>
          </div>

          <h2 className="auth-title">{tab === 'login' ? 'Welcome back' : 'Get started'}</h2>

          {error && <div className="auth-error">{error}</div>}

          {tab === 'register' && (
            <input
              type="text"
              placeholder="Your Name"
              value={form.name}
              onChange={set('name')}
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={set('email')}
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={set('password')}
          />

          <button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Please wait...' : tab === 'login' ? 'Login' : 'Register'}
          </button>
        </div>
      </div>
    </div>
  );
}
