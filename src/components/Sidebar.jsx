import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Home,
  Calendar as CalendarIcon,
  CheckSquare,
  User,
  LogOut,
} from 'lucide-react';
import styles from '../styles/Sidebar.module.scss';

function Sidebar() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error.message);
    }
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>Task Manager</h2>
        </div>
        <nav className={styles.nav}>
          <Link to="/dashboard" className={styles.link}>
            <Home />
            Home
          </Link>
          <Link to="/dashboard/calendar" className={styles.link}>
            <CalendarIcon />
            Calendar
          </Link>
          <Link to="/dashboard/tasks" className={styles.link}>
            <CheckSquare />
            Tasks
          </Link>
          <Link to="/dashboard/profile" className={styles.link}>
            <User />
            Profile
          </Link>
        </nav>
        <div className={styles.footer}>
          <button onClick={handleLogout}>
            <LogOut />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;








