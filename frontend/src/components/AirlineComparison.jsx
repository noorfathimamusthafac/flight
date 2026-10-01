import React from 'react';

export const AirlineComparison = ({ comparisons }) => {
  if (!comparisons || comparisons.length === 0) return null;

  return (
    <div className="comparison-card">
      <h3>
        <span>📊</span> Airline Route Price Comparison
      </h3>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
        Compare base fare options across operating carriers on this route.
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Airline Carrier</th>
              <th>Starting Fare</th>
              <th>Price Difference</th>
              <th>Direct Service</th>
              <th>Available Departures</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((item, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                  {item.airline}
                </td>
                <td style={{ fontFamily: 'var(--font-display)', fontWeight: '700' }}>
                  ₹{item.min_price.toLocaleString('en-IN')}
                </td>
                <td>
                  {item.price_diff_vs_cheapest === 0 ? (
                    <span className="diff-badge cheapest-badge">Cheapest Carrier</span>
                  ) : (
                    <span className="diff-badge">
                      +₹{item.price_diff_vs_cheapest.toLocaleString('en-IN')}
                    </span>
                  )}
                </td>
                <td>
                  {item.direct_flight_available ? (
                    <span style={{ color: 'var(--accent-green)', fontWeight: '600', fontSize: '13px' }}>
                      ✓ Direct Available
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-dim)', fontSize: '13px' }}>
                      Connecting Only
                    </span>
                  )}
                </td>
                <td style={{ color: 'var(--text-muted)' }}>
                  {item.flight_count} option{item.flight_count > 1 ? 's' : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AirlineComparison;
