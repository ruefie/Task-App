// src/App.jsx
import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import PrivateRoute from "./components/PrivateRoute";
import LoadingSpinner from "./components/ui/LoadingSpinner";
import PageNotFound from "./components/ui/PageNotFound";


const Login          = lazy(() => import("./pages/Login.jsx"));
const Register       = lazy(() => import("./pages/Register.jsx"));
const Dashboard      = lazy(() => import("./pages/Dashboard.jsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.jsx"));
const ResetPassword  = lazy(() => import("./pages/ResetPassword.jsx"));

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Private */}
        <Route
          path="/dashboard/*"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard/home" replace />} />

        {/* 404 */}
        <Route path="*" element={<PageNotFound />} />
     
        

      </Routes>
    </Suspense>
  );
}
