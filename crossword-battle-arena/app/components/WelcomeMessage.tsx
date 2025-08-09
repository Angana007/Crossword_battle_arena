"use client";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { firestore } from "@/lib/FirebaseClient";
import { doc, getDoc } from "firebase/firestore";
import { ref, set } from "firebase/database";
import { rtdb } from "@/lib/FirebaseClient";

export default function WelcomeMessage({ gameId }: { gameId: string }) {
  const { user } = useUser();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      if (!user) return;
      try {
        const snap = await getDoc(doc(firestore, "user_stats", user.id));
        setStats(snap.exists() ? snap.data() : {});
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [user]);

  // Send AI welcome-back message to chat
  useEffect(() => {
    async function sendAiWelcome() {
      if (!user) return;
      try {
        const res = await fetch("/api/ai-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventType: "welcome_back",
            playerName: user.firstName || "Player",
            stats,
          }),
        });
        const { message } = await res.json();
        // Push message into game chat
        await set(
          ref(rtdb, `chat_messages/${gameId}/${Date.now()}_${Math.floor(Math.random() * 10000)}`),
          {
            sender: "ai",
            message,
            timestamp: Date.now(),
          }
        );
      } catch (err) {
        console.error("AI welcome message error:", err);
      }
    }

    if (stats && user) {
      sendAiWelcome();
    }
  }, [stats, user, gameId]);

  if (loading) return <div>Loading welcome message...</div>;

  return (
    <div style={{
      background: "#f4f4f4",
      padding: "1rem",
      borderRadius: "8px",
      marginBottom: "1rem",
      boxShadow: "0px 2px 4px rgba(0,0,0,0.1)"
    }}>
      <h2>
        👋 Welcome back, {user?.firstName}!
      </h2>
      {stats && (
        <p style={{ margin: 0 }}>
          Games played: {stats.games_played || 0} | Wins: {stats.games_won || 0} | Losses: {stats.games_lost || 0}
        </p>
      )}
    </div>
  );
}
