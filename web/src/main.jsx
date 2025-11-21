import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import "./index.css";

import Loader from "./components/Loader";

import Dashboard from "./pages/Dashboard";
import Convocations from "./pages/Convocations";
import Employees from "./pages/Employees";
import Areas from "./pages/Areas";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import Attendance from "./pages/Attendance"; 
import Login from "./pages/Login";
import Layout from "./pages/Layout";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
}

function AppLoaderWrapper() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const timer = setTimeout(() => {
      setLoading(false);
    }, 600); // tiempo del loader

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <>
      {loading && <Loader />}

      <Routes>
        {/* Login NO está protegido */}
        <Route path="/login" element={<Login />} />

        {/* RUTAS PROTEGIDAS */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="convocations" element={<Convocations />} />
          <Route path="employees" element={<Employees />} />
          <Route path="areas" element={<Areas />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="reports" element={<Reports />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Ruta no encontrada */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AppLoaderWrapper />
  </BrowserRouter>
);