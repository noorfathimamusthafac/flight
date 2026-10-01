import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { flightsApi, bookingsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import BookingModal from '../components/BookingModal';

export const BookingCheckoutPage = () => {
  const { flightId } = useParams();
  const [searchParams] = useSearchParams();
  const passengerCount = Number(searchParams.get('passengers') || 1);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [flight, setFlight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Form states
  const [passengers, setPassengers] = useState(() => {
    return Array.from({ length: passengerCount }, (_, i) => ({
      full_name: i === 0 && user ? user.full_name : '',
      age: 30,
      gender: 'Male',
      passport_number: '',
      seat_number: `${12 + i}A`,
    }));
  });

  const [contactPhone, setContactPhone] = useState(user?.whatsapp_number || '+91');
  const [contactEmail, setContactEmail] = useState(`${user?.username || 'traveler'}@skybook.air`);

  // Mock Payment state (UI only, never stored in DB)
  const [cardHolder, setCardHolder] = useState(user?.full_name || 'ELEANOR VANCE');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('888');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchFlight = async () => {
      try {
        const res = await flightsApi.getById(flightId);
        setFlight(res.data);
      } catch (err) {
        console.error("Error fetching flight:", err);
        setError("Flight itinerary details could not be found.");
      } finally {
        setLoading(false);
      }
    };

    fetchFlight();
  }, [flightId, isAuthenticated, navigate]);

  const handlePassengerChange = (index, field, value) => {
    setPassengers((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const handleCardNumberChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = val.replace(/(.{4})/g, '$1 ').trim();
    setCardNumber(formatted);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        flight_id: flight.id,
        passengers: passengers.map(p => ({
          full_name: p.full_name,
          age: Number(p.age),
          gender: p.gender,
          passport_number: p.passport_number || null,
          seat_number: p.seat_number,
        })),
        contact_phone: contactPhone,
        contact_email: contactEmail,
        card_number: cardNumber,
        card_expiry: cardExpiry,
        card_cvv: cardCvv,
        card_holder: cardHolder,
      };

      const res = await bookingsApi.create(payload);
      setConfirmedBooking(res.data);
    } catch (err) {
      console.error("Booking failed:", err);
      setError(err.response?.data?.detail || "Booking failed. Please review your details and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        Loading flight and fare details...
      </div>
    );
  }

  if (error && !flight) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h3 style={{ color: 'var(--accent-red)' }}>{error}</h3>
        <button onClick={() => navigate('/')} className="btn btn-secondary" style={{ marginTop: '16px' }}>
          Back to Search
        </button>
      </div>
    );
  }

  const totalAmount = flight ? flight.price_inr * passengers.length : 0;

  return (
    <div className="container" style={{ padding: '36px 24px' }}>
      
      <h2 style={{ fontSize: '26px', marginBottom: '8px' }}>
        Review Itinerary & Complete Booking
      </h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '28px' }}>
        Your flight price is locked. Provide passenger details and simulated card payment.
      </p>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#fca5a5',
          padding: '14px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', alignItems: 'start' }}>
        
        {/* Left Form Column */}
        <div>
          <form onSubmit={handleSubmit}>
            
            {/* 1. Passenger Information Cards */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>👤</span> Passenger Details
              </h3>

              {passengers.map((p, idx) => (
                <div key={idx} style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: idx < passengers.length - 1 ? '16px' : '0',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent-cyan)', marginBottom: '12px' }}>
                    Passenger #{idx + 1}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div className="field-group">
                      <label className="field-label">Full Name (as per Passport) *</label>
                      <input
                        type="text"
                        value={p.full_name}
                        onChange={(e) => handlePassengerChange(idx, 'full_name', e.target.value)}
                        placeholder="e.g. Eleanor Vance"
                        className="input-styled"
                        required
                      />
                    </div>
                    <div className="field-group">
                      <label className="field-label">Age *</label>
                      <input
                        type="number"
                        min="1"
                        max="110"
                        value={p.age}
                        onChange={(e) => handlePassengerChange(idx, 'age', e.target.value)}
                        className="input-styled"
                        required
                      />
                    </div>
                    <div className="field-group">
                      <label className="field-label">Gender *</label>
                      <select
                        value={p.gender}
                        onChange={(e) => handlePassengerChange(idx, 'gender', e.target.value)}
                        className="select-styled"
                        required
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                    <div className="field-group">
                      <label className="field-label">Passport / ID Number</label>
                      <input
                        type="text"
                        value={p.passport_number}
                        onChange={(e) => handlePassengerChange(idx, 'passport_number', e.target.value)}
                        placeholder="e.g. Z8921004"
                        className="input-styled"
                      />
                    </div>
                    <div className="field-group">
                      <label className="field-label">Seat Assigned</label>
                      <input
                        type="text"
                        value={p.seat_number}
                        onChange={(e) => handlePassengerChange(idx, 'seat_number', e.target.value)}
                        className="input-styled"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Contact info for WhatsApp delivery */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px' }}>
                <div className="field-group">
                  <label className="field-label">WhatsApp Contact Number (E.164) *</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+919876543210"
                    className="input-styled"
                    required
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                    Instant booking confirmation & PNR will be dispatched here.
                  </span>
                </div>
                <div className="field-group">
                  <label className="field-label">Email Address</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="input-styled"
                    required
                  />
                </div>
              </div>
            </div>

            {/* 2. Mock Payment Card UI */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>💳</span> Simulated Payment Authorization
              </h3>
              
              <div style={{
                background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                marginBottom: '20px',
                maxWidth: '400px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <span style={{ fontWeight: '800', color: 'var(--accent-cyan)' }}>SKYBOOK PAY</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>DEBIT / CREDIT</span>
                </div>
                <div style={{ fontSize: '20px', fontFamily: 'monospace', letterSpacing: '2px', marginBottom: '16px' }}>
                  {cardNumber || '•••• •••• •••• ••••'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block' }}>CARDHOLDER</span>
                    <strong>{cardHolder || 'TRAVELER'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block' }}>EXPIRES</span>
                    <strong>{cardExpiry || 'MM/YY'}</strong>
                  </div>
                </div>
              </div>

              <div className="field-group" style={{ marginBottom: '14px' }}>
                <label className="field-label">Cardholder Name *</label>
                <input
                  type="text"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  className="input-styled"
                  required
                />
              </div>

              <div className="field-group" style={{ marginBottom: '14px' }}>
                <label className="field-label">Card Number *</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  className="input-styled"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="field-group">
                  <label className="field-label">Expiry (MM/YY) *</label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    maxLength="5"
                    className="input-styled"
                    required
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">CVV *</label>
                  <input
                    type="password"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    maxLength="4"
                    className="input-styled"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', fontSize: '12px', color: 'var(--text-dim)' }}>
                <span>🔒</span> Safe sandbox payment simulation. No actual funds are charged.
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary btn-full"
              style={{ padding: '16px', fontSize: '16px' }}
            >
              {submitting ? 'Confirming with Carrier & Generating PNR...' : `Pay ₹${totalAmount.toLocaleString('en-IN')} & Confirm Ticket →`}
            </button>

          </form>
        </div>

        {/* Right Itinerary Summary Sticky Sidebar */}
        <div style={{ position: 'sticky', top: '100px' }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Flight Summary</h3>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>OPERATING AIRLINE</div>
              <strong style={{ fontSize: '16px' }}>{flight.airline}</strong>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Flight: {flight.flight_number} • {flight.aircraft}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', marginBottom: '16px' }}>
              <div>
                <strong style={{ fontSize: '16px' }}>{flight.departure_time}</strong>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{flight.search_origin}</div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                {flight.stops === 0 ? 'Direct' : `${flight.stops} Stop`}
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong style={{ fontSize: '16px' }}>{flight.arrival_time}</strong>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{flight.search_destination}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Date:</span>
                <strong>{flight.search_date}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Base Fare per Passenger:</span>
                <strong>₹{flight.price_inr.toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Passengers:</span>
                <strong>{passengers.length}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', fontSize: '16px' }}>
                <span style={{ fontWeight: '700' }}>Grand Total:</span>
                <strong style={{ color: 'var(--accent-cyan)' }}>₹{totalAmount.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-dim)', textAlign: 'center' }}>
              Free 24h cancellation guarantee & instant PNR reservation.
            </div>
          </div>
        </div>

      </div>

      {/* Confirmed Booking Modal */}
      {confirmedBooking && (
        <BookingModal
          booking={confirmedBooking}
          onClose={() => setConfirmedBooking(null)}
        />
      )}

    </div>
  );
};

export default BookingCheckoutPage;
