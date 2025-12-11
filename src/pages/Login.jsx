import React, { useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore"; 
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) navigate("/home");
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
          role: "student",
          affiliation: "None"
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      alert(error.message);
    }
  };

  
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        
        await setDoc(docRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName, 
          role: "student", 
          photoURL: user.photoURL, 
          affiliation: "None"
        });
      }
      
    } catch (error) {
      console.error("Error with Google Sign-In", error);
      alert(error.message);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="form-card">
        <h2 style={{ textAlign: 'center', color: 'var(--primary)', marginBottom: '20px' }}>
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

        
        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
          <div style={{ flex: 1, height: '1px', background: '#ccc' }}></div>
          <span style={{ padding: '0 10px', color: '#888' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: '#ccc' }}></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            background: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            fontWeight: 'bold',
            color: '#555'
          }}
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '20px' }} />
          Sign in with Google
        </button>
        

        <p onClick={() => setIsRegistering(!isRegistering)} style={{ marginTop: '20px', cursor: 'pointer', color: 'var(--primary)', textAlign: 'center', fontWeight: 'bold' }}>
          {isRegistering ? "Already have an account? Login" : "No account? Register"}
        </p>
      </div>
    </div>
  );
}