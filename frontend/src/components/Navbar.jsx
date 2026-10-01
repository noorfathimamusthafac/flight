import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Link to="/" className="brand-logo">
          <div className="brand-icon">✈</div>
          <span className="brand-title">SkyBook</span>
        </Link>

        <nav className="nav-links">
          <Link to="/" className="nav-link">Search Flights</Link>
          
          {isAuthenticated && (
            <Link to="/my-bookings" className="nav-link">My Bookings</Link>
          )}

          {isAdmin ? (
            <Link to="/admin" className="nav-link" style={{ color: '#a5b4fc', fontWeight: '700' }}>
              🛡️ Admin Operations <span className="badge-admin">ONLINE</span>
            </Link>
          ) : (
            <Link to="/admin/login" className="nav-link" style={{ fontSize: '13px' }}>
              Admin Gateway
            </Link>
          )}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isAuthenticated ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>
                    {user?.full_name}
                  </span>
                  <span className={user?.role === 'admin' ? 'badge-admin' : 'diff-badge'} style={{ fontSize: '10px' }}>
                    {user?.role?.toUpperCase()}
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {user?.role === 'admin' ? 'System Administrator' : user?.whatsapp_number}
                </span>
              </div>
              <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Traveler Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
              <Link
                to="/admin/login"
                className="btn btn-sm"
                style={{
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: '#a5b4fc',
                  border: '1px solid rgba(99, 102, 241, 0.3)'
                }}
              >
                🛡️ Admin
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
