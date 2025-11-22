import React from "react";
import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="home-wrapper" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px'}}>
      <div style={{
        background: 'rgba(255,255,255,0.95)', // This container is always white
        padding: '50px', 
        borderRadius: '12px', 
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        maxWidth: '800px'
      }}>
        <h1 style={{fontSize: '3rem', color: 'var(--primary)', marginBottom: '10px'}}>USIU Feedback System</h1>
        <p style={{fontSize: '1.2rem', color: '#555', marginBottom: '30px'}}>
          Connecting Students, Clubs, and Administration in one voice.
        </p>

        <div style={{display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '40px'}}>
            <div style={{textAlign: 'left', maxWidth: '200px'}}>
                <h3 style={{color: 'var(--accent)'}}>📢 Speak Up</h3>
                {/* FIX ADDED HERE: Added color: '#555' */}
                <p style={{fontSize: '0.9rem', color: '#555'}}>Submit feedback on facilities, academics, and more directly to admins.</p>
            </div>
            <div style={{textAlign: 'left', maxWidth: '200px'}}>
                <h3 style={{color: 'var(--accent)'}}>🎭 Join In</h3>
                {/* FIX ADDED HERE: Added color: '#555' */}
                <p style={{fontSize: '0.9rem', color: '#555'}}>Discover club events, vote in polls, and engage with student life.</p>
            </div>
            <div style={{textAlign: 'left', maxWidth: '200px'}}>
                <h3 style={{color: 'var(--accent)'}}>🔒 Stay Safe</h3>
                {/* FIX ADDED HERE: Added color: '#555' */}
                <p style={{fontSize: '0.9rem', color: '#555'}}>Post anonymously when you need to. We value your privacy.</p>
            </div>
        </div>

        <div style={{display: 'flex', gap: '15px', justifyContent: 'center'}}>
          <Link to="/login" className="primary-btn" style={{width: 'auto', padding: '12px 30px', textDecoration: 'none', fontSize: '1.1rem'}}>
            Login to Portal
          </Link>
        </div>
        
        <p style={{marginTop: '20px', fontSize: '0.9rem', color: '#888'}}>
          Don't have an account? Click Login to Register.
        </p>
      </div>
    </div>
  );
}