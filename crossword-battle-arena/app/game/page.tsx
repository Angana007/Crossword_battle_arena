"use client";

import { useEffect, useState } from "react";
import {
  useUser,
  RedirectToSignIn,
  UserButton,
  SignOutButton
} from "@clerk/nextjs";
import Link from "next/link";
import { rtdb } from "@/lib/FirebaseClient";
import { ref, onValue, set, get, update } from "firebase/database";
import GameBoard from "../components/GameBoard";
import ChatBox from "../components/ChatBox";
import { allClues, puzzle1Size } from "@/app/puzzles/puzzle1";
import { updateUserStats } from "@/lib/updateUserStats";
import { sendAiChatMessage } from "@/lib/sendAiChatMessage";

function checkGameOver(grid: string[]): boolean {
  return allClues.every(clue => {
    const [sr, sc] = clue.start;
    for (let i = 0; i < clue.answer.length; i++) {
      const r = sr + (clue.direction === "down" ? i : 0);
      const c = sc + (clue.direction === "across" ? i : 0);
      if (grid[r * puzzle1Size + c] !== clue.answer[i]) return false;
    }
    return true;
  });
}

function randomString(len: number) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let s = "";
  for (let i = 0; i < len; i++) {
    s += letters[Math.floor(Math.random() * letters.length)];
  }
  return s;
}

export default function GamePage() {
  const { isSignedIn, isLoaded, user } = useUser();
  const [gameId] = useState("testgame1");
  const [scores, setScores] = useState({ player: 0, ai: 0 });

  // Listen for score updates
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

  // 🤖 AI Opponent Full Word Logic (with chat calls)
  useEffect(() => {
    if (!isSignedIn || !user) return;

    let cluePool = [...allClues]; // copy clues
    let stopAI = false;

    const scheduleNext = () => {
      if (stopAI || cluePool.length === 0) return;
      const delay = 3000 + Math.random() * 5000; // 3–8s
      setTimeout(playNext, delay);
    };

    const playNext = async () => {
      if (stopAI || cluePool.length === 0) return;

      const clue = cluePool.shift()!;
      if (Math.random() < 0.3) return scheduleNext(); // skips word
      const attempt = Math.random() < 0.2 ? randomString(clue.answer.length) : clue.answer;

      const snap = await get(ref(rtdb, `games/${gameId}/grid`));
      const current = snap.exists()
        ? snap.val()
        : Array(puzzle1Size * puzzle1Size).fill("");

      const [sr, sc] = clue.start;
      for (let i = 0; i < clue.answer.length; i++) {
        const r = sr + (clue.direction === "down" ? i : 0);
        const c = sc + (clue.direction === "across" ? i : 0);
        current[r * puzzle1Size + c] = attempt[i];
      }

      await set(ref(rtdb, `games/${gameId}/grid`), current);

      // Mark solved cells if correct
      if (attempt === clue.answer) {
        const solvedCells: { [cell: number]: string } = {};
        for (let i = 0; i < clue.answer.length; i++) {
          const r = sr + (clue.direction === "down" ? i : 0);
          const c = sc + (clue.direction === "across" ? i : 0);
          solvedCells[r * puzzle1Size + c] = "ai";
        }
        await update(ref(rtdb, `games/${gameId}/solved_words`), solvedCells);
        await set(ref(rtdb, `games/${gameId}/ai_score`), (scores.ai || 0) + 1);

        // 🟢 Send AI chat for solving word
        await sendAiChatMessage({
          gameId,
          eventType: "ai_solved",
          clue,
          playerName: user.firstName || user.id || "Player",
          gameState: { player_score: scores.player, ai_score: (scores.ai || 0) + 1 },
        });
      }

      // AI win logic
      if (checkGameOver(current)) {
        stopAI = true;
        await set(ref(rtdb, `games/${gameId}/game_status`), "completed");
        await set(ref(rtdb, `games/${gameId}/winner`), "ai");

        // 🟢 Send AI win chat
        await sendAiChatMessage({
          gameId,
          eventType: "ai_win",
          playerName: user.firstName || user.id || "Player",
          gameState: { player_score: scores.player, ai_score: (scores.ai || 0) + 1 },
        });

        try {
          await updateUserStats(user.id, false); // player loss
        } catch (err) {
          console.error("Failed to update stats:", err);
        }
        return;
      }

      scheduleNext();
    };

    scheduleNext();
    return () => {
      stopAI = true;
    };
  }, [gameId, isSignedIn, scores.ai, scores.player, user]);

  if (!isLoaded) return <div>Loading...</div>;
  if (!isSignedIn) return <RedirectToSignIn redirectUrl="/game" />;

  return (
    <main style={{ padding: "1rem" }}>
      <header style={{
        marginBottom: "1rem",
        display: "flex",
        justifyContent: "space-between",
      }}>
        <div>
          <h1>Crossword Battle Arena</h1>
          <p>Logged in as: {user.firstName} {user.lastName}</p>
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
      <GameBoard gameId={gameId} userId={user.id} />
      <ChatBox gameId={gameId} userName={user.fullName || "Player"} />
      <div style={{ marginTop: "1.5rem" }}>
        <Link href="/">
          <button style={{ padding: "0.5rem 1rem" }}>Back to Home</button>
        </Link>
      </div>
    </main>
  );
}
