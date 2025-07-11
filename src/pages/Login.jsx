import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  LogIn,
  Shield,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import styles from "../styles/Login.module.scss";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAdminToggle, setIsAdminToggle] = useState(false);
  const { signIn, signOut, user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notification, setNotification] = useState("");

  useEffect(() => {
    // If a message exists in location state, set it in local state.
    if (location.state?.message) {
      setNotification(location.state.message);
      // Clear the router state after 3 seconds
      const timer = setTimeout(() => {
        setNotification("");
        // Clear the state from the URL by navigating to the same path with empty state
        navigate(location.pathname, { replace: true, state: {} });
      }, 3000); // adjust duration as needed

      return () => clearTimeout(timer);
    }
  }, [location, navigate]);

  useEffect(() => {
    if (location.state?.message) {
      setSuccess(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (user && profile) {
      if (isAdminToggle && !profile.is_admin) {
        setLocalError(
          "Access Denied: This account does not have admin privileges."
        );
        signOut();
        return;
      }

      // const from = location.state?.from || '/dashboard/home';
      navigate("/dashboard/home", { replace: true });
    }
  }, [user, profile, isAdminToggle, signOut, navigate, location.state]);

  const toggleLoginType = () => {
    setIsAdminToggle((prev) => !prev);
    setEmail("");
    setPassword("");
    setLocalError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLocalError("");
      setLoading(true);
      const { error } = await signIn({ email, password });

      if (error) throw error;
    } catch (err) {
      console.error("Login error:", err);
      setLocalError(
        err.message || "Failed to sign in. Please check your credentials."
      );
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
          {isAdminToggle ? "Admin Login" : "Sign in to your account"}
        </h2>
        <p className={styles.subtitle}>
          Or{" "}
          <Link to="/register" className={styles.link}>
            create a new account
          </Link>
        </p>

        {notification && (
          <div className={styles.success}>
            <CheckCircle size={16} style={{ marginRight: "8px" }} />
            {notification}
          </div>
        )}

        {localError && (
          <div className={styles.error}>
            <AlertCircle size={16} />
            {localError}
          </div>
        )}

        <div className={styles.loginTypeToggle}>
          <button
            type="button"
            onClick={toggleLoginType}
            className={`${styles.loginTypeButton} ${isAdminToggle ? styles.active + " " + styles.admin : ""}`}
          >
            <Shield />
            Admin
          </button>
          <button
            type="button"
            onClick={toggleLoginType}
            className={`${styles.loginTypeButton} ${!isAdminToggle ? styles.active : ""}`}
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
              placeholder="Enter your email"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            {/* <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="Enter your password"
            /> */}
            <div className={styles.passwordWrapper}>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className={styles.forgotLink}>
              <Link to="/forgot-password">Forgot password?</Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`${styles.button} ${isAdminToggle ? styles.adminButton : ""}`}
          >
            {loading
              ? "Signing in..."
              : isAdminToggle
                ? "Sign in as Admin"
                : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
