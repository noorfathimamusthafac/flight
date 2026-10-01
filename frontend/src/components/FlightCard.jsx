import React from 'react';

export const FlightCard = ({ flight, onSelect }) => {
  const formatDuration = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins > 0 ? `${mins}m` : ''}`;
  };

  const getTagClass = (tag) => {
    switch (tag.toLowerCase()) {
      case 'cheapest': return 'tag-cheapest';
      case 'fastest': return 'tag-fastest';
      case 'fewest stops': return 'tag-fewest-stops';
      case 'best value': return 'tag-best-value';
      default: return 'tag-badge';
    }
  };

  return (
    <div className="flight-card">
      <div className="card-main-info">
        
        {/* Header: Airline, Flight No, Aircraft & Tags */}
        <div className="airline-badge-row">
          <span className="airline-name">{flight.airline}</span>
          <span className="flight-meta-tag">{flight.flight_number}</span>
          <span className="flight-meta-tag">{flight.aircraft}</span>

          <div className="tags-row">
            {flight.tags && flight.tags.map((tag, idx) => (
              <span key={idx} className={`tag-badge ${getTagClass(tag)}`}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Timeline Visualization: Dep Time -> Duration/Stops -> Arr Time */}
        <div className="flight-timeline">
          <div className="time-point">
            <div className="time">{flight.departure_time}</div>
            <div className="city">{flight.search_origin}</div>
          </div>

          <div className="route-middle">
            <div className="duration-label">{formatDuration(flight.duration_minutes)}</div>
            <div className="flight-line">
              <span className="flight-line-plane">✈</span>
            </div>
            <div className="stops-label">
              {flight.stops === 0 ? (
                <span className="stops-direct">Direct Flight</span>
              ) : (
                <span>
                  {flight.stops} Stop{flight.stops > 1 ? 's' : ''} 
                  {flight.layover_airport ? ` (${flight.layover_airport} ${formatDuration(flight.layover_duration_minutes || 60)})` : ''}
                </span>
              )}
            </div>
          </div>

          <div className="time-point right">
            <div className="time">{flight.arrival_time}</div>
            <div className="city">{flight.search_destination}</div>
          </div>
        </div>

        {/* Baggage & Seats Available Meta */}
        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-dim)' }}>
          <span>🧳 {flight.baggage}</span>
          <span>🪑 {flight.seats_available} seats remaining</span>
        </div>

      </div>

      {/* Price & Action Side */}
      <div className="card-price-action">
        <div style={{ textAlign: 'right' }}>
          <div className="price-currency">Standard Fare</div>
          <div className="price-amount">₹{flight.price_inr.toLocaleString('en-IN')}</div>
          
          {flight.price_diff_vs_cheapest === 0 ? (
            <span className="diff-badge cheapest-badge">★ Lowest Price</span>
          ) : (
            <span className="diff-badge">
              +₹{flight.price_diff_vs_cheapest.toLocaleString('en-IN')} vs cheapest
            </span>
          )}
        </div>

        <button 
          onClick={() => onSelect(flight)} 
          className="btn btn-primary btn-sm"
          style={{ width: '100%', marginTop: '6px' }}
        >
          Select Flight →
        </button>
      </div>
    </div>
  );
};

export default FlightCard;
