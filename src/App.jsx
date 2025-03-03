import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Lazy load components to improve initial load time
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));

// Loading component
const LoadingFallback = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh' 
  }}>
    <div>
      <p style={{ marginBottom: '10px' }}>Loading...</p>
      <div style={{ 
        width: '50px', 
        height: '6px', 
        backgroundColor: '#e5e7eb',
        borderRadius: '3px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: '50%',
          backgroundColor: '#2563eb',
          borderRadius: '3px',
          animation: 'loading 1.5s infinite ease-in-out'
        }}></div>
      </div>
      <style>{`
        @keyframes loading {
          0% { left: -50%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  </div>
);

// Private route component
const PrivateRoute = ({ children }) => {
  const { user, loading, error } = useAuth();
  
  if (loading) {
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

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard/*" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="*" element={
              <div style={{ 
                padding: '20px', 
                margin: '20px', 
                textAlign: 'center' 
              }}>
                <h2>Page Not Found</h2>
                <p>The page you're looking for doesn't exist.</p>
                <a href="/" style={{ 
                  display: 'inline-block', 
                  marginTop: '10px',
                  padding: '8px 16px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  borderRadius: '4px',
                  textDecoration: 'none'
                }}>
                  Go Home
                </a>
              </div>
            } />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;