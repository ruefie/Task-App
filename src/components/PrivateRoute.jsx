// src/components/PrivateRoute.jsx
import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';

const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh'
  }}>
    <p>Loading...</p>
  </div>
);

const PrivateRoute = ({ children }) => {
  const { user, loading, initialized, error } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (initialized && !loading && !user) {
      console.log("No user found after initialization, redirecting to login");
      navigate('/login');
    }
  }, [user, loading, initialized, navigate]);

  if (!initialized || loading) {
    return <LoadingFallback />;
  }

  if (error) {
    return (
      <div style={{
        padding: '20px',
        margin: '20px',
        border: '1px solid #f56565',
        borderRadius: '5px',
        backgroundColor: '#fff5f5'
      }}>
        <h2 style={{ color: '#c53030' }}>Authentication Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
