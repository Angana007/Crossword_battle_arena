"use client";

import { useEffect, useState } from "react";
import { useUser, RedirectToSignIn, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { rtdb } from "@/lib/FirebaseClient";
import { ref, onValue, set, get, update } from "firebase/database";
import { getPuzzleData, Clue } from "@/app/puzzles";
import GameBoard from "../components/GameBoard";
import ChatBox from "../components/ChatBox";
import WelcomeMessage from "../components/WelcomeMessage";
import { updateUserStats } from "@/lib/updateUserStats";
import { sendAiChatMessage } from "@/lib/sendAiChatMessage";

export default function GamePage() {
  const { isLoaded, isSignedIn, user } = useUser();

  // For now, use a fixed test ID — replace with dynamic param
  const [gameId] = useState("testgame1");
  const [scores, setScores] = useState({ player: 0, ai: 0 });
  const [gridSize, setGridSize] = useState(10);
  const [clues, setClues] = useState<Clue[]>([]);

  // Load game data + puzzle
  useEffect(() => {
    const gameRef = ref(rtdb, `games/${gameId}`);
    const unsub = onValue(gameRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setScores({
          player: data.player_score || 0,
          ai: data.ai_score || 0,
        });

        const puzzleIdRaw: string = data.puzzle_id || "puzzle1";
        const puzzleData = getPuzzleData(puzzleIdRaw);

        setGridSize(puzzleData.gridSize);
        setClues(puzzleData.allClues as Clue[]);
      }
    });
    return () => unsub();
  }, [gameId]);

  // AI opponent simulation
  useEffect(() => {
    if (!isSignedIn || !user || clues.length === 0) return;

    let cluePool = [...clues];
    let stopAI = false;

    const scheduleNext = () => {
      if (stopAI || cluePool.length === 0) return;
      const delay = 3000 + Math.random() * 5000;
      setTimeout(playNext, delay);
    };

    const playNext = async () => {
      if (stopAI || cluePool.length === 0) return;

      const clue = cluePool.shift()!;
      if (Math.random() < 0.3) return scheduleNext();

      const attempt =
        Math.random() < 0.2
          ? randomString(clue.answer.length)
          : clue.answer;

      // Get current grid
      const snap = await get(ref(rtdb, `games/${gameId}/grid`));
      const current: string[] = snap.exists()
        ? snap.val()
        : Array(gridSize * gridSize).fill("");

      // Fill grid with AI's attempt
      const [sr, sc] = clue.start;
      for (let i = 0; i < clue.answer.length; i++) {
        const r = sr + (clue.direction === "down" ? i : 0);
        const c = sc + (clue.direction === "across" ? i : 0);
        current[r * gridSize + c] = attempt[i];
      }
      await set(ref(rtdb, `games/${gameId}/grid`), current);

      // If AI solved correctly
      if (attempt === clue.answer) {
        const solved: { [key: number]: string } = {};
        for (let i = 0; i < clue.answer.length; i++) {
          const r = sr + (clue.direction === "down" ? i : 0);
          const c = sc + (clue.direction === "across" ? i : 0);
          solved[r * gridSize + c] = "ai";
        }
        await update(ref(rtdb, `games/${gameId}/solved_words`), solved);
        await set(ref(rtdb, `games/${gameId}/ai_score`), (scores.ai || 0) + 1);

        await sendAiChatMessage({
          gameId,
          eventType: "ai_solved",
          clue,
          playerName: user.firstName || "Player",
          gameState: { player_score: scores.player, ai_score: (scores.ai || 0) + 1 },
        });
      }

      // Check game over
      if (checkGameOver(current, clues, gridSize)) {
        stopAI = true;

        await set(ref(rtdb, `games/${gameId}/game_status`), "completed");
        await set(ref(rtdb, `games/${gameId}/winner`), "ai");

        await sendAiChatMessage({
          gameId,
          eventType: "ai_win",
          playerName: user.firstName || "Player",
          gameState: { player_score: scores.player, ai_score: (scores.ai || 0) + 1 },
        });

        await updateUserStats(user.id, false);
        return;
      }

      scheduleNext();
    };

    scheduleNext();
    return () => {
      stopAI = true;
    };
  }, [gameId, isSignedIn, user, scores.ai, scores.player, clues, gridSize]);

  // Helpers
  function checkGameOver(gridArr: string[], clues: Clue[], gridSize: number): boolean {
    return clues.every((clue) => {
      const [sr, sc] = clue.start;
      for (let i = 0; i < clue.answer.length; i++) {
        const r = sr + (clue.direction === "down" ? i : 0);
        const c = sc + (clue.direction === "across" ? i : 0);
        if (gridArr[r * gridSize + c] !== clue.answer[i]) return false;
      }
      return true;
    });
  }

  function randomString(len: number): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    return Array(len)
      .fill(0)
      .map(() => chars[Math.floor(Math.random() * chars.length)])
      .join("");
  }

  if (!isLoaded) return <div>Loading...</div>;
  if (!isSignedIn) return <RedirectToSignIn redirectUrl="/game" />;

  return (
    <main style={{ padding: "1rem" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "1rem",
        }}
      >
        <div>
          <h1>Crossword Battle Arena</h1>
          <p>
            Logged in as: {user.firstName} {user.lastName}
          </p>
        </div>
        <UserButton afterSignOutUrl="/" />
      </header>

      {/* Welcome Back UI */}
      <WelcomeMessage gameId={gameId} />

      {/* Scoreboard */}
      <div style={{ marginBottom: "1rem" }}>
        Scores — You: {scores.player} | AI: {scores.ai}
      </div>

      {/* Main Game Board */}
      <GameBoard
        gameId={gameId}
        userId={user.id}
        gridSize={gridSize}
        clues={clues}
      />

      {/* Chat */}
      <ChatBox gameId={gameId} userName={user.fullName || "Player"} />

      <div style={{ marginTop: "1rem" }}>
        <Link href="/">
          <button>Back to Home</button>
        </Link>
      </div>
    </main>
  );
}
