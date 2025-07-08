// src/main.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext';
import { TasksProvider } from './contexts/TasksContext';
import { NotesProvider } from './contexts/NotesContext';
import { SupabaseProvider } from './contexts/SupabaseContext';
import { subscribeUserToPush } from './lib/push-subscribe';


import { supabase } from './lib/supabaseClient';
import './lib/notifications';
import 'izitoast/dist/css/iziToast.min.css';
import './index.css'; 
//debugging only
window.subscribeUserToPush = () => subscribeUserToPush(supabase);

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) {
    console.error("React Error:", error, errorInfo);
    this.setState({ errorInfo });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          margin: '20px',
          border: '1px solid #f56565',
          borderRadius: '5px',
          backgroundColor: '#fff5f5'
        }}>
          <h2 style={{ color: '#c53030' }}>Something went wrong</h2>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>
            <summary>Show error details</summary>
            <p style={{ color: '#c53030' }}>
              {this.state.error?.toString()}
            </p>
            <p style={{ marginTop: '10px' }}>Component Stack:</p>
            <pre style={{
              marginTop: '10px',
              padding: '10px',
              backgroundColor: '#edf2f7',
              borderRadius: '3px',
              overflow: 'auto'
            }}>
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Failed to find the root element');

createRoot(rootEl).render(
  <React.StrictMode>
    <SupabaseProvider>
      <ErrorBoundary>
        <AuthProvider>
          <TasksProvider>
            <NotesProvider>
              <App />
            </NotesProvider>
          </TasksProvider>
        </AuthProvider>
      </ErrorBoundary>
    </SupabaseProvider>
  </React.StrictMode>
);
