import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, orderBy, onSnapshot, updateDoc, doc, arrayUnion, limit, getDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function Home() {
  const { currentUser, userRole } = useAuth();
  
  // Data States
  const [feedbacks, setFeedbacks] = useState([]);
  const [recentClubPosts, setRecentClubPosts] = useState([]);
  
  // Interaction States
  const [commentText, setCommentText] = useState({}); 
  
  // EDITING STATES (NEW)
  const [editingId, setEditingId] = useState(null); // ID of feedback being edited
  const [editText, setEditText] = useState("");     // Text being typed
  const [editingComment, setEditingComment] = useState(null); // { postId, index }
  const [editCommentText, setEditCommentText] = useState("");

  // Filter & Sort States
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Admin Check
  const isAdmin = ["admin", "faculty", "master", "tester"].includes(userRole);

  useEffect(() => {
    const qFeedback = query(collection(db, "feedback"), orderBy("createdAt", "desc"));
    const unsubFeed = onSnapshot(qFeedback, (snapshot) => {
      setFeedbacks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qClubs = query(collection(db, "club_posts"), orderBy("createdAt", "desc"), limit(3));
    const unsubClubs = onSnapshot(qClubs, (snapshot) => {
      setRecentClubPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubFeed(); unsubClubs(); };
  }, []);

  // --- Search & Sort Logic ---
  const filteredFeedbacks = feedbacks
    .filter((item) => {
      const term = searchTerm.toLowerCase();
      const contentMatch = item.content.toLowerCase().includes(term);
      const categoryMatch = item.category.toLowerCase().includes(term);
      const affiliationMatch = item.authorAffiliation && item.authorAffiliation.toLowerCase().includes(term);
      return contentMatch || categoryMatch || affiliationMatch;
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      if (sortBy === 'likes') {
        const likesA = a.likes ? a.likes.length : 0;
        const likesB = b.likes ? b.likes.length : 0;
        return likesB - likesA;
      }
      const dateA = a.createdAt?.seconds || 0;
      const dateB = b.createdAt?.seconds || 0;
      return dateB - dateA; 
    });

  // --- Actions ---
  const handlePin = async (id, currentStatus) => {
    const ref = doc(db, "feedback", id);
    await updateDoc(ref, { isPinned: !currentStatus });
  };

  const handleLike = async (collectionName, id) => {
    const ref = doc(db, collectionName, id);
    await updateDoc(ref, { likes: arrayUnion(currentUser.uid) });
  };

  const handleReport = async (id) => {
    const confirmReport = window.confirm("Are you sure you want to report this post?");
    if (!confirmReport) return;
    const ref = doc(db, "feedback", id);
    await updateDoc(ref, { reports: arrayUnion(currentUser.uid) });
    alert("Post reported.");
  };

  const handleComment = async (collectionName, id) => {
    if (!commentText[id]) return;
    const ref = doc(db, collectionName, id);
    await updateDoc(ref, {
      comments: arrayUnion({
        text: commentText[id],
        author: currentUser.displayName || currentUser.email,
        authorId: currentUser.uid, // Save ID to allow editing later
        date: new Date().toISOString()
      })
    });
    setCommentText({ ...commentText, [id]: "" });
  };

  // --- NEW: EDITING LOGIC (Feedback) ---
  const startEdit = (item) => {
    setEditingId(item.id);
    setEditText(item.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const saveEdit = async (id) => {
    const ref = doc(db, "feedback", id);
    await updateDoc(ref, {
      content: editText,
      isEdited: true
    });
    setEditingId(null);
  };

  // --- NEW: EDITING LOGIC (Comments) ---
  const startCommentEdit = (postId, index, currentText) => {
    setEditingComment({ postId, index });
    setEditCommentText(currentText);
  };

  const saveCommentEdit = async (collectionName, postId, index) => {
    const postRef = doc(db, collectionName, postId);
    const postSnap = await getDoc(postRef);
    
    if (postSnap.exists()) {
      const data = postSnap.data();
      const updatedComments = [...data.comments];
      
      // Update the specific comment
      updatedComments[index] = {
        ...updatedComments[index],
        text: editCommentText,
        isEdited: true
      };

      await updateDoc(postRef, { comments: updatedComments });
    }
    setEditingComment(null);
  };

  return (
    <div className="home-wrapper">
      <div className="container">
        
        {/* Club Teaser */}
        <h2 className="section-title">🔥 Happening Now (Clubs)</h2>
        <div className="feed-grid">
          {recentClubPosts.map(post => (
            <div key={post.id} className="card club-highlight">
              <span className="badge new" style={{background: post.type === 'Poll' ? 'var(--danger)' : 'var(--primary)', color: 'white', fontSize: '0.7rem'}}>{post.type}</span>
              <h3>{post.title}</h3>
              <Link to="/clubs" style={{color: 'var(--primary)', fontWeight:'bold', textDecoration:'none'}}>View Details &rarr;</Link>
            </div>
          ))}
        </div>

        {/* Feedback Section */}
        <h2 className="section-title" style={{marginBottom: '10px'}}>📢 Campus Feedback</h2>
        
        {/* Controls */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', background: 'var(--card)', padding: '15px', borderRadius: '8px', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="🔍 Search topics..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{margin: 0, flex: 2, minWidth: '200px'}}
          />
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            style={{margin: 0, flex: 1, minWidth: '150px'}}
          >
            <option value="newest">📅 Newest First</option>
            <option value="likes">❤️ Most Liked</option>
          </select>
        </div>

        {/* Feed */}
        <div className="feed-grid">
          {filteredFeedbacks.map(item => (
            <div key={item.id} className="card" style={item.isPinned ? {border: '2px solid var(--accent)', background: '#fffcf5'} : {}}>
              
              {/* Pinned Header */}
              {item.isPinned && (
                <div style={{marginBottom: '10px', color: 'var(--accent)', fontWeight: 'bold'}}>📌 Pinned Announcement</div>
              )}

              {/* Admin Controls */}
              {isAdmin && (
                <div style={{marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '5px'}}>
                  <button onClick={() => handlePin(item.id, item.isPinned)} style={{background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: '0.8rem'}}>
                    {item.isPinned ? "Unpin Post" : "📌 Pin to Top"}
                  </button>
                </div>
              )}

              <span className={`badge ${item.status === 'Resolved' ? 'resolved' : 'new'}`}>{item.status}</span>
              <small> | {item.category}</small>
              
              {/* EDITING UI FOR CONTENT */}
              {editingId === item.id ? (
                <div style={{marginTop: '10px'}}>
                  <textarea 
                    value={editText} 
                    onChange={(e) => setEditText(e.target.value)} 
                    style={{width: '100%', padding: '10px'}}
                  />
                  <div style={{display:'flex', gap:'10px', marginTop:'5px'}}>
                    <button onClick={() => saveEdit(item.id)} className="primary-btn" style={{padding:'5px', fontSize:'0.8rem', width:'auto'}}>Save</button>
                    <button onClick={cancelEdit} style={{padding:'5px', fontSize:'0.8rem', cursor:'pointer'}}>Cancel</button>
                  </div>
                </div>
              ) : (
                <h3 style={{position: 'relative'}}>
                  {item.content}
                  {item.isEdited && <span style={{fontSize: '0.7rem', color: '#888', fontWeight: 'normal', marginLeft: '5px'}}>(edited)</span>}
                  
                  {/* Edit Icon for Author */}
                  {currentUser.uid === item.authorId && (
                    <button onClick={() => startEdit(item)} style={{background: 'none', border: 'none', cursor: 'pointer', marginLeft: '10px', fontSize: '1rem'}}>✏️</button>
                  )}
                </h3>
              )}
              
              {/* Author */}
              {item.isAnonymous ? (
                <small style={{fontStyle: 'italic', color: 'var(--text-secondary)'}}>By: Anonymous Student</small>
              ) : (
                <small>By: {item.authorName} {item.authorAffiliation && `(${item.authorAffiliation})`}</small>
              )}
              
              {/* Response */}
              {item.response && (
                <div className="admin-response">
                  <strong>Admin Response:</strong> <p>{item.response}</p>
                </div>
              )}

              {/* Interactions */}
              <div className="interaction-bar" style={{justifyContent: 'space-between'}}>
                <div style={{display:'flex', gap:'15px'}}>
                  <button className="like-btn" onClick={() => handleLike("feedback", item.id)}>
                    ❤️ {item.likes ? item.likes.length : 0}
                  </button>
                  <span>💬 {item.comments ? item.comments.length : 0} comments</span>
                </div>
                {(!item.reports || !item.reports.includes(currentUser.uid)) ? (
                  <button onClick={() => handleReport(item.id)} style={{background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: '0.8rem'}}>🚩 Report</button>
                ) : (
                  <span style={{fontSize: '0.8rem', color: 'var(--danger)', fontStyle: 'italic'}}>🚩 Reported</span>
                )}
              </div>

              {/* Comments */}
              <div className="comment-section">
                <div className="comment-list">
                  {item.comments && item.comments.map((c, index) => (
                    <div key={index} className="comment-item">
                      {editingComment && editingComment.postId === item.id && editingComment.index === index ? (
                         // EDIT COMMENT MODE
                         <div style={{display: 'flex', gap: '5px'}}>
                           <input value={editCommentText} onChange={(e) => setEditCommentText(e.target.value)} />
                           <button onClick={() => saveCommentEdit("feedback", item.id, index)} style={{fontSize: '0.8rem'}}>Save</button>
                           <button onClick={() => setEditingComment(null)} style={{fontSize: '0.8rem'}}>X</button>
                         </div>
                      ) : (
                        // VIEW COMMENT MODE
                        <div>
                          <strong>{c.author.split('@')[0]}: </strong> {c.text}
                          {c.isEdited && <span style={{fontSize: '0.6rem', color: '#888', marginLeft: '5px'}}>(edited)</span>}
                          
                          {/* Edit Button for Comment Author */}
                          {(c.authorId === currentUser.uid || c.author === currentUser.email) && (
                            <button 
                              onClick={() => startCommentEdit(item.id, index, c.text)}
                              style={{marginLeft: '10px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--primary)'}}
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{display:'flex', gap:'5px'}}>
                  <input type="text" placeholder="Comment..." value={commentText[item.id] || ""} onChange={(e) => setCommentText({...commentText, [item.id]: e.target.value})} />
                  <button onClick={() => handleComment("feedback", item.id)}>Post</button>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}