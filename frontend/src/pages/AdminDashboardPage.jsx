import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/client';
import BarChart from '../components/BarChart';
import UserEngagementModal from '../components/UserEngagementModal';

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('bookings'); // bookings, users, login-logs, search-logs, transactions
  const [loadingStats, setLoadingStats] = useState(true);

  // Table state
  const [tableData, setTableData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [tableLoading, setTableLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Fetch High-Level Stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminApi.getStats();
        setStats(res.data);
      } catch (err) {
        console.error("Failed to load admin stats:", err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  // Fetch Active Table Data with Pagination
  useEffect(() => {
    const fetchTableData = async () => {
      setTableLoading(true);
      try {
        let res;
        const params = { page, limit: 10 };

        if (activeTab === 'users') {
          if (searchTerm) params.q = searchTerm;
          if (filterStatus) params.role = filterStatus;
          res = await adminApi.getUsers(params);
        } else if (activeTab === 'login-logs') {
          if (searchTerm) params.q = searchTerm;
          if (filterStatus !== '') params.success = filterStatus === 'true';
          res = await adminApi.getLoginLogs(params);
        } else if (activeTab === 'search-logs') {
          if (searchTerm) params.origin = searchTerm;
          res = await adminApi.getSearchLogs(params);
        } else if (activeTab === 'bookings') {
          if (searchTerm) params.pnr = searchTerm;
          if (filterStatus) params.status = filterStatus;
          res = await adminApi.getBookings(params);
        } else if (activeTab === 'transactions') {
          if (filterStatus) params.status = filterStatus;
          res = await adminApi.getTransactions(params);
        }

        if (res && res.data) {
          setTableData(res.data);
        }
      } catch (err) {
        console.error(`Error loading ${activeTab}:`, err);
      } finally {
        setTableLoading(false);
      }
    };

    fetchTableData();
  }, [activeTab, page, searchTerm, filterStatus]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    setSearchTerm('');
    setFilterStatus('');
  };

  return (
    <div className="container" style={{ padding: '36px 24px' }}>
      
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="badge-admin">SECURITY LEVEL: ADMIN</span>
          <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>Audited Operations Console</span>
        </div>
        <h2 style={{ fontSize: '28px', marginTop: '6px' }}>SkyBook Mission Operations</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Real-time metrics, telemetry logs, bookings, and financial transaction settlement.
        </p>
      </div>

      {/* KPI Summary Cards */}
      <div className="admin-stats-grid">
        <div className="stat-card">
          <span style={{ fontSize: '13px', color: 'var(--text-dim)', fontWeight: '700' }}>TOTAL USERS</span>
          <div className="stat-num">{loadingStats ? '...' : stats?.total_users?.toLocaleString()}</div>
          <span style={{ fontSize: '12px', color: 'var(--accent-cyan)' }}>Registered Sky Club Accounts</span>
        </div>

        <div className="stat-card">
          <span style={{ fontSize: '13px', color: 'var(--text-dim)', fontWeight: '700' }}>SEARCHES TODAY</span>
          <div className="stat-num">{loadingStats ? '...' : stats?.searches_today?.toLocaleString()}</div>
          <span style={{ fontSize: '12px', color: 'var(--accent-amber)' }}>Live Kerala-Gulf Inquiries</span>
        </div>

        <div className="stat-card">
          <span style={{ fontSize: '13px', color: 'var(--text-dim)', fontWeight: '700' }}>TOTAL BOOKINGS</span>
          <div className="stat-num">{loadingStats ? '...' : stats?.total_bookings?.toLocaleString()}</div>
          <span style={{ fontSize: '12px', color: 'var(--accent-green)' }}>Confirmed E-Tickets</span>
        </div>

        <div className="stat-card">
          <span style={{ fontSize: '13px', color: 'var(--text-dim)', fontWeight: '700' }}>GROSS REVENUE</span>
          <div className="stat-num" style={{ color: 'var(--accent-cyan)' }}>
            {loadingStats ? '...' : `₹${stats?.total_revenue?.toLocaleString('en-IN')}`}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Simulated Settled Volume</span>
        </div>
      </div>

      {/* Top Routes Bar Chart Component */}
      {stats && stats.top_routes && (
        <BarChart
          data={stats.top_routes}
          metric="bookings"
          title="Top Kerala-Gulf Routes Telemetry"
        />
      )}

      {/* Data Tables Section */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '24px'
      }}>
        {/* Table Selector Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleTabChange('bookings')}
            className={`btn btn-sm ${activeTab === 'bookings' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Bookings ({stats?.total_bookings || 0})
          </button>
          <button
            onClick={() => handleTabChange('users')}
            className={`btn btn-sm ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Users
          </button>
          <button
            onClick={() => handleTabChange('transactions')}
            className={`btn btn-sm ${activeTab === 'transactions' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Transactions
          </button>
          <button
            onClick={() => handleTabChange('login-logs')}
            className={`btn btn-sm ${activeTab === 'login-logs' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Login Audit Logs
          </button>
          <button
            onClick={() => handleTabChange('search-logs')}
            className={`btn btn-sm ${activeTab === 'search-logs' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Search Logs
          </button>
        </div>

        {/* Filter / Search Bar */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder={
              activeTab === 'bookings' ? "Search PNR..." :
              activeTab === 'users' ? "Search username or name..." :
              activeTab === 'search-logs' ? "Filter origin airport (e.g. COK)..." :
              "Search query..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-styled"
            style={{ maxWidth: '300px' }}
          />

          {activeTab === 'bookings' && (
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="select-styled"
              style={{ maxWidth: '180px' }}
            >
              <option value="">All Statuses</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          )}

          {activeTab === 'login-logs' && (
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="select-styled"
              style={{ maxWidth: '180px' }}
            >
              <option value="">All Attempts</option>
              <option value="true">Successful Logins</option>
              <option value="false">Failed Logins</option>
            </select>
          )}
        </div>

        {/* Dynamic Table Content */}
        <div className="table-responsive">
          {tableLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading data...
            </div>
          ) : tableData.items.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No records found.
            </div>
          ) : (
            <table className="admin-table">
              {/* BOOKINGS TABLE */}
              {activeTab === 'bookings' && (
                <>
                  <thead>
                    <tr>
                      <th>PNR</th>
                      <th>Traveler Route</th>
                      <th>Date</th>
                      <th>Total Paid</th>
                      <th>Contact Phone</th>
                      <th>Status</th>
                      <th>Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.items.map((b) => (
                      <tr key={b.id}>
                        <td>
                          <span style={{ fontFamily: 'var(--font-display)', fontWeight: '800', color: 'var(--accent-cyan)' }}>
                            {b.pnr}
                          </span>
                        </td>
                        <td>
                          <strong>{b.flight?.airline}</strong> ({b.flight?.search_origin} ➔ {b.flight?.search_destination})
                        </td>
                        <td>{b.travel_date}</td>
                        <td style={{ fontWeight: '700' }}>₹{b.total_amount?.toLocaleString('en-IN')}</td>
                        <td>{b.contact_phone}</td>
                        <td>
                          <span className="status-badge-confirmed">{b.status}</span>
                        </td>
                        <td style={{ color: 'var(--text-dim)', fontSize: '12px' }}>
                          {new Date(b.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {/* USERS TABLE */}
              {activeTab === 'users' && (
                <>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Username</th>
                      <th>Full Name</th>
                      <th>WhatsApp No.</th>
                      <th>Role</th>
                      <th>Created At</th>
                      <th>Engagement & Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.items.map((u) => (
                      <tr key={u.id}>
                        <td>#{u.id}</td>
                        <td style={{ fontWeight: '700' }}>{u.username}</td>
                        <td>{u.full_name}</td>
                        <td>{u.whatsapp_number}</td>
                        <td>
                          <span className={u.role === 'admin' ? 'badge-admin' : 'diff-badge'}>
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-dim)', fontSize: '12px' }}>
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          <button
                            onClick={() => setSelectedUserId(u.id)}
                            className="btn btn-secondary btn-sm"
                            style={{ borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}
                          >
                            View Engagement (360°) →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {/* TRANSACTIONS TABLE */}
              {activeTab === 'transactions' && (
                <>
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
                    {tableData.items.map((t) => (
                      <tr key={t.id}>
                        <td style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>{t.reference}</td>
                        <td>Booking #{t.booking_id}</td>
                        <td style={{ fontWeight: '700' }}>₹{t.amount?.toLocaleString('en-IN')}</td>
                        <td>•••• {t.card_last4}</td>
                        <td>
                          <span className="status-badge-confirmed">{t.status}</span>
                        </td>
                        <td style={{ color: 'var(--text-dim)', fontSize: '12px' }}>
                          {new Date(t.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {/* LOGIN LOGS TABLE */}
              {activeTab === 'login-logs' && (
                <>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Username</th>
                      <th>Result</th>
                      <th>IP Address</th>
                      <th>Client Agent</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.items.map((l) => (
                      <tr key={l.id}>
                        <td>#{l.id}</td>
                        <td style={{ fontWeight: '700' }}>{l.username}</td>
                        <td>
                          {l.success ? (
                            <span style={{ color: 'var(--accent-green)', fontWeight: '700' }}>SUCCESS</span>
                          ) : (
                            <span style={{ color: 'var(--accent-red)', fontWeight: '700' }}>FAILED</span>
                          )}
                        </td>
                        <td style={{ fontFamily: 'monospace' }}>{l.ip_address || '127.0.0.1'}</td>
                        <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {l.user_agent}
                        </td>
                        <td style={{ color: 'var(--text-dim)', fontSize: '12px' }}>
                          {new Date(l.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {/* SEARCH LOGS TABLE */}
              {activeTab === 'search-logs' && (
                <>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Route</th>
                      <th>Travel Date</th>
                      <th>Passengers</th>
                      <th>Client IP</th>
                      <th>Searched At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.items.map((s) => (
                      <tr key={s.id}>
                        <td>#{s.id}</td>
                        <td style={{ fontWeight: '700' }}>{s.origin} ➔ {s.destination}</td>
                        <td>{s.travel_date}</td>
                        <td>{s.passengers} Pax</td>
                        <td style={{ fontFamily: 'monospace' }}>{s.ip_address || '127.0.0.1'}</td>
                        <td style={{ color: 'var(--text-dim)', fontSize: '12px' }}>
                          {new Date(s.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

            </table>
          )}
        </div>

        {/* Pagination Bar */}
        <div className="pagination-bar">
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Showing page <strong>{tableData.page}</strong> of <strong>{tableData.pages}</strong> ({tableData.total} total items)
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || tableLoading}
              className="btn btn-secondary btn-sm"
            >
              ← Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(tableData.pages, p + 1))}
              disabled={page >= tableData.pages || tableLoading}
              className="btn btn-secondary btn-sm"
            >
              Next →
            </button>
          </div>
        </div>

      </div>

      {/* 360 User Engagement & Activity Modal */}
      {selectedUserId && (
        <UserEngagementModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}

    </div>
  );
};

export default AdminDashboardPage;
