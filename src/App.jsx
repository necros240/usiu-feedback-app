import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Navbar from "./components/Navbar";
import "./App.css";

// Pages
import Login from "./pages/Login";
import Home from "./pages/Home";
import SubmitFeedback from "./pages/SubmitFeedback";
import Clubs from "./pages/Clubs";
import AdminDashboard from "./pages/AdminDashboard";
import MasterAdmin from "./pages/MasterAdmin";
import Profile from "./pages/Profile";
import MyActivity from "./pages/MyActivity";
import Landing from "./pages/Landing";
import PrivacyPolicy from "./pages/PrivacyPolicy"; // <--- IMPORT THIS

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, userRole, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!currentUser) return <Navigate to="/" />;
  if (userRole === 'tester') return children;
  if (allowedRoles && !allowedRoles.includes(userRole)) return <Navigate to="/home" />;
  return children;
};

const PublicRoute = () => {
    const { currentUser, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (currentUser) return <Navigate to="/home" />;
    return <Landing />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Navbar />
          <div style={{minHeight: '80vh'}}> {/* Ensure content pushes footer down */}
            <Routes>
              <Route path="/" element={<PublicRoute />} />
              <Route path="/login" element={<Login />} />
              
              {/* NEW PRIVACY ROUTE (Publicly accessible) */}
              <Route path="/privacy" element={<PrivacyPolicy />} /> 

              <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/submit" element={<ProtectedRoute><SubmitFeedback /></ProtectedRoute>} />
              <Route path="/clubs" element={<ProtectedRoute><Clubs /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/activity" element={<ProtectedRoute><MyActivity /></ProtectedRoute>} />

              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['admin', 'faculty', 'master']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />

              <Route path="/master" element={
                <ProtectedRoute allowedRoles={['master']}>
                  <MasterAdmin />
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<div className="container"><h1>404</h1><p>Page not found.</p></div>} />
            </Routes>
          </div>

          {/* GLOBAL FOOTER */}
          <footer style={{textAlign: 'center', padding: '20px', color: '#888', fontSize: '0.8rem', borderTop: '1px solid var(--border)', marginTop: 'auto'}}>
             &copy; {new Date().getFullYear()} USIU-Africa | <a href="/privacy" style={{color: 'var(--primary)', textDecoration: 'none'}}>Privacy Policy</a> | Built by Group 12
          </footer>

        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}