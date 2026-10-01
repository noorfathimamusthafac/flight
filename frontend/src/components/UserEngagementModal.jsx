import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/client';

export const UserEngagementModal = ({ userId, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('transactions'); // transactions, bookings, searches, logins
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEngagement = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminApi.getUserEngagement(userId);
        setData(res.data);
      } catch (err) {
        console.error("Error loading user engagement:", err);
        setError("Failed to load user engagement profile.");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchEngagement();
    }
  }, [userId]);

  if (!userId) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: '880px', width: '95%' }}>
        
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>👤</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '18px' }}>User Engagement & Audit Profile</h3>
                {data?.user && (
                  <span className={data.user.role === 'admin' ? 'badge-admin' : 'diff-badge'}>
                    {data.user.role.toUpperCase()}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Complete transaction history, booking activity, and search telemetry.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close Modal">✕</button>
        </div>

        <div className="modal-body" style={{ maxHeight: '82vh' }}>
          
          {loading && (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading user engagement profile...
            </div>
          )}

          {error && (
            <div style={{ padding: '20px', color: '#fca5a5', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)' }}>
              {error}
            </div>
          )}

          {!loading && data && (
            <>
              {/* User Bio Card */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                marginBottom: '20px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px'
              }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block' }}>FULL NAME</span>
                  <strong style={{ fontSize: '15px' }}>{data.user.full_name}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block' }}>USERNAME</span>
                  <strong style={{ fontSize: '15px', color: 'var(--accent-cyan)' }}>@{data.user.username}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block' }}>WHATSAPP NUMBER</span>
                  <strong style={{ fontSize: '15px' }}>{data.user.whatsapp_number}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block' }}>ACCOUNT JOINED</span>
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                    {new Date(data.user.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Engagement KPI Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '700' }}>TOTAL SEARCHES</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent-amber)', marginTop: '4px' }}>
                    {data.total_searches}
                  </div>
                </div>

                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '700' }}>TOTAL BOOKINGS</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent-green)', marginTop: '4px' }}>
                    {data.total_bookings}
                  </div>
                </div>

                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '700' }}>LIFETIME VALUE (SPENT)</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent-cyan)', marginTop: '4px' }}>
                    ₹{data.total_spent?.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Engagement Tab Navigation */}
              <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '16px' }}>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className={`btn btn-sm ${activeTab === 'transactions' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Transactions ({data.transactions?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className={`btn btn-sm ${activeTab === 'bookings' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Bookings ({data.bookings?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('searches')}
                  className={`btn btn-sm ${activeTab === 'searches' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Search Queries ({data.searches?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('logins')}
                  className={`btn btn-sm ${activeTab === 'logins' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Login History ({data.logins?.length || 0})
                </button>
              </div>

              {/* TAB 1: TRANSACTIONS */}
              {activeTab === 'transactions' && (
                <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {data.transactions.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No payment transactions recorded for this user.
                    </div>
                  ) : (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Reference</th>
                          <th>Booking ID</th>
                          <th>Amount</th>
                          <th>Card Last 4</th>
                          <th>Status</th>
                          <th>Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.transactions.map((t) => (
                          <tr key={t.id}>
                            <td style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>{t.reference}</td>
                            <td>Booking #{t.booking_id}</td>
                            <td style={{ fontWeight: '700' }}>₹{t.amount?.toLocaleString('en-IN')}</td>
                            <td>•••• {t.card_last4}</td>
                            <td>
                              <span className="status-badge-confirmed">{t.status}</span>
                            </td>
                            <td style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                              {new Date(t.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* TAB 2: BOOKINGS */}
              {activeTab === 'bookings' && (
                <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {data.bookings.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No flight bookings placed by this user yet.
                    </div>
                  ) : (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>PNR</th>
                          <th>Route</th>
                          <th>Travel Date</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Booked At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.bookings.map((b) => (
                          <tr key={b.id}>
                            <td>
                              <strong style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-display)' }}>
                                {b.pnr}
                              </strong>
                            </td>
                            <td>{b.flight?.search_origin} ➔ {b.flight?.search_destination} ({b.flight?.airline})</td>
                            <td>{b.travel_date}</td>
                            <td style={{ fontWeight: '700' }}>₹{b.total_amount?.toLocaleString('en-IN')}</td>
                            <td>
                              <span className="status-badge-confirmed">{b.status}</span>
                            </td>
                            <td style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                              {new Date(b.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* TAB 3: SEARCH QUERIES */}
              {activeTab === 'searches' && (
                <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {data.searches.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No flight searches recorded for this user.
                    </div>
                  ) : (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Airway Corridor</th>
                          <th>Target Date</th>
                          <th>Pax</th>
                          <th>Client IP</th>
                          <th>Search Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.searches.map((s) => (
                          <tr key={s.id}>
                            <td><strong>{s.origin} ➔ {s.destination}</strong></td>
                            <td>{s.travel_date}</td>
                            <td>{s.passengers} Passenger{s.passengers > 1 ? 's' : ''}</td>
                            <td style={{ fontFamily: 'monospace' }}>{s.ip_address || '127.0.0.1'}</td>
                            <td style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                              {new Date(s.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* TAB 4: LOGIN AUDIT */}
              {activeTab === 'logins' && (
                <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {data.logins.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No login logs recorded.
                    </div>
                  ) : (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Timestamp</th>
                          <th>Result</th>
                          <th>IP Address</th>
                          <th>User Agent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.logins.map((l) => (
                          <tr key={l.id}>
                            <td style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                              {new Date(l.created_at).toLocaleString()}
                            </td>
                            <td>
                              {l.success ? (
                                <span style={{ color: 'var(--accent-green)', fontWeight: '700' }}>SUCCESS</span>
                              ) : (
                                <span style={{ color: 'var(--accent-red)', fontWeight: '700' }}>FAILED</span>
                              )}
                            </td>
                            <td style={{ fontFamily: 'monospace' }}>{l.ip_address || '127.0.0.1'}</td>
                            <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {l.user_agent}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </>
          )}

          <div style={{ marginTop: '24px', textAlign: 'right' }}>
            <button onClick={onClose} className="btn btn-secondary">
              Close Profile
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default UserEngagementModal;
