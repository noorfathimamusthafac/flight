import React from 'react';
import { useNavigate } from 'react-router-dom';

export const BookingModal = ({ booking, onClose }) => {
  const navigate = useNavigate();

  if (!booking) return null;

  const flight = booking.flight;
  const primaryPassenger = booking.passengers && booking.passengers[0];

  const handleGoToBookings = () => {
    onClose();
    navigate('/my-bookings');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🎉</span>
            <div>
              <h3 style={{ fontSize: '18px' }}>Booking Confirmed!</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Your e-ticket has been successfully issued.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close Modal">✕</button>
        </div>

        <div className="modal-body">
          {/* PNR Banner */}
          <div className="pnr-ticket">
            <div className="pnr-hero-row">
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '700' }}>
                  BOOKING REFERENCE (PNR)
                </div>
                <div className="pnr-display">{booking.pnr}</div>
              </div>
              <span className="status-badge-confirmed">CONFIRMED</span>
            </div>

            {/* Flight Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block' }}>AIRLINE & FLIGHT</span>
                <strong style={{ fontSize: '15px' }}>{flight?.airline || 'SkyBook Air'} ({flight?.flight_number})</strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block' }}>ROUTE</span>
                <strong style={{ fontSize: '15px' }}>{flight?.search_origin} ➔ {flight?.search_destination}</strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block' }}>DEPARTURE TIME</span>
                <span>{flight?.departure_time} ({booking.travel_date})</span>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block' }}>ARRIVAL TIME</span>
                <span>{flight?.arrival_time}</span>
              </div>
            </div>

            {/* Passenger & Transaction Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block' }}>LEAD PASSENGER</span>
                <strong>{primaryPassenger?.full_name || 'Traveler'}</strong>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Seat: {primaryPassenger?.seat_number || '12A'}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block' }}>AMOUNT PAID</span>
                <strong style={{ color: 'var(--accent-cyan)', fontSize: '18px' }}>
                  ₹{booking.total_amount?.toLocaleString('en-IN')}
                </strong>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Ref: {booking.transaction?.reference || 'Simulated Card'}
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp Notification Alert */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <span style={{ fontSize: '20px' }}>📲</span>
            <div style={{ fontSize: '13px' }}>
              <strong style={{ color: '#34d399', display: 'block' }}>WhatsApp Telemetry Dispatched</strong>
              Booking confirmation and e-ticket itinerary queued to <strong>{booking.contact_phone}</strong>.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleGoToBookings} className="btn btn-primary btn-full">
              View My Bookings
            </button>
            <button onClick={onClose} className="btn btn-secondary">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
