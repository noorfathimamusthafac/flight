import React, { useState, useEffect } from 'react';
import { bookingsApi } from '../api/client';
import BookingModal from '../components/BookingModal';

export const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await bookingsApi.getMyBookings();
        setBookings(res.data);
      } catch (err) {
        console.error("Error fetching bookings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  return (
    <div className="container" style={{ padding: '36px 24px' }}>
      
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '26px' }}>My Confirmed Flights & Trips</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Manage your upcoming journeys, view PNRs, and access electronic boarding passes.
        </p>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          Loading your travel itineraries...
        </div>
      )}

      {!loading && bookings.length === 0 && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '48px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>✈</div>
          <h3>No bookings found yet</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px', marginBottom: '24px' }}>
            Ready to fly? Search routes from Kerala to Dubai, Abu Dhabi, Doha, and Muscat.
          </p>
          <a href="/" className="btn btn-primary">
            Search Flights Now
          </a>
        </div>
      )}

      {!loading && bookings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {bookings.map((booking) => {
            const flight = booking.flight;
            return (
              <div
                key={booking.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '20px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '18px',
                      fontWeight: '800',
                      color: 'var(--accent-cyan)'
                    }}>
                      PNR: {booking.pnr}
                    </span>
                    <span className="status-badge-confirmed">
                      {booking.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
                    {flight?.search_origin} ➔ {flight?.search_destination}
                  </div>

                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {flight?.airline} ({flight?.flight_number}) • {booking.travel_date} at {flight?.departure_time}
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '6px' }}>
                    Passengers: {booking.passengers?.map(p => p.full_name).join(', ')}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <div style={{ fontSize: '20px', fontFamily: 'var(--font-display)', fontWeight: '800' }}>
                    ₹{booking.total_amount?.toLocaleString('en-IN')}
                  </div>
                  <button
                    onClick={() => setSelectedBooking(booking)}
                    className="btn btn-secondary btn-sm"
                  >
                    View E-Ticket & Pass
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedBooking && (
        <BookingModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}

    </div>
  );
};

export default MyBookingsPage;
