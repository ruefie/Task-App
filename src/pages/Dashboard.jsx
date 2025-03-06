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

// Loading component
const LoadingComponent = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: '2rem' 
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
    </div>
  </div>
);

// Error component
const ErrorComponent = ({ message }) => (
  <div style={{ 
    padding: '1rem', 
    margin: '1rem', 
    backgroundColor: '#fff5f5', 
    borderRadius: '0.375rem',
    border: '1px solid #f56565',
    color: '#c53030',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  }}>
    <AlertCircle size={20} />
    <span>{message || 'An error occurred. Please try again.'}</span>
  </div>
);

// Home component (directly defined here to avoid import issues)
const Home = () => {
  const { user } = useAuth();
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
    <div style={{ padding: '1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Welcome back!</h1>
      <p style={{ marginBottom: '1rem', color: '#6b7280' }}>{user?.email}</p>
      
      {error && <ErrorComponent message={error} />}
      
      {loading ? (
        <p>Loading your tasks...</p>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '1rem' 
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '0.5rem', 
            padding: '1rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Task Overview</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckSquare size={20} />
                <div>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>Tasks</h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {tasks.filter(t => t.completed).length} / {tasks.length} completed
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '0.5rem', 
            padding: '1rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Recent Tasks</h2>
            {tasks.length === 0 ? (
              <p>No tasks yet. Add some tasks to get started!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {tasks.slice(0, 5).map(task => (
                  <div key={task.id} style={{ 
                    padding: '0.75rem', 
                    backgroundColor: '#f3f4f6', 
                    borderRadius: '0.375rem',
                    borderLeft: '4px solid #2563eb'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '0.25rem'
                    }}>
                      <h3 style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>{task.name}</h3>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        padding: '0.125rem 0.5rem', 
                        backgroundColor: '#dbeafe', 
                        color: '#1e40af',
                        borderRadius: '9999px'
                      }}>
                        {task.priority || 'Normal'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
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

  // Debug logging for admin status
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

  // Determine active route for navigation highlighting
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
              <span className="sr-only">Close sidebar</span>
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
                      // onClick={() => setSidebarOpen(false)}
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
            <span className="sr-only">Open sidebar</span>
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
                  <Route path="*" element={
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                      <h2>Page Not Found</h2>
                      <p>The page you're looking for doesn't exist.</p>
                      <Link 
                        to="/dashboard"
                        style={{
                          display: 'inline-block',
                          marginTop: '1rem',
                          padding: '0.5rem 1rem',
                          backgroundColor: '#2563eb',
                          color: 'white',
                          borderRadius: '0.25rem',
                          textDecoration: 'none'
                        }}
                      >
                        Go to Dashboard
                      </Link>
                    </div>
                  } />
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