import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, apiCall } from '../App';

const SLOTS = [
  { key: 'morning', label: 'Morning', icon: '🌅', activity: 'Exercise / Movement', color: 'morning' },
  { key: 'afternoon', label: 'Afternoon', icon: '☀️', activity: 'Reading / Learning', color: 'afternoon' },
  { key: 'evening', label: 'Evening', icon: '🌙', activity: 'Meditation / Reflection', color: 'evening' },
];

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatDateShort(dateStr) {
  const [y, m, d] = dateStr.split('-');
  const date = new Date(y, m - 1, d);
  const today = new Date().toISOString().split('T')[0];
  if (dateStr === today) return 'Today';
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (dateStr === yesterday) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [today, setToday] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingSlot, setLoadingSlot] = useState(null);

  const todayDate = new Date().toISOString().split('T')[0];

  const fetchToday = useCallback(async () => {
    try {
      const data = await apiCall('/activities/today');
      setToday(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const data = await apiCall('/activities/history');
      setHistory(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchToday();
    fetchHistory();
  }, [fetchToday, fetchHistory]);

  const handleAction = async (slot, action) => {
    setLoadingSlot(`${slot}-${action}`);
    try {
      const data = await apiCall('/activities/log', {
        method: 'POST',
        body: JSON.stringify({ slot, action }),
      });
      setToday(data);
      // Refresh history to show updates
      fetchHistory();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSlot(null);
    }
  };

  // Compute overall progress
  const completedSlots = today
    ? SLOTS.filter((s) => today[s.key]?.done).length
    : 0;
  const progressPct = (completedSlots / 3) * 100;

  const totalCount = today
    ? SLOTS.reduce((sum, s) => sum + (today[s.key]?.count || 0), 0)
    : 0;

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="nav-logo">Rhythm<span>.</span></div>
        <div className="nav-right">
          <span className="nav-greeting">Hey, <strong>{user.name.split(' ')[0]}</strong></span>
          <button className="nav-logout" onClick={logout}>Sign Out</button>
        </div>
      </nav>

      <div className="main-content">
        {/* Date header */}
        <div className="date-header">
          <div className="date-eyebrow">Daily Activity Log</div>
          <div className="date-title">{formatDate(todayDate)}</div>
          <div className="date-sub">{totalCount} total activities logged today</div>
        </div>

        {/* Progress bar */}
        <div className="daily-progress">
          <div className="dp-label">Daily Completion</div>
          <div className="dp-bar">
            <div className="dp-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="dp-stats">
            <span className="dp-stat"><strong>{completedSlots}</strong> of 3 slots done</span>
            <span className="dp-stat"><strong>{Math.round(progressPct)}%</strong> complete</span>
          </div>
        </div>

        {/* Activity Cards */}
        <div className="cards-grid">
          {SLOTS.map((slot) => {
            const slotData = today ? today[slot.key] : null;
            const count = slotData?.count ?? 0;
            const done = slotData?.done ?? false;
            const isLoading = loadingSlot?.startsWith(slot.key);

            return (
              <div key={slot.key} className={`activity-card ${slot.color} ${done ? 'done' : ''}`}>
                <div className="card-header">
                  <div className="card-icon">{slot.icon}</div>
                  {done && <span className="card-done-badge">✓ Done</span>}
                </div>

                <div className={`card-slot ${slot.color}`}>{slot.label}</div>
                <div className="card-activity">{slot.activity}</div>

                {!today ? (
                  <div className="loading-card"><div className="spinner" /></div>
                ) : (
                  <>
                    <div className="count-display">
                      <div className="count-number">{count}</div>
                      <div className="count-label">{count === 1 ? 'time' : 'times'}</div>
                    </div>

                    <div className="count-controls">
                      <button
                        className="btn-count decrement"
                        onClick={() => handleAction(slot.key, 'decrement')}
                        disabled={count === 0 || isLoading}
                      >−</button>
                      <button
                        className="btn-count increment"
                        onClick={() => handleAction(slot.key, 'increment')}
                        disabled={isLoading}
                      >+</button>
                    </div>

                    <button
                      className={`btn-done ${done ? 'unmark' : 'mark'}`}
                      onClick={() => handleAction(slot.key, done ? 'undone' : 'done')}
                      disabled={isLoading}
                    >
                      {done ? '↩ Mark Undone' : '✓ Mark as Done'}
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* History */}
        <div className="history-section">
          <div className="section-title">Recent History</div>
          {history.length === 0 ? (
            <div className="empty-state">No history yet. Start logging activities above!</div>
          ) : (
            <div className="history-list">
              {history.map((record) => (
                <div key={record.id || record.date} className="history-row">
                  <div>
                    <div className="history-date">{formatDateShort(record.date)}</div>
                    {record.date === todayDate && <div className="history-today">Today</div>}
                  </div>
                  {SLOTS.map((slot) => {
                    const s = record[slot.key] || {};
                    return (
                      <div key={slot.key} className="history-slot">
                        <div className="history-slot-name">{slot.label}</div>
                        <div className="history-slot-count">{s.count ?? 0}</div>
                        {s.done
                          ? <div className="history-slot-done">✓ Done</div>
                          : <div className="history-slot-pending">–</div>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
