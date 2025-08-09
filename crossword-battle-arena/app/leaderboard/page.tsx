"use client";
import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { firestore } from "@/lib/FirebaseClient";

export default function LeaderboardPage() {
  const [users, setUsers] = useState<any[]>([]);
  useEffect(() => {
    async function loadLeaderboard() {
      const q = query(collection(firestore, "user_stats"), orderBy("games_won", "desc"), limit(10));
      const snap = await getDocs(q);
      setUsers(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    }
    loadLeaderboard();
  }, []);
  return (
    <main style={{ padding: 30 }}>
      <h2>Leaderboard</h2>
      <table>
        <thead><tr><th>Name</th><th>Games Played</th><th>Wins</th><th>Losses</th></tr></thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.name || u.id}</td>
              <td>{u.games_played || 0}</td>
              <td>{u.games_won || 0}</td>
              <td>{u.games_lost || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
