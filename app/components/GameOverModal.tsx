// app/components/GameOverModal.tsx
"use client";
import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { rtdb } from "@/lib/FirebaseClient";

export default function GameOverModal({ gameId, userId }: { gameId: string, userId: string }) {
  const [winner, setWinner] = useState<string | null>(null);
  const [gameStatus, setGameStatus] = useState("active");

  useEffect(() => {
    const statusRef = ref(rtdb, `games/${gameId}/game_status`);
    const winnerRef = ref(rtdb, `games/${gameId}/winner`);
    onValue(statusRef, snap => setGameStatus(snap.val()));
    onValue(winnerRef, snap => setWinner(snap.val()));
  }, [gameId]);
  
  if (gameStatus !== "completed") return null;

  return (
    <div style={{
      position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh",
      background: "rgba(0,0,0,0.7)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99
    }}>
      <div style={{ padding: 40, background: "#222", borderRadius: 8 }}>
        <h2>Game Over!</h2>
        <p>{winner === userId ? "You win! 🎉" : winner === "ai" ? "AI wins!" : ""}</p>
        <a href="/" style={{ marginTop: 16, display: "block", color: "#0af" }}>
          Back to Home
        </a>
      </div>
    </div>
  );
}
