import React, { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function SubmitFeedback() {
  const [category, setCategory] = useState("Facilities");
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false); 
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let authorName = currentUser.email;
    let authorAffiliation = "";

    try {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.displayName) authorName = userData.displayName;
        if (userData.affiliation) authorAffiliation = userData.affiliation;
      }
    } catch (err) {
      console.log("Error fetching user details", err);
    }

    await addDoc(collection(db, "feedback"), {
      category,
      content,
      status: "New",
      authorId: currentUser.uid,
      authorName: authorName, 
      authorAffiliation: authorAffiliation,
      isAnonymous: isAnonymous, 
      createdAt: serverTimestamp(),
      response: "",
      likes: [],
      comments: []
    });
    
    navigate("/");
  };

  return (
    <div className="form-card">
      <h2 style={{color: 'var(--primary)'}}>Submit Feedback</h2>
      <form onSubmit={handleSubmit}>
        <label>Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="Facilities">Facilities</option>
          <option value="Academics">Academics</option>
          <option value="Cafeteria">Cafeteria</option>
          <option value="Security">Security</option>
          <option value="Clubs">Clubs & Student Affairs</option>
        </select>
        
        <label>Details</label>
        <textarea 
          rows="5" 
          value={content} 
          onChange={(e) => setContent(e.target.value)} 
          required 
          placeholder="Describe your issue or suggestion..." 
        />

        
        <div style={{display: 'flex', alignItems: 'center', gap: '10px', margin: '15px 0'}}>
          <input 
            type="checkbox" 
            id="anon" 
            checked={isAnonymous} 
            onChange={(e) => setIsAnonymous(e.target.checked)} 
            style={{width: 'auto', margin: 0}}
          />
          <label htmlFor="anon" style={{cursor: 'pointer'}}>
            Post Anonymously (Name hidden from public feed)
          </label>
        </div>
        
        <button type="submit" className="primary-btn">Submit Feedback</button>
      </form>
    </div>
  );
}