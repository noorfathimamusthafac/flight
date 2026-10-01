import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const KERALA_ORIGINS = [
  { code: 'COK', name: 'Kochi (Cochin) - COK' },
  { code: 'CCJ', name: 'Kozhikode (Calicut) - CCJ' },
  { code: 'TRV', name: 'Thiruvananthapuram - TRV' },
  { code: 'CNN', name: 'Kannur - CNN' },
];

const GULF_DESTINATIONS = [
  { code: 'DXB', name: 'Dubai, UAE - DXB' },
  { code: 'AUH', name: 'Abu Dhabi, UAE - AUH' },
  { code: 'DOH', name: 'Doha, Qatar - DOH' },
  { code: 'KWI', name: 'Kuwait City, Kuwait - KWI' },
  { code: 'MCT', name: 'Muscat, Oman - MCT' },
];

export const HomeSearchPage = () => {
  const navigate = useNavigate();

  // Tomorrow's date in YYYY-MM-DD
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [fromCode, setFromCode] = useState('COK');
  const [toCode, setToCode] = useState('DXB');
  const [travelDate, setTravelDate] = useState(defaultDateStr);
  const [passengers, setPassengers] = useState(1);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/results?from=${fromCode}&to=${toCode}&date=${travelDate}&passengers=${passengers}`);
  };

  const handleQuickRoute = (from, to) => {
    setFromCode(from);
    setToCode(to);
    navigate(`/results?from=${from}&to=${to}&date=${travelDate}&passengers=${passengers}`);
  };

  return (
    <div className="container">
      <section className="hero">
        <div className="hero-pill">
          <span>⚡</span> Real-time AI Rate Tracker & Instant PNR Engine
        </div>
        <h1 className="hero-title">
          Kerala to Gulf Aviation Booking
        </h1>
        <p className="hero-subtitle">
          Discover guaranteed live fares from Kochi, Calicut, Trivandrum, and Kannur to Dubai, Abu Dhabi, Doha, Kuwait, and Muscat.
        </p>

        {/* Flight Search Card */}
        <div className="search-card">
          <form onSubmit={handleSearch}>
            <div className="search-grid">
              
              {/* Origin */}
              <div className="field-group">
                <label className="field-label">From (Kerala Origin)</label>
                <select
                  value={fromCode}
                  onChange={(e) => setFromCode(e.target.value)}
                  className="select-styled"
                  required
                >
                  {KERALA_ORIGINS.map((orig) => (
                    <option key={orig.code} value={orig.code}>{orig.name}</option>
                  ))}
                </select>
              </div>

              {/* Destination */}
              <div className="field-group">
                <label className="field-label">To (Gulf Destination)</label>
                <select
                  value={toCode}
                  onChange={(e) => setToCode(e.target.value)}
                  className="select-styled"
                  required
                >
                  {GULF_DESTINATIONS.map((dest) => (
                    <option key={dest.code} value={dest.code}>{dest.name}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div className="field-group">
                <label className="field-label">Departure Date</label>
                <input
                  type="date"
                  value={travelDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="input-styled"
                  required
                />
              </div>

              {/* Passengers */}
              <div className="field-group">
                <label className="field-label">Passengers</label>
                <select
                  value={passengers}
                  onChange={(e) => setPassengers(Number(e.target.value))}
                  className="select-styled"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <option key={num} value={num}>
                      {num} Passenger{num > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              {/* Quick Route Shortcuts */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '600' }}>POPULAR:</span>
                <button type="button" onClick={() => handleQuickRoute('COK', 'DXB')} className="btn btn-secondary btn-sm">
                  COK → DXB
                </button>
                <button type="button" onClick={() => handleQuickRoute('CCJ', 'DOH')} className="btn btn-secondary btn-sm">
                  CCJ → DOH
                </button>
                <button type="button" onClick={() => handleQuickRoute('TRV', 'AUH')} className="btn btn-secondary btn-sm">
                  TRV → AUH
                </button>
                <button type="button" onClick={() => handleQuickRoute('CNN', 'KWI')} className="btn btn-secondary btn-sm">
                  CNN → KWI
                </button>
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '12px 32px' }}>
                Search Flights →
              </button>
            </div>
          </form>
        </div>

        {/* Feature Badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap', marginTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--accent-cyan)' }}>✓</span> Guaranteed Price Lock
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--accent-green)' }}>✓</span> Instant 6-Char PNR
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--accent-amber)' }}>✓</span> Automated WhatsApp E-Ticket
          </div>
        </div>

      </section>
    </div>
  );
};

export default HomeSearchPage;
