import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import HomeSearchPage from './pages/HomeSearchPage';
import FlightResultsPage from './pages/FlightResultsPage';
import BookingCheckoutPage from './pages/BookingCheckoutPage';
import MyBookingsPage from './pages/MyBookingsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

export const App = () => {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomeSearchPage />} />
          <Route path="/results" element={<FlightResultsPage />} />
          
          <Route 
            path="/checkout/:flightId" 
            element={
              <ProtectedRoute>
                <BookingCheckoutPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/my-bookings" 
            element={
              <ProtectedRoute>
                <MyBookingsPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Passenger Sign In & Registration */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Dedicated Admin Gateway & Dashboard */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboardPage />
              </ProtectedRoute>
            } 
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer style={{
        textAlign: 'center',
        padding: '24px 0',
        fontSize: '13px',
        color: 'var(--text-dim)',
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(7, 11, 20, 0.95)'
      }}>
        <div className="container">
          SkyBook © 2026 • Kerala to Gulf Flight Booking Engine • IATA Simulated Demo
        </div>
      </footer>
    </div>
  );
};

export default App;
