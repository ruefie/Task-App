// src/pages/Dashboard.jsx
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import {
  Calendar as CalendarIcon,
  CheckSquare,
  LogOut,
  Menu,
  X,
  User,
  Home as HomeIcon,
  Settings,
  Settings as SettingsIcon,
  Shield,
  AlertCircle,
  UserRound,
} from 'lucide-react';
import styles from '../styles/Dashboard.module.scss';

// Lazy load components
const Home = lazy(() => import('../components/Home/Home.jsx'));
const Calendar = lazy(() => import('../components/Calendar/Calendar.jsx'));
const Tasks = lazy(() => import('../components/Tasks/Tasks.jsx'));
const Profile = lazy(() => import('../components/Profile.jsx'));
const AdminPanel = lazy(() => import('../components/AdminPanel.jsx'));
const SettingsPage = lazy(() => import('../components/Settings.jsx'));

// Loading component
// const LoadingComponent = () => (
//   <div className={styles.loadingContainer}>
//     <div>
//       <p className={styles.loadingText}>Loading...</p>
//       <div className={styles.loadingBar}>
//         <div className={styles.loadingFill}></div>
//       </div>
//     </div>
//   </div>
// );

// Error component
const ErrorComponent = ({ message }) => (
  <div className={styles.errorComponent}>
    <AlertCircle size={20} />
    <span>{message || 'An error occurred. Please try again.'}</span>
  </div>
);

