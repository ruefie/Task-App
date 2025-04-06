// src/App.jsx
import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { TasksProvider } from "./contexts/TasksContext";
import PrivateRoute from "./components/PrivateRoute";
import LoadingSpinner from "./components/ui/LoadingSpinner";
import PageNotFound from "./components/ui/PageNotFound";

const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));

const App = () => (
  <Router>
    <AuthProvider>
      <TasksProvider>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard/*"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard/home" replace />} />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Suspense>
      </TasksProvider>
    </AuthProvider>
  </Router>
);

export default App;
