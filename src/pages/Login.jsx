// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import styles from '../styles/Login.module.scss';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // New useEffect to capture a success message from location.state
  useEffect(() => {
    if (location.state?.message) {
      setSuccess(location.state.message);
      // Clear the state so it doesn’t show repeatedly
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Optionally, if you want to auto redirect when a user is already logged in (commented out if causing issues)
  // useEffect(() => {
  //   if (user) {
  //     console.log("User already logged in, redirecting to dashboard");
  //     navigate('/dashboard');
  //   }
  // }, [user, navigate]);

  const toggleLoginType = () => {
    setIsAdmin(!isAdmin);
    setEmail(isAdmin ? '' : 'admin@example.com');
    setPassword(isAdmin ? '' : 'adminpass');
  };

  const handleSubmit = async (e) => { 
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      console.log('Attempting to sign in with:', { email });
      const { data, error } = await signIn({ email, password });
      if (error) {
        console.error('Login error:', error);
        throw error;
      }
      console.log('Login successful, navigating to dashboard');
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 200);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          {isAdmin ? (
            <Shield className={styles.icon} />
          ) : (
            <LogIn className={styles.icon} />
          )}
        </div>
        <h2 className={styles.title}>
          {isAdmin ? 'Admin Login' : 'Sign in to your account'}
        </h2>
        <p className={styles.subtitle}>
          Or{' '}
          <Link to="/register" className={styles.link}>
            create a new account
          </Link>
        </p>
        {success && (
          <div className={styles.success}>
            <CheckCircle size={16} style={{ marginRight: '8px' }} />
            {success}
          </div>
        )}
        {error && (
          <div className={styles.error}>
            <AlertCircle size={16} style={{ marginRight: '8px' }} />
            {error}
          </div>
        )}
        <div className={styles.loginTypeToggle}>
          <button
            type="button"
            onClick={toggleLoginType}
            className={`${styles.loginTypeButton} ${isAdmin ? styles.active + ' ' + styles.admin : ''}`}
          >
            <Shield size={16} style={{ marginRight: '4px' }} />
            Admin
          </button>
          <button
            type="button"
            onClick={toggleLoginType}
            className={`${styles.loginTypeButton} ${!isAdmin ? styles.active : ''}`}
          >
            <LogIn size={16} style={{ marginRight: '4px' }} />
            User
          </button>
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
            />
          </div>
          <button type="submit" disabled={loading} className={`${styles.button} ${isAdmin ? styles.adminButton : ''}`}>
            {loading ? 'Signing in...' : (isAdmin ? 'Sign in as Admin' : 'Sign in')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
