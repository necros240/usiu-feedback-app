import React, { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Import useAuth

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const navigate = useNavigate();
  
  // 1. Get current user status
  const { currentUser } = useAuth();

  // 2. Auto-redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate("/");
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", res.user.uid), {
          uid: res.user.uid,
          email,
          displayName: name,
          role: "student"
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      // Redirection is handled by the useEffect above
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="auth-container">
      <h2 style={{textAlign: 'center', color: 'var(--primary)', marginBottom: '20px'}}>
        {isRegistering ? "Register Account" : "Student Login"}
      </h2>
      <form onSubmit={handleSubmit}>
        {isRegistering && (
          <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
        )}
        <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" className="primary-btn">{isRegistering ? "Register" : "Login"}</button>
      </form>
      <p onClick={() => setIsRegistering(!isRegistering)} style={{marginTop: '15px', cursor: 'pointer', color: 'var(--primary)', textAlign:'center', fontWeight: 'bold'}}>
        {isRegistering ? "Already have an account? Login" : "No account? Register"}
      </p>
    </div>
  );
}