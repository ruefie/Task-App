import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import PrivateRoute from "./components/PrivateRoute";

const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));

const App = () => (
  <AuthProvider>
    <Router>
      <Suspense fallback={<div>Loading...</div>}>
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
          <Route path="/" element={<Navigate to="/login" />} />
          <Route
            path="*"
            element={
              <div
                style={{
                  padding: "20px",
                  margin: "20px",
                  textAlign: "center",
                }}
              >
                <h2>Page Not Found</h2>
                <p>The page you're looking for doesn't exist.</p>
                <a
                  href="/"
                  style={{
                    display: "inline-block",
                    marginTop: "10px",
                    padding: "8px 16px",
                    backgroundColor: "#2563eb",
                    color: "white",
                    borderRadius: "4px",
                    textDecoration: "none",
                  }}
                >
                  Go Home
                </a>
              </div>
            }
          />
        </Routes>
      </Suspense>
    </Router>
  </AuthProvider>
);

export default App;
