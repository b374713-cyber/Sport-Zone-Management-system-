// Front_end/snp/src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Pages
import StartPage from './pages/StartPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import GymDashboard from './components/gym/GymDashboard';
import ApplyJob from './pages/ApplyJob';   // ← single import (keep only this one)
import StoreDashboard from "./pages/StoreDashboard";
// ---------------- Protected & Public wrappers ----------------
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 fs-5">Loading Sport Zone...</p>
        </div>
      </div>
    );
  }

  const protectedPaths = ['/dashboard', '/gym'];
  if (!isAuthenticated && protectedPaths.includes(location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

// ---------------- Navigation blocker ----------------
const NavigationBlocker = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  React.useEffect(() => {
    const disableBrowserNavigation = () => {
      window.history.pushState(null, '', window.location.href);
    };
    const handlePopState = (event) => {
      event.preventDefault();
      event.stopPropagation();
      disableBrowserNavigation();
      // console.log('🚫 Browser navigation blocked');
    };
    disableBrowserNavigation();
    window.addEventListener('popstate', handlePopState, true);
    return () => {
      window.removeEventListener('popstate', handlePopState, true);
    };
  }, [isAuthenticated, location]);

  return null;
};

function App() {
  return (
    <Router>
      <div className="App">
        <NavigationBlocker />
        <Routes>
          {/* Start Page */}
          <Route
            path="/"
            element={
              <PublicRoute>
                <StartPage />
              </PublicRoute>
            }
          />

          {/* Auth */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* NEW: Apply Job (public) */}
          <Route
            path="/apply"
            element={
              <PublicRoute>
                <ApplyJob />
              </PublicRoute>
            }
          />

          {/* Protected */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gym"
            element={
              <ProtectedRoute>
                <GymDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Store (protected) */}
          <Route
            path="/store"
            element={
              <ProtectedRoute>
                <StoreDashboard />
              </ProtectedRoute>
            }
            />

          {/* Aliases & catch-all */}
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/welcome" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