function Dashboard() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Helper to determine active route
  const isActiveRoute = (path) => {
    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className={styles.container}>
      {/* Mobile Sidebar */}
      <div className={sidebarOpen ? styles.mobileOverlayVisible : styles.mobileOverlayHidden}>
        <div className={styles.mobileOverlay} onClick={() => setSidebarOpen(false)}></div>
        <div className={styles.mobileSidebar}>
          <div className={styles.mobileCloseButton}>
            <button onClick={() => setSidebarOpen(false)}>
              <span className={styles.srOnly}>Close sidebar</span>
              <X className={styles.closeIcon} />
            </button>
          </div>
          <div className={styles.sidebarScrollArea}>
            <div className={styles.logoContainer}>
              <h1 className={styles.logo}>Task Manager</h1>
            </div>
            <nav className={styles.navContainer}>
              <div className={styles.navList}>
                <Link
                  to="/dashboard/home"
                  className={`${styles.navItem} ${styles.mobile} ${isActiveRoute('/dashboard/home') ? styles.active : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <HomeIcon className={styles.navIcon} />
                  Home
                </Link>
                <Link
                  to="/dashboard/calendar"
                  className={`${styles.navItem} ${styles.mobile} ${isActiveRoute('/dashboard/calendar') ? styles.active : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <CalendarIcon className={styles.navIcon} />
                  Calendar
                </Link>
                <Link
                  to="/dashboard/tasks"
                  className={`${styles.navItem} ${styles.mobile} ${isActiveRoute('/dashboard/tasks') ? styles.active : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <CheckSquare className={styles.navIcon} />
                  Tasks
                </Link>
                <Link
                  to="/dashboard/profile"
                  className={`${styles.navItem} ${styles.mobile} ${isActiveRoute('/dashboard/profile') ? styles.active : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <UserRound className={styles.navIcon} />
                  Profile
                </Link>
                <Link to="/dashboard/settings" className={`${styles.navItem} ${isActiveRoute('/dashboard/settings') ? styles.active : ''}`}>
                <SettingsIcon className={styles.navIcon} />
                  Settings
                </Link>
                {isAdmin && (
                  <Link
                    to="/dashboard/admin"
                    className={`${styles.navItem} ${styles.mobile} ${isActiveRoute('/dashboard/admin') ? styles.active : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Shield className={styles.navIcon} />
                    Admin Panel
                  </Link>
                )}
              </div>
            </nav>
          </div>
          <div className={styles.userSection}>
            <div className={styles.userContainer}>
              <div className={styles.userInfo}>
                <div className={styles.avatarContainer}>
                  <User className={styles.avatarIcon} />
                </div>
                <div className={styles.userDetails}>
                  <p className={styles.userName}>
                    {profile?.first_name || ''} {profile?.last_name || ''}
                  </p>
                  <button onClick={handleSignOut} className={styles.signOutButton}>
                    <LogOut className={styles.signOutIcon} />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className={styles.sidebarDesktop}>
        <div className={styles.sidebarWrapper}>
          <div className={styles.sidebarContent}>
            <div className={styles.sidebarScrollArea}>
              <div className={styles.logoContainer}>
                <h1 className={styles.logo}>Task Manager</h1>
              </div>
              <nav className={styles.navContainer}>
                <div className={styles.navList}>
                  <Link
                    to="/dashboard/home"
                    className={`${styles.navItem} ${styles.desktop} ${isActiveRoute('/dashboard/home') ? styles.active : ''}`}
                  >
                    <HomeIcon className={styles.navIcon} />
                    Home
                  </Link>
                  <Link
                    to="/dashboard/calendar"
                    className={`${styles.navItem} ${styles.desktop} ${isActiveRoute('/dashboard/calendar') ? styles.active : ''}`}
                  >
                    <CalendarIcon className={styles.navIcon} />
                    Calendar
                  </Link>
                  <Link
                    to="/dashboard/tasks"
                    className={`${styles.navItem} ${styles.desktop} ${isActiveRoute('/dashboard/tasks') ? styles.active : ''}`}
                  >
                    <CheckSquare className={styles.navIcon} />
                    Tasks
                  </Link>
                  <Link
                    to="/dashboard/profile"
                    className={`${styles.navItem} ${styles.desktop} ${isActiveRoute('/dashboard/profile') ? styles.active : ''}`}
                  >
                    <UserRound className={styles.navIcon} />
                    Profile
                  </Link>
                  <Link to="/dashboard/settings" className={`${styles.navItem} ${isActiveRoute('/dashboard/settings') ? styles.active : ''}`}>
                <SettingsIcon className={styles.navIcon} />
                  Settings
                </Link>
                  {isAdmin && (
                    <Link
                      to="/dashboard/admin"
                      className={`${styles.navItem} ${styles.desktop} ${isActiveRoute('/dashboard/admin') ? styles.active : ''}`}
                    >
                      <Shield className={styles.navIcon} />
                      Admin Panel
                    </Link>
                  )}
                </div>
              </nav>
            </div>
            <div className={styles.userSection}>
              <div className={styles.userContainer}>
                <div className={styles.userInfo}>
                  <div className={styles.avatarContainer}>
                    <User className={styles.avatarIcon} />
                  </div>
                  <div className={styles.userDetails}>
                    <p className={styles.userName}>
                      {profile?.first_name || ''} {profile?.last_name || ''}
                    </p>
                    <button onClick={handleSignOut} className={styles.signOutButton}>
                      <LogOut className={styles.signOutIcon} />
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <div className={styles.mobileHeader}>
          <button className={styles.menuButton} onClick={() => setSidebarOpen(true)}>
            <span className={styles.srOnly}>Open sidebar</span>
            <Menu className={styles.menuIcon} />
          </button>
        </div>
        <main className={styles.mainArea}>
          <div className={styles.contentWrapper}>
            <div className={styles.contentContainer}>
              <Suspense>
                <Routes>
                <Route index element={<Navigate to="home" replace />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  {isAdmin && (
                    <Route path="/admin" element={<AdminPanel />} />
                  )}
                  <Route
                    path="*"
                    element={
                      <div className={styles.pageNotFound}>
                        <h2>Page Not Found</h2>
                        <p>The page you're looking for doesn't exist.</p>
                        <Link to="/dashboard/home" className={styles.goHome}>
                          Go to Dashboard
                        </Link>
                      </div>
                    }
                  />
                </Routes>
              </Suspense>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
