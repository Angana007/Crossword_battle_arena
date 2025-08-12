"use client";

import { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { firestore } from "@/lib/FirebaseClient";
import { doc, getDoc } from "firebase/firestore";
import { sendAiChatMessage } from "@/lib/sendAiChatMessage";

export default function WelcomeMessage({ gameId }: { gameId: string }) {
  const { user } = useUser();
  const [stats, setStats] = useState<{ games_played: number; games_won: number; games_lost: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const sentRef = useRef(false);

  // Load player stats from Firestore
  useEffect(() => {
    async function loadStats() {
      if (!user) return;
      try {
        const snap = await getDoc(doc(firestore, "user_stats", user.id));
        if (snap.exists()) {
          const data = snap.data();
          setStats({
            games_played: data.games_played || 0,
            games_won: data.games_won || 0,
            games_lost: data.games_lost || 0,
          });
        } else {
          setStats({ games_played: 0, games_won: 0, games_lost: 0 });
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
        setStats({ games_played: 0, games_won: 0, games_lost: 0 });
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [user]);

  // Send AI welcome-back message only once
  useEffect(() => {
    async function sendWelcome() {
      if (!user || !stats || sentRef.current) return;
      sentRef.current = true;
      await sendAiChatMessage({
        gameId,
        eventType: "welcome_back",
        playerName: user.firstName || "Player",
        gameState: {},
        stats,
      });
    }
    sendWelcome();
  }, [stats, user, gameId]);

  if (loading) {
    return (
      <div style={{ padding: "1rem", fontStyle: "italic" }}>
        Loading welcome message...
      </div>
    );
  }

  if (!user || !stats) return null;

  // UI Layout
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        background: "#f4f4f4",
        padding: "1rem",
        borderRadius: "8px",
        marginBottom: "1rem",
        boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      <img
        src={user.imageUrl}
        alt={user.fullName || ""}
        style={{
          width: 50,
          height: 50,
          borderRadius: "50%",
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1 }}>
        <h2 style={{ margin: "0 0 0.25rem" }}>
          👋 Welcome back, {user.firstName}!
        </h2>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "#444" }}>
          Games played: {stats.games_played} | Wins: {stats.games_won} | Losses: {stats.games_lost}
        </p>
      </div>
    </div>
  );
}
