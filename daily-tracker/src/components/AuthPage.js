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
    if (!form.email || !form.password) return setError('Please fill all fields.');
    if (tab === 'register' && !form.name) return setError('Name is required.');

    setLoading(true);
    try {
      const endpoint = tab === 'login' ? '/auth/login' : '/auth/register';
      const body = tab === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };

      const data = await apiCall(endpoint, { method: 'POST', body: JSON.stringify(body) });
      login(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Hero panel */}
      <div className="auth-hero">
        <div className="hero-dots" />
        <div className="hero-content">
   <img 
        src="/logo.png" 
        alt="Logo" 
        className="auth-logo" 
        style={{ maxWidth: '150px', marginBottom: '200px' }} 
      />
          <div className="hero-badge"><span />Daily Rhythm Tracker</div>
          <h1>Build habits.<br /><em>Track</em> your<br />daily flow.</h1>
          <p>Log your PrathaSandhya, Madhyanika, and SaayamSandhyavandhanam activities.</p>
          <div className="hero-slots">
            {[
              { icon: '🌅', label: 'Prathasandhya' },
              { icon: '☀️', label: 'Madhyanika' },
              { icon: '🌙', label: 'SaayamSandhya' },
            ].map((s) => (
              <div key={s.label} className="hero-slot">
                <div className="slot-icon">{s.icon}</div>
                <div className="slot-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="auth-panel">
        <div className="auth-logo">Rhythm<span>.</span></div>
        <div className="auth-form-wrapper">
          <div className="auth-tabs">
            <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setError(''); }}>Sign In</button>
            <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); setError(''); }}>Create Account</button>
          </div>

          <h2 className="auth-title">{tab === 'login' ? 'Welcome back' : 'Get started'}</h2>
          <p className="auth-subtitle">
            {tab === 'login' ? 'Sign in to your account to continue.' : 'Create your account — it takes 30 seconds.'}
          </p>

          {error && <div className="auth-error">{error}</div>}

          {tab === 'register' && (
            <div className="field-group">
              <label className="field-label">Your Name</label>
              <input className="field-input" type="text" placeholder="Alex Johnson" value={form.name} onChange={set('name')} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />
            </div>
          )}

          <div className="field-group">
            <label className="field-label">Email Address</label>
            <input className="field-input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />
          </div>

          <div className="field-group">
            <label className="field-label">Password</label>
            <input className="field-input" type="password" placeholder={tab === 'register' ? 'Min 8 characters' : '••••••••'} value={form.password} onChange={set('password')} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />
          </div>

          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Please wait…' : tab === 'login' ? 'Sign In →' : 'Create Account →'}
          </button>
        </div>
      </div>
    </div>
  );
}
