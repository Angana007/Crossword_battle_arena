import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { firestore } from "@/lib/FirebaseClient";
import { clerkClient } from "@clerk/nextjs/server";

type PlayerStats = {
  id: string;
  name?: string;
  imageUrl?: string;
  games_played: number;
  games_won: number;
  games_lost: number;
};

export default async function LeaderboardPage() {
  // 1️⃣ Get top 10 players from Firestore
  const q = query(collection(firestore, "user_stats"), orderBy("games_won", "desc"), limit(10));
  const snap = await getDocs(q);

  // 2️⃣ Get Clerk client
  const client = await clerkClient();

  // 3️⃣ Build enriched leaderboard
  const players: PlayerStats[] = await Promise.all(
    snap.docs.map(async (doc) => {
      const data = doc.data();
      let name = data?.name || "";
      let imageUrl = "";

      try {
        const user = await client.users.getUser(doc.id);
        if (user) {
          name = user.fullName || name || doc.id;
          imageUrl = user.imageUrl || "";
        }
      } catch {
        // Ignore Clerk errors (guest or deleted users)
      }

      return {
        id: doc.id,
        name,
        imageUrl,
        games_played: data.games_played || 0,
        games_won: data.games_won || 0,
        games_lost: data.games_lost || 0,
      };
    })
  );

  return (
    <main style={{ padding: "1.5rem" }}>
      <h2>🏆 Leaderboard</h2>
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            maxWidth: 800,
            background: "#fff",
            borderRadius: "6px",
            overflow: "hidden",
            boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <thead style={{ background: "#f2f2f2" }}>
            <tr>
              <th style={thStyle}>Rank</th>
              <th style={thStyle}>Player</th>
              <th style={thStyle}>Games Played</th>
              <th style={thStyle}>Wins</th>
              <th style={thStyle}>Losses</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p, idx) => (
              <tr
                key={p.id}
                style={{
                  borderBottom: "1px solid #eee",
                  background: idx % 2 === 0 ? "#fafafa" : "#fff",
                }}
              >
                <td style={tdStyle}>{idx + 1}</td>
                <td style={{ ...tdStyle, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {p.imageUrl && (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      style={{ width: 32, height: 32, borderRadius: "50%" }}
                    />
                  )}
                  {p.name || p.id}
                </td>
                <td style={tdStyle}>{p.games_played}</td>
                <td style={tdStyle}>{p.games_won}</td>
                <td style={tdStyle}>{p.games_lost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

const thStyle: React.CSSProperties = {
  padding: "0.75rem",
  textAlign: "left",
  fontWeight: "bold",
};
const tdStyle: React.CSSProperties = { padding: "0.75rem" };
