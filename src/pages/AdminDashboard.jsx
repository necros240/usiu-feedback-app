import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore"; // Added addDoc
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function AdminDashboard() {
  const [feedbackData, setFeedbackData] = useState([]);
  
  // NEW: Club Management States
  const [clubs, setClubs] = useState([]); 
  const [newClubName, setNewClubName] = useState(""); 

  const [responseText, setResponseText] = useState({});
  const [filter, setFilter] = useState("all"); // 'all' or 'reported'

  useEffect(() => {
    // 1. Listen to Feedback (Existing)
    const unsubFeed = onSnapshot(collection(db, "feedback"), (snap) => {
      setFeedbackData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 2. Listen to Clubs (NEW)
    const unsubClubs = onSnapshot(collection(db, "clubs"), (snap) => {
      setClubs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubFeed(); unsubClubs(); };
  }, []);

  // --- Process Data for Charts ---
  const categoryStats = feedbackData.reduce((acc, curr) => {
    const found = acc.find(a => a.name === curr.category);
    if (found) found.count += 1;
    else acc.push({ name: curr.category, count: 1 });
    return acc;
  }, []);

  const statusStats = [
    { name: "New", value: feedbackData.filter(f => f.status === 'New').length },
    { name: "Resolved", value: feedbackData.filter(f => f.status === 'Resolved').length }
  ];

  // Calculate Reports
  const reportedCount = feedbackData.filter(f => f.reports && f.reports.length > 0).length;

  // --- Handlers ---

  const handleResolve = async (id) => {
    const response = responseText[id] || "Thank you for the feedback. We have looked into it.";
    await updateDoc(doc(db, "feedback", id), {
      status: "Resolved",
      response: response
    });
    setResponseText(prev => ({...prev, [id]: ""}));
  };
  
  // Delete post (Existing)
  const handleDelete = async (id) => {
    if(window.confirm("Are you sure you want to PERMANENTLY delete this feedback?")) {
        await deleteDoc(doc(db, "feedback", id));
    }
  };

  // NEW: Handle Adding a Club
  const handleAddClub = async (e) => {
    e.preventDefault();
    if (!newClubName.trim()) return;
    await addDoc(collection(db, "clubs"), { name: newClubName });
    setNewClubName("");
  };

  // NEW: Handle Deleting a Club
  const handleDeleteClub = async (id) => {
    if(window.confirm("Delete this club? Users in this club will need to update their profile manually.")) {
      await deleteDoc(doc(db, "clubs", id));
    }
  };

  // Filter Logic
  const filteredData = feedbackData.filter(item => {
    if (filter === "reported") return item.reports && item.reports.length > 0;
    return true;
  });

  return (
    <div className="container">
      <h1>Admin Dashboard</h1>

      {/* --- NEW SECTION: Manage Official Clubs --- */}
      <div className="card" style={{marginBottom: '30px', borderLeftColor: 'var(--accent)'}}>
        <h3>🏛️ Manage Official Clubs</h3>
        <p>Create clubs here. Users can then select them in their Profile Settings.</p>
        
        <form onSubmit={handleAddClub} style={{display: 'flex', gap: '10px', marginBottom: '15px'}}>
          <input 
            type="text" 
            placeholder="Enter Club Name (e.g. Chess Club)" 
            value={newClubName} 
            onChange={(e) => setNewClubName(e.target.value)} 
            style={{margin: 0}}
          />
          <button className="primary-btn" style={{width: 'auto', marginTop: 0}}>Add Club</button>
        </form>

        <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px'}}>
          {clubs.length === 0 ? <p style={{fontStyle:'italic', color:'#777'}}>No clubs added yet.</p> : 
            clubs.map(club => (
              <div key={club.id} style={{background: '#eee', padding: '5px 10px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #ccc'}}>
                <strong>{club.name}</strong>
                <button 
                  onClick={() => handleDeleteClub(club.id)} 
                  style={{border: 'none', background: 'none', cursor: 'pointer', color: 'red', fontWeight: 'bold'}}
                  title="Remove Club"
                >
                  ×
                </button>
              </div>
            ))
          }
        </div>
      </div>
      
      {/* --- Charts Section --- */}
      <div className="dashboard-stats">
        <div className="chart-container">
          <h4>Feedback by Category</h4>
          <BarChart width={300} height={250} data={categoryStats}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#003366" />
          </BarChart>
        </div>
        <div className="chart-container">
          <h4>Resolution Status</h4>
          <PieChart width={300} height={250}>
            <Pie data={statusStats} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label>
              {statusStats.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>
        
        {/* Reported Stats Card */}
        <div className="chart-container" style={{justifyContent: 'center', textAlign: 'center'}}>
            <h1 style={{fontSize: '4rem', color: reportedCount > 0 ? 'var(--danger)' : '#ccc', margin: 0}}>{reportedCount}</h1>
            <p>Reported Items</p>
            {reportedCount > 0 && <small style={{color: 'var(--danger)'}}>Action Required</small>}
        </div>
      </div>

      {/* --- Feedback Table Section --- */}
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px'}}>
        <h3>Feedback Management</h3>
        <div style={{display: 'flex', gap: '10px'}}>
            <button 
                onClick={() => setFilter("all")} 
                style={{
                    padding: '8px 16px', 
                    background: filter === 'all' ? 'var(--primary)' : '#ddd', 
                    color: filter === 'all' ? 'white' : '#333',
                    border: 'none', borderRadius: '4px', cursor: 'pointer'
                }}
            >
                All Items
            </button>
            <button 
                onClick={() => setFilter("reported")} 
                style={{
                    padding: '8px 16px', 
                    background: filter === 'reported' ? 'var(--danger)' : '#ddd', 
                    color: filter === 'reported' ? 'white' : '#333',
                    border: 'none', borderRadius: '4px', cursor: 'pointer'
                }}
            >
                ⚠️ Reported ({reportedCount})
            </button>
        </div>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Content</th>
            <th>Author</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map(item => (
            <tr key={item.id} style={item.reports && item.reports.length > 0 ? {backgroundColor: 'rgba(217, 83, 79, 0.1)'} : {}}>
              <td>
                {item.category}
                {item.reports && item.reports.length > 0 && (
                  <span 
                    title={`Reported by User IDs:\n${item.reports.join('\n')}`}
                    style={{display:'block', fontSize:'0.7rem', color:'red', fontWeight:'bold', cursor:'help'}}
                  >
                    🚩 {item.reports.length} Flags
                  </span>
                )}
              </td>
              <td>{item.content}</td>
              <td>
                {item.authorName}
                {item.isAnonymous && <span style={{fontSize: '0.8rem', color: '#888'}}> (Posted Anon)</span>}
              </td>
              <td>
                <span className={`badge ${item.status === 'Resolved' ? 'resolved' : 'new'}`}>{item.status}</span>
              </td>
              <td>
                <div style={{display:'flex', flexDirection:'column', gap: '5px'}}>
                    {item.status === "New" && (
                    <div style={{display:'flex', gap: '5px'}}>
                        <input 
                        type="text" 
                        placeholder="Type response..." 
                        style={{margin:0, padding: '5px', width: '120px'}}
                        value={responseText[item.id] || ""}
                        onChange={(e) => setResponseText({...responseText, [item.id]: e.target.value})}
                        />
                        <button className="action-btn" onClick={() => handleResolve(item.id)}>Resolve</button>
                    </div>
                    )}
                    
                    {/* Delete Button */}
                    <button 
                        onClick={() => handleDelete(item.id)}
                        style={{background: 'none', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '2px 5px', borderRadius: '4px', cursor:'pointer', fontSize: '0.8rem', width: 'fit-content'}}
                    >
                        Delete Post
                    </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}