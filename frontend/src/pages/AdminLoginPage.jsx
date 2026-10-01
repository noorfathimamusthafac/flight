import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AdminLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const loggedUser = await login(username, password);
      if (loggedUser.role !== 'admin') {
        setError("Access Denied: This account does not possess administrator privileges.");
        return;
      }
      navigate('/admin', { replace: true });
    } catch (err) {
      console.error("Admin Login failed:", err);
      if (err.response?.status === 429) {
        setError(err.response?.data?.detail || "Too many failed attempts. Security rate-limit triggered.");
      } else {
        setError(err.response?.data?.detail || "Invalid administrator credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '440px', padding: '60px 20px' }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(7, 11, 20, 0.98))',
        border: '1px solid rgba(99, 102, 241, 0.4)',
        borderRadius: 'var(--radius-lg)',
        padding: '36px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 20px rgba(99, 102, 241, 0.15)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
            borderRadius: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            marginBottom: '12px',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
          }}>
            🛡️
          </div>
          <div style={{ display: 'inline-block', marginBottom: '6px' }}>
            <span className="badge-admin">SECURITY ACCESS LEVEL 4</span>
          </div>
          <h2 style={{ fontSize: '22px', marginTop: '4px' }}>Admin Operations Gateway</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Restricted console for flight telemetry, passenger logs, and financial settlement.
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
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
            <label className="field-label" style={{ color: '#a5b4fc' }}>Admin Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin"
              className="input-styled"
              style={{ borderColor: 'rgba(99, 102, 241, 0.3)' }}
              required
            />
          </div>

          <div className="field-group" style={{ marginBottom: '24px' }}>
            <label className="field-label" style={{ color: '#a5b4fc' }}>Security Key / Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-styled"
              style={{ borderColor: 'rgba(99, 102, 241, 0.3)' }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-full"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #4338ca)',
              color: '#fff',
              padding: '13px',
              fontWeight: '700',
              boxShadow: '0 4px 18px rgba(99, 102, 241, 0.4)'
            }}
          >
            {loading ? 'Authenticating Gateway...' : 'Unlock Mission Control Console →'}
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          padding: '14px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '12px',
          color: 'var(--text-dim)',
          textAlign: 'center'
        }}>
          🔑 <strong>Default Admin Credentials:</strong><br />
          Username: <code>admin</code> • Password: <code>Admin@123</code>
        </div>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px' }}>
          <Link to="/login" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            ← Back to Traveler Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
