import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import Spinner from "../components/Spinner"; 

export default function MyActivity() {
  const { currentUser } = useAuth();
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    
    const q = query(
      collection(db, "feedback"), 
      where("authorId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const respondedOnly = data.filter(item => item.response && item.response.trim() !== "");
      
      setMyFeedbacks(respondedOnly);
      
      setLoading(false);
    }, (error) => {
       console.error("Error fetching activity:", error);
       
       setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  
  if (loading) {
    return (
      <div className="container">
        <h2 className="section-title">🔔 My Notifications</h2>
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container">
      <h2 className="section-title">🔔 My Notifications</h2>
      <p style={{marginBottom: '20px', color: 'var(--text-secondary)'}}>
        Feedback you submitted that has been resolved or replied to by the administration.
      </p>

      <div className="feed-grid">
        
        {myFeedbacks.length === 0 ? (
          <div className="card" style={{gridColumn: '1 / -1', textAlign: 'center', padding: '40px'}}>
            <h3>No activity yet</h3>
            <p style={{color: 'var(--text-secondary)', marginBottom: '20px'}}>
              When an admin replies to your feedback, it will appear here.
            </p>
            <Link to="/submit" className="primary-btn" style={{display:'inline-block', width:'auto', textDecoration:'none'}}>
              Submit New Feedback
            </Link>
          </div>
        ) : (
          
          myFeedbacks.map(item => (
            <div key={item.id} className="card" style={{borderLeftColor: 'var(--success)'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <span className="badge resolved">Response Received</span>
                <small>{item.createdAt ? new Date(item.createdAt.toDate()).toLocaleDateString() : ''}</small>
              </div>
              
              <h3 style={{marginTop: '10px'}}>{item.content}</h3>
              <small>Category: {item.category}</small>

              
              <div className="admin-response">
                <strong>Admin Response:</strong>
                <p>{item.response}</p>
              </div>
              
              <div style={{marginTop: '15px', textAlign: 'right'}}>
                <Link to="/home" style={{color: 'var(--primary)', fontSize: '0.9rem'}}>View in Feed &rarr;</Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}