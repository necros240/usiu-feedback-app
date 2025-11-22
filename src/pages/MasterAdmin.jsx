import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";

export default function MasterAdmin() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const changeRole = async (id, newRole) => {
    await updateDoc(doc(db, "users", id), { role: newRole });
  };

  return (
    <div className="container">
      <h1>System Administration</h1>
      <p>Manage User Roles</p>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Current Role</th>
            <th>Update Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.email}</td>
              <td><strong>{user.role}</strong></td>
              <td>
                <select 
                  value={user.role} 
                  onChange={(e) => changeRole(user.id, e.target.value)}
                >
                  <option value="student">Student</option>
                  <option value="club">Club Account</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                  <option value="master">Master</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}