import React, { useState } from 'react';

export const BarChart = ({ data, metric = 'bookings', title = 'Top Flight Routes Performance' }) => {
  const [activeMetric, setActiveMetric] = useState(metric);

  if (!data || data.length === 0) {
    return <div style={{ color: 'var(--text-muted)', padding: '20px' }}>No route data available yet.</div>;
  }

  // Get max value for scaling
  const maxValue = Math.max(...data.map(d => d[activeMetric] || 1));

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      padding: '24px',
      marginBottom: '32px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '18px' }}>{title}</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Comparing volume and engagement across Kerala-Gulf routes
          </p>
        </div>

        {/* Metric Switcher */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveMetric('bookings')}
            className={`btn btn-sm ${activeMetric === 'bookings' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Bookings
          </button>
          <button
            onClick={() => setActiveMetric('searches')}
            className={`btn btn-sm ${activeMetric === 'searches' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Searches
          </button>
          <button
            onClick={() => setActiveMetric('revenue')}
            className={`btn btn-sm ${activeMetric === 'revenue' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Revenue (₹)
          </button>
        </div>
      </div>

      {/* Chart Bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {data.map((item, idx) => {
          const val = item[activeMetric] || 0;
          const percentage = Math.max(8, Math.min(100, (val / maxValue) * 100));
          const formattedVal = activeMetric === 'revenue' 
            ? `₹${val.toLocaleString('en-IN')}` 
            : val.toLocaleString();

          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '100px', fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', textAlign: 'right' }}>
                {item.route}
              </div>
              <div style={{ flex: 1, height: '28px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                <div
                  style={{
                    width: `${percentage}%`,
                    height: '100%',
                    background: activeMetric === 'revenue' 
                      ? 'linear-gradient(90deg, #10b981, #38bdf8)' 
                      : activeMetric === 'bookings' 
                        ? 'linear-gradient(90deg, #6366f1, #38bdf8)' 
                        : 'linear-gradient(90deg, #f59e0b, #ec4899)',
                    borderRadius: '6px',
                    transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: '10px'
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#090d16' }}>
                    {formattedVal}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BarChart;
