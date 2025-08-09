// /app/game/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  SignedOut,
  SignInButton,
  SignOutButton,
  UserButton,
  useUser,
  RedirectToSignIn,
} from "@clerk/nextjs";
import { rtdb } from "@/lib/FirebaseClient";
import { ref, onValue, set, get } from "firebase/database";
import Link from "next/link";
import GameBoard from "../components/GameBoard";
import ChatBox from "../components/ChatBox";

export default function GamePage() {
  const { isSignedIn, user, isLoaded } = useUser();
  const [gameId] = useState("testgame1");
  const [scores, setScores] = useState({ player: 0, ai: 0 });

  // Listen for real-time score updates
  useEffect(() => {
    const scoresRef = ref(rtdb, `games/${gameId}`);
    const unsub = onValue(scoresRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setScores({
          player: data.player_score || 0,
          ai: data.ai_score || 0,
        });
      }
    });
    return () => unsub();
  }, [gameId]);

  // Simulate AI moves every 5 seconds
  useEffect(() => {
    if (!isSignedIn) return;

    const interval = setInterval(async () => {
      const snap = await get(ref(rtdb, `games/${gameId}/grid`));
      const current = snap.exists() ? snap.val() : Array(100).fill("");
      const emptyIndices = current
        .map((val: string, idx: number) => (val === "" ? idx : null))
        .filter((v: number | null) => v !== null);

      if (emptyIndices.length === 0) return; // Grid full

      const randomIndex =
        emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      current[randomIndex] = String.fromCharCode(
        65 + Math.floor(Math.random() * 26)
      );

      await set(ref(rtdb, `games/${gameId}/grid`), current);

      // Update AI score
      const scoreSnap = await get(ref(rtdb, `games/${gameId}/ai_score`));
      const aiScore = scoreSnap.exists() ? scoreSnap.val() + 1 : 1;
      await set(ref(rtdb, `games/${gameId}/ai_score`), aiScore);
    }, 5000);

    return () => clearInterval(interval);
  }, [gameId, isSignedIn]);

  // Loading state
  if (!isLoaded) return <div>Loading...</div>;

  // Conditional render if not signed in
  if (!isSignedIn) {
    return <RedirectToSignIn redirectUrl="/game" />; // optional redirectUrl
  }

  return (
    <main style={{ padding: "1rem" }}>
      <header
        style={{
          marginBottom: "1rem",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h1>Crossword Battle Arena</h1>
          <p>
            Logged in as: {user?.firstName} {user?.lastName}
          </p>
        </div>
        <div>
          <UserButton afterSignOutUrl="/" />
          <SignOutButton>
            <button style={{ padding: "0.3rem 0.8rem", marginLeft: "1rem" }}>
              Sign Out
            </button>
          </SignOutButton>
        </div>
      </header>

      <div style={{ marginBottom: "1rem" }}>
        <p>
          Scores — You: {scores.player} | AI: {scores.ai}
        </p>
      </div>

      {/* Game grid */}
      <GameBoard gameId={gameId} userId={user!.id} />

      {/* Chat UI */}
      <ChatBox gameId={gameId} userName={user?.fullName || "Player"} />

      <div style={{ marginTop: "1.5rem" }}>
        <Link href="/">
          <button style={{ padding: "0.5rem 1rem" }}>Back to Home</button>
        </Link>
      </div>
    </main>
  );
}