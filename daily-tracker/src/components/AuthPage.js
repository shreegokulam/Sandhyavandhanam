import React, { useState } from 'react';
import { useAuth, apiCall } from '../App';
import logo from '../logo.jpg';

export default function AuthPage() {
  const { login, signInWithGoogle } = useAuth();
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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
      const body =
        tab === 'login'
          ? { email: form.email, password: form.password }
          : { name: form.name, email: form.email, password: form.password };

      const data = await apiCall(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      login(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message || 'Google sign-in failed.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <div className="hero-dots" />
        <div className="hero-content">
          <div className="hero-badge"><span />Daily Rhythm Tracker</div>
          <h1>Build habits.<br /><em>Track</em> your<br />daily flow.</h1>
          <p>Log your morning, afternoon, and 
