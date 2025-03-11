import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
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
  Shield,
  AlertCircle
} from 'lucide-react';
import { tasksService } from '../lib/tasks';
import styles from '../styles/Dashboard.module.scss';

// Lazy load components
const Calendar = lazy(() => import('../components/Calendar.jsx'));
const Tasks = lazy(() => import('../components/Tasks.jsx'));
const Profile = lazy(() => import('../components/Profile.jsx'));
const AdminPanel = lazy(() => import('../components/AdminPanel.jsx'));

// Loading component using CSS classes
const LoadingComponent = () => (
  <div className={styles.loadingContainer}>
    <div>
      <p className={styles.loadingText}>Loading...</p>
      <div className={styles.loadingBar}>
        <div className={styles.loadingFill}></div>
      </div>
    </div>
  </div>
);

// Error component using CSS classes
const ErrorComponent = ({ message }) => (
  <div className={styles.errorComponent}>
    <AlertCircle size={20} />
    <span>{message || 'An error occurred. Please try again.'}</span>
  </div>
);

// Home component (directly defined here to avoid import issues)
const Home = () => {
  const { user ,profile} = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        const tasksData = await tasksService.getTasks();
        console.log('Home - Loaded tasks:', tasksData?.length || 0);
        setTasks(tasksData || []);
      } catch (error) {
        console.error('Error loading tasks:', error);
        setError('Failed to load tasks. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  return (
    <div className={styles.homeContainer}>
      <div className={styles.homeHeader}>
      <h1 className={styles.homeTitle}>Welcome back!</h1>
      <p className={styles.homeUserEmail}>{profile?.first_name}</p>
      </div>
      
      {error && <ErrorComponent message={error} />}
      
      {loading ? (
        <p className={styles.homeLoading}>Loading your tasks...</p>
      ) : (
        <div className={styles.homeGrid}>
          {/* Task Overview Card */}
          <div className={styles.overviewCard}>
            <h2 className={styles.overviewTitle}>Task Overview</h2>
            <div className={styles.overviewBody}>
              <div className={styles.overviewRow}>
                <CheckSquare size={20} />
                <div>
                  <h3 className={styles.overviewRowTitle}>Tasks</h3>
                  <p className={styles.overviewRowStats}>
                    {tasks.filter(t => t.completed).length} / {tasks.length} completed
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Recent Tasks Card */}
          <div className={styles.recentCard}>
            <h2 className={styles.recentTitle}>Recent Tasks</h2>
            {tasks.length === 0 ? (
              <p className={styles.noTasks}>No tasks yet. Add some tasks to get started!</p>
            ) : (
              <div className={styles.recentList}>
                {tasks.slice(0, 5).map(task => (
                  <div
                    key={task.id}
                    className={`${styles.recentItem} ${styles[task.priority?.toLowerCase() || 'normal']}`}
                  >
                    <div className={styles.recentHeader}>
                      <h3 className={styles.recentTaskName}>{task.name}</h3>
                      <span className={`${styles.recentPriority} ${styles[task.priority?.toLowerCase() || 'normal']}`}>
              {task.priority || 'Normal'}
            </span>
                    </div>
                    <div className={styles.recentInfo}>
                      {task.project || 'No project'} • Due: {task.due_date || 'Not set'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log("Dashboard mounted, isAdmin:", isAdmin);
    console.log("User profile:", profile);
    loadTasks();
  }, [isAdmin, profile]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching tasks from service");
      const tasksData = await tasksService.getTasks();
      console.log("Tasks loaded:", tasksData?.length || 0);
      setTasks(tasksData || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      console.log("Signing out");
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out. Please try again.');
    }
  };

  const isActiveRoute = (path) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') {
      return true;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className={styles.container}>
      {/* Mobile sidebar */}
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
                  to="/dashboard"
                  className={`${styles.navItem} ${styles.mobile} ${isActiveRoute('/dashboard') && location.pathname === '/dashboard' ? styles.active : ''}`}
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
                  <Settings className={styles.navIcon} />
                  Profile
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
                  <button
                    onClick={handleSignOut}
                    className={styles.signOutButton}
                  >
                    <LogOut className={styles.signOutIcon} />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
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
                    to="/dashboard"
                    className={`${styles.navItem} ${styles.desktop} ${isActiveRoute('/dashboard') && location.pathname === '/dashboard' ? styles.active : ''}`}
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
                    <Settings className={styles.navIcon} />
                    Profile
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
                    <button
                      onClick={handleSignOut}
                      className={styles.signOutButton}
                    >
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

      <div className={styles.mainContent}>
        <div className={styles.mobileHeader}>
          <button
            className={styles.menuButton}
            onClick={() => setSidebarOpen(true)}
          >
            <span className={styles.srOnly}>Open sidebar</span>
            <Menu className={styles.menuIcon} />
          </button>
        </div>
        <main className={styles.mainArea}>
          <div className={styles.contentWrapper}>
            <div className={styles.contentContainer}>
              {error && <ErrorComponent message={error} />}
              
              <Suspense fallback={<LoadingComponent />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/profile" element={<Profile />} />
                  {isAdmin && (
                    <Route path="/admin" element={<AdminPanel />} />
                  )}
                  <Route
                    path="*"
                    element={
                      <div className={styles.pageNotFound}>
                        <h2>Page Not Found</h2>
                        <p>The page you're looking for doesn't exist.</p>
                        <Link to="/dashboard" className={styles.goHome}>
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
