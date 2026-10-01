import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { flightsApi } from '../api/client';
import FlightCard from '../components/FlightCard';
import AirlineComparison from '../components/AirlineComparison';

export const FlightResultsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const from = searchParams.get('from') || 'COK';
  const to = searchParams.get('to') || 'DXB';
  const date = searchParams.get('date') || '';
  const passengers = Number(searchParams.get('passengers') || 1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchData, setSearchData] = useState(null);
  const [sortOption, setSortOption] = useState('best'); // best, cheapest, fastest, stops

  useEffect(() => {
    const fetchFlights = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await flightsApi.search(from, to, date, passengers);
        setSearchData(res.data);
      } catch (err) {
        console.error("Flight search error:", err);
        setError(err.response?.data?.detail || "Unable to fetch flights. Please check airports and date.");
      } finally {
        setLoading(false);
      }
    };

    if (from && to && date) {
      fetchFlights();
    }
  }, [from, to, date, passengers]);

  // Handle Flight Sorting
  const getSortedFlights = () => {
    if (!searchData || !searchData.results) return [];
    const list = [...searchData.results];

    switch (sortOption) {
      case 'cheapest':
        return list.sort((a, b) => a.price_inr - b.price_inr);
      case 'fastest':
        return list.sort((a, b) => a.duration_minutes - b.duration_minutes);
      case 'stops':
        return list.sort((a, b) => a.stops - b.stops || a.price_inr - b.price_inr);
      case 'best':
      default:
        // Prioritize "Best value" tag, then cheapest
        return list.sort((a, b) => {
          const aHas = a.tags?.includes('Best value');
          const bHas = b.tags?.includes('Best value');
          if (aHas && !bHas) return -1;
          if (!aHas && bHas) return 1;
          return a.price_inr - b.price_inr;
        });
    }
  };

  const handleSelectFlight = (flight) => {
    navigate(`/checkout/${flight.id}?passengers=${passengers}`);
  };

  return (
    <div className="container" style={{ padding: '36px 24px' }}>
      
      {/* Route Header Banner */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '24px',
        marginBottom: '28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-green)',
              boxShadow: '0 0 8px var(--accent-green)'
            }}></span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>GUARANTEED LIVE PRICING</span>
          </div>
          <h2 style={{ fontSize: '24px' }}>
            {from} ➔ {to}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Departure: <strong>{date}</strong> • <strong>{passengers}</strong> Passenger{passengers > 1 ? 's' : ''}
          </p>
        </div>

        <button onClick={() => navigate('/')} className="btn btn-secondary btn-sm">
          Modify Search
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: '36px', marginBottom: '16px', animation: 'spin 1.5s linear infinite' }}>✈</div>
          <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Searching Kerala & Gulf Airlines...</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Running rate tracker across Emirates, Air India Express, IndiGo, Qatar Airways, and flydubai.
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '24px',
          textAlign: 'center',
          color: '#fca5a5'
        }}>
          <h3>{error}</h3>
          <p style={{ marginTop: '8px', fontSize: '14px' }}>
            Please select supported airports (COK, CCJ, TRV, CNN ➔ DXB, AUH, DOH, KWI, MCT).
          </p>
          <button onClick={() => navigate('/')} className="btn btn-primary" style={{ marginTop: '16px' }}>
            Back to Search
          </button>
        </div>
      )}

      {/* Results List */}
      {!loading && !error && searchData && (
        <>
          {/* Sorting Tabs Bar */}
          <div className="results-header-bar">
            <div>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                Found <strong>{searchData.results?.length}</strong> flight itineraries
              </span>
            </div>

            <div className="sort-tabs">
              <button
                onClick={() => setSortOption('best')}
                className={`sort-tab ${sortOption === 'best' ? 'active' : ''}`}
              >
                Best Value
              </button>
              <button
                onClick={() => setSortOption('cheapest')}
                className={`sort-tab ${sortOption === 'cheapest' ? 'active' : ''}`}
              >
                Cheapest First
              </button>
              <button
                onClick={() => setSortOption('fastest')}
                className={`sort-tab ${sortOption === 'fastest' ? 'active' : ''}`}
              >
                Fastest Flight
              </button>
              <button
                onClick={() => setSortOption('stops')}
                className={`sort-tab ${sortOption === 'stops' ? 'active' : ''}`}
              >
                Fewest Stops
              </button>
            </div>
          </div>

          {/* Flight Cards List */}
          <div className="flight-cards-list">
            {getSortedFlights().map((flight) => (
              <FlightCard
                key={flight.id}
                flight={flight}
                onSelect={handleSelectFlight}
              />
            ))}
          </div>

          {/* Airline Comparison Component */}
          <AirlineComparison comparisons={searchData.airline_comparison} />
        </>
      )}

    </div>
  );
};

export default FlightResultsPage;
