// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import styles from '../styles/Login.module.scss';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  // Local toggle for Admin Login mode
  const [isAdminToggle, setIsAdminToggle] = useState(false);

  // Destructure signIn, signOut, user, profile from AuthContext.
  const { signIn, signOut, user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Capture and display any success message from location.state.
  useEffect(() => {
    if (location.state?.message) {
      setSuccess(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // This useEffect monitors when user and profile are loaded, then navigates accordingly.
  useEffect(() => {
    // Only run if we have a user and profile loaded
    if (user && profile) {
      if (isAdminToggle) {
        // If admin mode is toggled, but the profile does not indicate admin rights:
        if (profile.is_admin !== true) {
          setLocalError("Access Denied: This account does not have admin privileges.");
          // Sign out the user and clear the fields
          signOut();
          return;
        }
      }
      // If everything is in order, navigate to dashboard.
      navigate('/dashboard', { replace: true });
    }
    // We want this effect to run whenever user, profile, or isAdminToggle changes.
  }, [user, profile, isAdminToggle, signOut, navigate]);

  // Toggle between admin and user login modes.
  const toggleLoginType = () => {
    setIsAdminToggle((prev) => !prev);
    setEmail('');
    setPassword('');
  };

  // handleSubmit only calls signIn; navigation is handled in useEffect.
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLocalError('');
      setLoading(true);
      console.log('Attempting to sign in with:', { email });
      const { data, error } = await signIn({ email, password });
      if (error) throw error;
      console.log('Sign in process initiated.');
      // Note: Do not navigate here—useEffect will take care of it once user/profile are set.
    } catch (err) {
      console.error('Login error:', err);
      setLocalError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          {isAdminToggle ? (
            <Shield className={styles.icon} />
          ) : (
            <LogIn className={styles.icon} />
          )}
        </div>
        <h2 className={styles.title}>
          {isAdminToggle ? 'Admin Login' : 'Sign in to your account'}
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
        {localError && (
          <div className={styles.error}>
            <AlertCircle size={16} style={{ marginRight: '8px' }} />
            {localError}
          </div>
        )}
        <div className={styles.loginTypeToggle}>
          <button
            type="button"
            onClick={toggleLoginType}
            className={`${styles.loginTypeButton} ${isAdminToggle ? styles.active + ' ' + styles.admin : ''}`}
          >
            <Shield />
            Admin
          </button>
          <button
            type="button"
            onClick={toggleLoginType}
            className={`${styles.loginTypeButton} ${!isAdminToggle ? styles.active : ''}`}
          >
            <LogIn />
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
          <button
            type="submit"
            disabled={loading}
            className={`${styles.button} ${isAdminToggle ? styles.adminButton : ''}`}
          >
            {loading ? 'Signing in...' : (isAdminToggle ? 'Sign in as Admin' : 'Sign in')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
