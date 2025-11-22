import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function MyActivity() {
  const { currentUser } = useAuth();
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    // Query: Get posts where author is Me
    const q = query(
      collection(db, "feedback"), 
      where("authorId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Filter client-side for those that HAVE a response
      const respondedOnly = data.filter(item => item.response && item.response.trim() !== "");
      setMyFeedbacks(respondedOnly);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  if (loading) return <div className="container">Loading activity...</div>;

  return (
    <div className="container">
      <h2 className="section-title">🔔 My Notifications</h2>
      <p style={{marginBottom: '20px', color: 'var(--text-secondary)'}}>
        Feedback you submitted that has been resolved or replied to by the administration.
      </p>

      <div className="feed-grid">
        {myFeedbacks.length === 0 ? (
          <div className="card" style={{gridColumn: '1 / -1', textAlign: 'center'}}>
            <p>No new notifications.</p>
            <Link to="/submit" className="primary-btn" style={{display:'inline-block', width:'auto', marginTop:'10px', textDecoration:'none'}}>Submit Feedback</Link>
          </div>
        ) : (
          myFeedbacks.map(item => (
            <div key={item.id} className="card" style={{borderLeftColor: 'var(--success)'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <span className="badge resolved">Response Received</span>
                <small>{new Date(item.createdAt?.toDate()).toLocaleDateString()}</small>
              </div>
              
              <h3 style={{marginTop: '10px'}}>{item.content}</h3>
              <small>Category: {item.category}</small>

              {/* Response Section */}
              <div className="admin-response">
                <strong>Admin Response:</strong>
                <p>{item.response}</p>
              </div>
              
              <div style={{marginTop: '15px', textAlign: 'right'}}>
                <Link to="/" style={{color: 'var(--primary)', fontSize: '0.9rem'}}>View in Feed &rarr;</Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}