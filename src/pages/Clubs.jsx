import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";

export default function Clubs() {
  const { userRole, currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [myAffiliation, setMyAffiliation] = useState("");
  
  // Form States
  const [showForm, setShowForm] = useState(false);
  const [postType, setPostType] = useState("Event"); 
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  
  // NEW: Target Audience State
  const [audience, setAudience] = useState("Public"); // 'Public' or 'Members'

  // Editing & Comment States
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [commentText, setCommentText] = useState({});
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");

  const canPost = ["club", "tester", "master"].includes(userRole);

  // 1. Fetch User's Affiliation (to know which club they are in)
  useEffect(() => {
    if(currentUser) {
      getDoc(doc(db, "users", currentUser.uid)).then(snap => {
        if(snap.exists()) setMyAffiliation(snap.data().affiliation || "");
      });
    }
  }, [currentUser]);

  // 2. Fetch Posts
  useEffect(() => {
    const q = query(collection(db, "club_posts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => setPosts(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    return unsub;
  }, []);

  // --- Creation Logic ---
  const handleOptionChange = (index, value) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };
  const addOptionField = () => setPollOptions([...pollOptions, ""]);

  const handlePost = async (e) => {
    e.preventDefault();
    
    // If posting as Members Only, we attach the author's current club
    const targetClub = audience === "Members" ? myAffiliation : "Public";

    const newPost = {
      title, 
      authorId: currentUser.uid, 
      createdAt: serverTimestamp(), 
      likes: [], 
      comments: [], 
      type: postType,
      audience: audience, // 'Public' or 'Members'
      targetClub: targetClub // e.g., "Chess Club" or "Public"
    };

    if (postType === "Event") {
      newPost.content = content;
    } else {
      const formattedOptions = pollOptions.filter(opt => opt.trim() !== "").map(opt => ({ text: opt, votes: [] }));
      if (formattedOptions.length < 2) return alert("Polls need at least 2 options!");
      newPost.options = formattedOptions;
      newPost.content = "Poll"; 
    }
    await addDoc(collection(db, "club_posts"), newPost);
    setShowForm(false); setTitle(""); setContent(""); setPollOptions(["", ""]);
  };

  // --- Filter Logic ---
  const filteredPosts = posts.filter(post => {
    // 1. Public posts are seen by everyone
    if (!post.audience || post.audience === "Public") return true;
    
    // 2. Members Only posts:
    // Visible if I am the author OR my affiliation matches the post's target club
    if (post.audience === "Members") {
      return post.authorId === currentUser.uid || myAffiliation === post.targetClub;
    }
    return true;
  });

  // --- Edit & Interactions (Same as before) ---
  const startEdit = (post) => {
    setEditingId(post.id);
    setEditTitle(post.title);
    setEditContent(post.content);
  };
  const saveEdit = async (post) => {
    const ref = doc(db, "club_posts", post.id);
    const updates = { title: editTitle, isEdited: true };
    if (post.type === "Event") updates.content = editContent;
    await updateDoc(ref, updates);
    setEditingId(null);
  };
  const startCommentEdit = (postId, index, currentText) => {
    setEditingComment({ postId, index });
    setEditCommentText(currentText);
  };
  const saveCommentEdit = async (postId, index) => {
    const postRef = doc(db, "club_posts", postId);
    const postSnap = await getDoc(postRef);
    if (postSnap.exists()) {
      const data = postSnap.data();
      const updatedComments = [...data.comments];
      updatedComments[index] = { ...updatedComments[index], text: editCommentText, isEdited: true };
      await updateDoc(postRef, { comments: updatedComments });
    }
    setEditingComment(null);
  };
  const handleVote = async (postId, postOptions, optionIndex) => {
    const updatedOptions = postOptions.map((opt, idx) => {
      if (idx === optionIndex) {
        if (!opt.votes.includes(currentUser.uid)) return { ...opt, votes: [...opt.votes, currentUser.uid] };
        return opt;
      } else {
        return { ...opt, votes: opt.votes.filter(uid => uid !== currentUser.uid) };
      }
    });
    await updateDoc(doc(db, "club_posts", postId), { options: updatedOptions });
  };
  const handleLike = async (id) => await updateDoc(doc(db, "club_posts", id), { likes: arrayUnion(currentUser.uid) });
  const handleComment = async (id) => {
    if (!commentText[id]) return;
    await updateDoc(doc(db, "club_posts", id), {
      comments: arrayUnion({ text: commentText[id], author: currentUser.displayName || currentUser.email, authorId: currentUser.uid, date: new Date().toISOString() })
    });
    setCommentText({ ...commentText, [id]: "" });
  };

  return (
    <div className="container">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h1>Club Activities</h1>
        {/* Show user their club status */}
        {myAffiliation ? <span className="badge resolved">My Club: {myAffiliation}</span> : <span className="badge new">No Club Selected</span>}
      </div>
      
      {canPost && (
        <button className="primary-btn" onClick={() => setShowForm(!showForm)} style={{marginBottom: '20px', maxWidth: '200px'}}>
          {showForm ? "Cancel" : "+ Create Post"}
        </button>
      )}

      {showForm && (
        <div className="form-card">
          <div style={{marginBottom: '15px', display: 'flex', gap: '10px', justifyContent:'space-between'}}>
            <div style={{display:'flex', gap:'10px'}}>
              <button type="button" onClick={() => setPostType("Event")} style={{background: postType === "Event" ? 'var(--primary)' : '#ddd', color: postType === "Event" ? 'white' : '#333', padding: '5px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>Event</button>
              <button type="button" onClick={() => setPostType("Poll")} style={{background: postType === "Poll" ? 'var(--primary)' : '#ddd', color: postType === "Poll" ? 'white' : '#333', padding: '5px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>Poll</button>
            </div>
            
            {/* NEW: Audience Toggle */}
            <select value={audience} onChange={(e) => setAudience(e.target.value)} style={{width: 'auto', margin: 0}}>
              <option value="Public">🌍 Public (Everyone)</option>
              <option value="Members">🔒 Members Only ({myAffiliation})</option>
            </select>
          </div>

          <form onSubmit={handlePost}>
            <input placeholder={postType === "Event" ? "Event Title" : "Poll Question"} value={title} onChange={e => setTitle(e.target.value)} required />
            {postType === "Event" ? (
              <textarea placeholder="Event Details..." value={content} onChange={e => setContent(e.target.value)} required />
            ) : (
              <div style={{marginTop: '10px'}}>
                <label>Poll Options</label>
                {pollOptions.map((opt, idx) => (
                  <input key={idx} placeholder={`Option ${idx + 1}`} value={opt} onChange={(e) => handleOptionChange(idx, e.target.value)} required={idx < 2} />
                ))}
                <button type="button" onClick={addOptionField} style={{fontSize: '0.8rem', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer'}}>+ Add option</button>
              </div>
            )}
            <button className="primary-btn">Post {postType}</button>
          </form>
        </div>
      )}

      <div className="feed-grid">
        {filteredPosts.map(post => (
          <div key={post.id} className="card" style={{borderLeftColor: post.type === 'Poll' ? 'var(--danger)' : 'var(--accent)'}}>
            <div style={{display:'flex', justifyContent:'space-between'}}>
              <span className="badge new" style={{background: post.type === 'Poll' ? 'var(--danger)' : 'var(--primary)', color: 'white'}}>{post.type}</span>
              {post.audience === "Members" && <span style={{fontSize: '0.8rem', fontWeight:'bold', color: 'var(--primary)'}}>🔒 Members Only ({post.targetClub})</span>}
            </div>

            {/* ... (Rest of card content remains identical to previous version) ... */}
            {editingId === post.id ? (
              <div style={{marginTop: '10px', marginBottom: '10px', padding: '10px', background: '#f9f9f9', border: '1px dashed #ccc'}}>
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{marginBottom: '5px'}} />
                {post.type === "Event" && (
                  <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows="3" />
                )}
                <div style={{display:'flex', gap:'5px'}}>
                  <button onClick={() => saveEdit(post)} className="primary-btn" style={{padding:'5px', width:'auto', fontSize:'0.8rem'}}>Save</button>
                  <button onClick={() => setEditingId(null)} style={{padding:'5px', cursor:'pointer'}}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <h3 style={{display:'flex', alignItems:'center'}}>
                   {post.title} 
                   {post.isEdited && <span style={{fontSize: '0.6rem', color: '#888', marginLeft: '5px'}}>(edited)</span>}
                   {currentUser.uid === post.authorId && (
                     <button onClick={() => startEdit(post)} style={{background: 'none', border: 'none', cursor: 'pointer', marginLeft: '10px'}}>✏️</button>
                   )}
                </h3>
                
                {post.type === "Event" ? (
                  <p style={{whiteSpace: 'pre-wrap'}}>{post.content}</p>
                ) : (
                  <div style={{marginTop: '10px'}}>
                    {post.options && post.options.map((opt, idx) => {
                      const voteCount = opt.votes ? opt.votes.length : 0;
                      const totalVotes = post.options.reduce((acc, curr) => acc + (curr.votes ? curr.votes.length : 0), 0);
                      const percentage = totalVotes === 0 ? 0 : Math.round((voteCount / totalVotes) * 100);
                      const isVoted = opt.votes && opt.votes.includes(currentUser.uid);
                      return (
                        <div key={idx} style={{marginBottom: '10px', cursor: 'pointer'}} onClick={() => handleVote(post.id, post.options, idx)}>
                          <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '2px'}}>
                            <span>{opt.text} {isVoted && "✅"}</span>
                            <span>{percentage}% ({voteCount})</span>
                          </div>
                          <div style={{background: '#eee', height: '8px', borderRadius: '4px', overflow: 'hidden'}}>
                            <div style={{width: `${percentage}%`, background: 'var(--primary)', height: '100%', transition: 'width 0.3s'}}></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            <small style={{display: 'block', marginTop: '10px'}}>Posted on {post.createdAt ? new Date(post.createdAt.toDate()).toLocaleDateString() : 'Just now'}</small>

             <div className="interaction-bar">
                <button className="like-btn" onClick={() => handleLike(post.id)}>❤️ {post.likes ? post.likes.length : 0} Likes</button>
             </div>

              <div className="comment-section">
                <div className="comment-list">
                  {post.comments && post.comments.map((c, index) => (
                    <div key={index} className="comment-item">
                       {editingComment && editingComment.postId === post.id && editingComment.index === index ? (
                         <div style={{display: 'flex', gap: '5px'}}>
                           <input value={editCommentText} onChange={(e) => setEditCommentText(e.target.value)} />
                           <button onClick={() => saveCommentEdit(post.id, index)} style={{fontSize: '0.8rem'}}>Save</button>
                           <button onClick={() => setEditingComment(null)} style={{fontSize: '0.8rem'}}>X</button>
                         </div>
                       ) : (
                         <div>
                            <strong>{c.author.split('@')[0]}:</strong> {c.text}
                            {c.isEdited && <span style={{fontSize: '0.6rem', color: '#888', marginLeft: '5px'}}>(edited)</span>}
                            {(c.authorId === currentUser.uid || c.author === currentUser.email) && (
                              <button onClick={() => startCommentEdit(post.id, index, c.text)} style={{marginLeft: '10px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--primary)'}}>Edit</button>
                            )}
                         </div>
                       )}
                    </div>
                  ))}
                </div>
                <div style={{display:'flex', gap:'5px'}}>
                  <input type="text" placeholder="Add a comment..." value={commentText[post.id] || ""} onChange={(e) => setCommentText({...commentText, [post.id]: e.target.value})} />
                  <button onClick={() => handleComment(post.id)}>Send</button>
                </div>
              </div>
          </div>
        ))}
      </div>
    </div>
  );
}