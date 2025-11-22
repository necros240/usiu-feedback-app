import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { auth } from "../firebase";

export default function Navbar() {
  const { currentUser, userRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    auth.signOut();
    navigate("/login");
    setIsMenuOpen(false);
  };

  const canAccessAdmin = ["admin", "faculty", "master", "tester"].includes(userRole);
  const canAccessSystem = ["master", "tester"].includes(userRole);

  return (
    <nav className="navbar" role="navigation" aria-label="Main Navigation">
      <img src="/Feedback-USIU-Logo.png" alt="USIU Logo" className="navbar-logo" />
      <h2>USIU Feedback</h2>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button className="theme-btn" onClick={toggleTheme} aria-label="Toggle Dark Mode">
          {theme === "light" ? "🌙" : "☀️"}
        </button>
        {currentUser && (
          <button className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            ☰
          </button>
        )}
      </div>

      <div className={`nav-links ${isMenuOpen ? "open" : ""}`}>
        {currentUser ? (
          <>
            <Link to="/home" onClick={() => setIsMenuOpen(false)}>Home Feed</Link>
            <Link to="/activity" onClick={() => setIsMenuOpen(false)}>🔔 Activity</Link> 
            <Link to="/clubs" onClick={() => setIsMenuOpen(false)}>Clubs</Link>
            <Link to="/submit" onClick={() => setIsMenuOpen(false)}>Submit</Link>
            <Link to="/profile" onClick={() => setIsMenuOpen(false)}>Profile</Link> 
            
            {canAccessAdmin && (
              <Link to="/admin" onClick={() => setIsMenuOpen(false)}>Admin</Link>
            )}
            
            {canAccessSystem && (
              <Link to="/master" onClick={() => setIsMenuOpen(false)}>System</Link>
            )}
            
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </nav>
  );
}