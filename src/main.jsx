import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext';
import { TasksProvider } from './contexts/TasksContext';
import './index.css';

// Error boundary for catching and displaying render errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

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
            <p style={{ color: '#c53030' }}>{this.state.error && this.state.error.toString()}</p>
            <p style={{ marginTop: '10px' }}>Component Stack:</p>
            <pre style={{ 
              marginTop: '10px', 
              padding: '10px', 
              backgroundColor: '#edf2f7',
              borderRadius: '3px',
              overflow: 'auto'
            }}>
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('Failed to find the root element');

  const root = createRoot(rootElement);
  
  root.render(
    <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <TasksProvider>
          <App />
        </TasksProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
  );
} catch (error) {
  console.error("Fatal error during initialization:", error);
  document.body.innerHTML = `
    <div style="padding: 20px; margin: 20px; border: 1px solid #f56565; border-radius: 5px; background-color: #fff5f5;">
      <h2 style="color: #c53030;">Fatal Error</h2>
      <p>${error.message}</p>
      <pre style="margin-top: 10px; padding: 10px; background-color: #edf2f7; border-radius: 3px; overflow: auto;">${error.stack}</pre>
    </div>
  `;
}