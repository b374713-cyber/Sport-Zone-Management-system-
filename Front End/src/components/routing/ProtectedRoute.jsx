// Front_end/snp/src/components/routing/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { auth } = useAuth();
  const location = useLocation();

  // If there is no token in session, send the user to the Start page
  if (!auth?.token) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
}
