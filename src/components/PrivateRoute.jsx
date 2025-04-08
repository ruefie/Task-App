// src/components/PrivateRoute.jsx
import React, { useState, useEffect }  from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './ui/LoadingSpinner';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const [minDelayOver, setMinDelayOver] = useState(50);
  const location = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => setMinDelayOver(true), 5);
    return () => clearTimeout(timer);
  }, []);

  // Wait until both the auth is done and the minimum delay is over
  if (loading || !minDelayOver) {
    return <LoadingSpinner />;
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
};

export default PrivateRoute;
