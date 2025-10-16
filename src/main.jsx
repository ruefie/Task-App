// src/main.jsx (very top, before imports if you want zero flash)
(() => {
  try {
    const t = localStorage.getItem('ui.theme');
    const root = document.documentElement;
    if (t && t !== 'system') root.setAttribute('data-theme', t);
    else root.removeAttribute('data-theme');
  } catch {}
})();


// Apply saved theme before React mounts (prevents flash)


// src/main.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
// import { HashRouter } from 'react-router-dom';
import { BrowserRouter } from 'react-router-dom';
import './lib/chartjs-setup';

import App from './App.jsx';
import { SupabaseProvider } from './contexts/SupabaseContext';
import { AuthProvider } from './contexts/AuthContext';
import { TasksProvider } from './contexts/TasksContext';
import { NotesProvider } from './contexts/NotesContext';

import ErrorBoundary from './components/common/ErrorBoundary.jsx';

import { supabase } from './lib/supabaseClient';
import { subscribeUserToPush } from './lib/push-subscribe';
import './lib/notifications';

import 'izitoast/dist/css/iziToast.min.css';
import './index.css';

// Dev-only helper to test push subscription in the console
if (import.meta.env.DEV) {
  window.subscribeUserToPush = () => subscribeUserToPush(supabase);
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
              {/* HashRouter is ideal for GitHub Pages */}
              <BrowserRouter basename="/Task-App">
                <App />
              </BrowserRouter>
            </NotesProvider>
          </TasksProvider>
        </AuthProvider>
      </ErrorBoundary>
    </SupabaseProvider>
  </React.StrictMode>
);
