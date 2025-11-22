import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/Spinner";

export default function Profile() {
  const { currentUser } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [affiliation, setAffiliation] = useState(""); // Now stores Club Name
  const [officialClubs, setOfficialClubs] = useState([]); // List from DB
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      if (currentUser) {
        // 1. Fetch User Profile
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setDisplayName(data.displayName || "");
          setAffiliation(data.affiliation || "");
        }

        // 2. Fetch Official Clubs List
        const clubsSnapshot = await getDocs(collection(db, "clubs"));
        const clubsList = clubsSnapshot.docs.map(doc => doc.data().name);
        setOfficialClubs(clubsList.sort()); // Alphabetical
      }
      setLoading(false);
    };
    loadData();
  }, [currentUser]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const userRef = doc(db, "users", currentUser.uid);
      
      await updateDoc(userRef, {
        displayName: displayName,
        affiliation: affiliation // Saves selected club
      });

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: displayName });
      }

      setMessage("✅ Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("❌ Failed to update profile.");
    }
  };

  // Replace the loading text div
  if (loading) return (
    <div className="container">
        <div className="form-card">
            <Spinner />
        </div>
    </div>
  );

  return (
    <div className="container">
      <div className="form-card">
        <h2 style={{color: 'var(--primary)', borderBottom: '2px solid var(--accent)', paddingBottom: '10px'}}>
          My Profile Settings
        </h2>
        
        {message && (
          <div style={{padding: '10px', background: message.includes('✅') ? '#d4edda' : '#f8d7da', color: message.includes('✅') ? '#155724' : '#721c24', borderRadius: '4px', marginBottom: '15px'}}>
            {message}
          </div>
        )}

        <form onSubmit={handleUpdate}>
          <label><strong>Display Name</strong></label>
          <input type="text" placeholder="e.g. Jane Doe" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          
          {/* UPDATED: Dropdown for Club/Affiliation */}
          <label><strong>Select Your Club / Affiliation</strong></label>
          <select value={affiliation} onChange={(e) => setAffiliation(e.target.value)}>
            <option value="">-- Select a Club --</option>
            <option value="None">No Club / General Student</option>
            {officialClubs.map((club, index) => (
              <option key={index} value={club}>{club}</option>
            ))}
          </select>
          <small style={{display:'block', color:'#666', marginTop:'5px'}}>
            *If you are a Club Head, select the club you manage.
          </small>

          <div style={{marginTop: '20px', fontSize: '0.9rem', color: '#666'}}>
            <p><strong>Email:</strong> {currentUser.email}</p>
          </div>

          <button type="submit" className="primary-btn">Save Changes</button>
        </form>
      </div>
    </div>
  );
}