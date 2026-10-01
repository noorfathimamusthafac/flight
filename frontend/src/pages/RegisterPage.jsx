import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('+91');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register({
        username,
        full_name: fullName,
        whatsapp_number: whatsappNumber,
        password,
      });
      navigate('/');
    } catch (err) {
      console.error("Registration failed:", err);
      const detail = err.response?.data?.detail;
      const errors = err.response?.data?.errors;
      if (errors && errors.length > 0) {
        setError(errors.join(', '));
      } else {
        setError(detail || "Registration failed. Please check your details.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '480px', padding: '50px 20px' }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '36px',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '22px' }}>Create SkyBook Account</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Register to book flights and receive real-time WhatsApp boarding passes.
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
          <div className="field-group" style={{ marginBottom: '14px' }}>
            <label className="field-label">Username *</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. jameela_k"
              className="input-styled"
              required
            />
          </div>

          <div className="field-group" style={{ marginBottom: '14px' }}>
            <label className="field-label">Full Name *</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Jameela Khan"
              className="input-styled"
              required
            />
          </div>

          <div className="field-group" style={{ marginBottom: '14px' }}>
            <label className="field-label">WhatsApp Number (E.164 Format) *</label>
            <input
              type="tel"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="+919876543210"
              className="input-styled"
              required
            />
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
              Must include country code starting with '+' (e.g. +91 for India, +971 for UAE).
            </span>
          </div>

          <div className="field-group" style={{ marginBottom: '22px' }}>
            <label className="field-label">Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
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
            {loading ? 'Creating Account...' : 'Register & Continue →'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-cyan)', fontWeight: '600' }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
