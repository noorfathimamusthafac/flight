import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const loggedUser = await login(username, password);
      // If an admin logs in through traveler portal, redirect to admin or origin
      if (loggedUser.role === 'admin' && from === '/') {
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error("Login failed:", err);
      if (err.response?.status === 429) {
        setError(err.response?.data?.detail || "Too many failed attempts. Please wait a few minutes.");
      } else {
        setError(err.response?.data?.detail || "Invalid username or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '440px', padding: '60px 20px' }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '36px',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-indigo))',
            borderRadius: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            marginBottom: '12px'
          }}>
            ✈
          </div>
          <h2 style={{ fontSize: '22px' }}>Traveler Sign In</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Sign in to access your flight bookings, lock guaranteed rates, and receive WhatsApp boarding passes.
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px',
            color: '#fca5a5',
            fontSize: '13px',
            marginBottom: '18px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field-group" style={{ marginBottom: '16px' }}>
            <label className="field-label">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. traveler_john"
              className="input-styled"
              required
            />
          </div>

          <div className="field-group" style={{ marginBottom: '24px' }}>
            <label className="field-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-styled"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-full"
            style={{ padding: '12px' }}
          >
            {loading ? 'Authenticating...' : 'Sign In as Traveler →'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
          Don't have a SkyBook account?{' '}
          <Link to="/register" style={{ color: 'var(--accent-cyan)', fontWeight: '600' }}>
            Register here
          </Link>
        </div>

        <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid var(--border-subtle)' }} />

        {/* Dedicated Admin Portal Switcher */}
        <div style={{
          padding: '14px',
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: 'var(--radius-sm)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Looking for the Administrator Console?
          </div>
          <Link
            to="/admin/login"
            className="btn btn-sm"
            style={{
              background: 'rgba(99, 102, 241, 0.2)',
              color: '#a5b4fc',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              width: '100%'
            }}
          >
            🛡️ Switch to Admin Gateway
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
