"use client";

import { useState, useEffect } from "react";
import { ref, onValue, set, update } from "firebase/database";
import { rtdb } from "@/lib/FirebaseClient";
import { Clue } from "@/app/puzzles/puzzle1"; // shared clue type
import { updateUserStats } from "@/lib/updateUserStats";
import { sendAiChatMessage } from "@/lib/sendAiChatMessage";

export default function GameBoard({
  gameId,
  userId,
  gridSize,
  clues
}: {
  gameId: string;
  userId: string;
  gridSize: number;
  clues: Clue[];
}) {
  const [grid, setGrid] = useState<string[]>(Array(gridSize * gridSize).fill(""));
  const [solvedBy, setSolvedBy] = useState<{ [index: number]: string }>({});
  const [activeClue, setActiveClue] = useState<Clue | null>(null);
  const [scores, setScores] = useState<{ player: number; ai: number }>({ player: 0, ai: 0 });
  const [hoverClue, setHoverClue] = useState<Clue | null>(null);

  // Listen for grid, solved words, scores
  useEffect(() => {
    const gridRef = ref(rtdb, `games/${gameId}/grid`);
    const solvedRef = ref(rtdb, `games/${gameId}/solved_words`);
    const gameRef = ref(rtdb, `games/${gameId}`);

    const unsub1 = onValue(gridRef, (snap) => {
      if (snap.exists()) setGrid(snap.val());
    });
    const unsub2 = onValue(solvedRef, (snap) => {
      if (snap.exists()) setSolvedBy(snap.val());
    });
    const unsub3 = onValue(gameRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setScores({
          player: data.player_score || 0,
          ai: data.ai_score || 0,
        });
      }
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [gameId]);

  // Find clue for a cell (hover or click)
  const findClueAtCell = (index: number): Clue | null => {
    const r = Math.floor(index / gridSize);
    const c = index % gridSize;
    return clues.find(clue => {
      const [sr, sc] = clue.start;
      if (clue.direction === "across") {
        return r === sr && c >= sc && c < sc + clue.answer.length;
      }
      if (clue.direction === "down") {
        return c === sc && r >= sr && r < sr + clue.answer.length;
      }
      return false;
    }) || null;
  };

  // Click select clue
  const handleCellClick = (index: number) => {
    const clue = findClueAtCell(index);
    if (!clue) return;
    if (isClueSolved(clue)) return; // don't select solved
    setActiveClue(clue);
  };

  // Check if entire clue is solved
  const isClueSolved = (clue: Clue) => {
    const [sr, sc] = clue.start;
    for (let i = 0; i < clue.answer.length; i++) {
      const r = sr + (clue.direction === "down" ? i : 0);
      const c = sc + (clue.direction === "across" ? i : 0);
      const idx = r * gridSize + c;
      if (!solvedBy[idx]) return false;
    }
    return true;
  };

  // Submit word for active clue
  const handleSubmitWord = async () => {
    if (!activeClue) return;
    if (isClueSolved(activeClue)) {
      alert("This word has already been solved!");
      return;
    }

    const guess = prompt(`Enter answer for: ${activeClue.clue}`)?.toUpperCase() || "";
    if (guess.length !== activeClue.answer.length) {
      alert(`Your answer must be ${activeClue.answer.length} letters.`);
      return;
    }

    if (guess === activeClue.answer.toUpperCase()) {
      const updated = [...grid];
      const [sr, sc] = activeClue.start;

      for (let i = 0; i < activeClue.answer.length; i++) {
        const r = sr + (activeClue.direction === "down" ? i : 0);
        const c = sc + (activeClue.direction === "across" ? i : 0);
        updated[r * gridSize + c] = activeClue.answer[i];
      }
      await set(ref(rtdb, `games/${gameId}/grid`), updated);

      // Mark solver
      const newSolved: { [cell: number]: string } = {};
      for (let i = 0; i < activeClue.answer.length; i++) {
        const r = sr + (activeClue.direction === "down" ? i : 0);
        const c = sc + (activeClue.direction === "across" ? i : 0);
        newSolved[r * gridSize + c] = userId;
      }
      await update(ref(rtdb, `games/${gameId}/solved_words`), newSolved);

      // Update score
      await set(ref(rtdb, `games/${gameId}/player_score`), (scores.player || 0) + 1);

      // AI chat event: player solved
      await sendAiChatMessage({
        gameId,
        eventType: "player_solved",
        clue: activeClue,
        playerName: userId,
        gameState: { player_score: (scores.player || 0) + 1, ai_score: scores.ai }
      });

      // Check game over
      if (checkGameOver(updated, clues, gridSize)) {
        await set(ref(rtdb, `games/${gameId}/game_status`), "completed");
        await set(ref(rtdb, `games/${gameId}/winner`), userId);

        // Stats
        (async () => {
          try {
            await updateUserStats(userId, true);
            await updateUserStats("ai", false);
          } catch (err) {
            console.error("Stats update failed:", err);
          }
        })();

        // AI chat event: player win
        await sendAiChatMessage({
          gameId,
          eventType: "player_win",
          playerName: userId,
          gameState: { player_score: (scores.player || 0) + 1, ai_score: scores.ai }
        });
      }

    } else {
      alert("Incorrect!");
    }
  };

  return (
    <div>
      {activeClue && (
        <div style={{ marginBottom: 10 }}>
          <strong>{activeClue.number}</strong>: {activeClue.clue} ({activeClue.direction})
          <button onClick={handleSubmitWord} style={{ marginLeft: 10 }}>
            Submit Word
          </button>
        </div>
      )}

      {/* Responsive crossword grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gap: 1,
          backgroundColor: "#000",
          maxWidth: "95vw",
          aspectRatio: "1 / 1",
          margin: "0 auto",
        }}
      >
        {grid.map((letter, i) => {
          const isActive = activeClue && isCellInClue(i, activeClue, gridSize);
          const isHovered = hoverClue && isCellInClue(i, hoverClue, gridSize);
          const cellSolved = solvedBy[i];

          return (
            <div
              key={i}
              onClick={() => handleCellClick(i)}
              onMouseEnter={() => setHoverClue(findClueAtCell(i))}
              onMouseLeave={() => setHoverClue(null)}
              style={{
                width: "100%",
                aspectRatio: "1 / 1",
                backgroundColor: cellSolved
                  ? cellSolved === userId
                    ? "lightgreen"
                    : "lightcoral"
                  : isActive
                  ? "#add8e6"
                  : isHovered
                  ? "#d0e7ff"
                  : "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                cursor: cellSolved ? "not-allowed" : "pointer",
                position: "relative",
                transition: "background-color 0.2s ease, transform 0.15s ease",
              }}
            >
              {getClueNumberAtCell(i, clues, gridSize) && (
                <span
                  style={{
                    position: "absolute",
                    top: 2,
                    left: 2,
                    fontSize: "clamp(8px, 1.5vw, 10px)",
                    color: "#555",
                  }}
                >
                  {getClueNumberAtCell(i, clues, gridSize)}
                </span>
              )}
              {cellSolved && (
                <span
                  style={{
                    position: "absolute",
                    bottom: 2,
                    right: 2,
                    fontSize: "0.7em",
                  }}
                >
                  {cellSolved === userId ? "✓" : "🤖"}
                </span>
              )}
              {letter}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Helpers **/

function isCellInClue(index: number, clue: Clue, gridSize: number) {
  const r = Math.floor(index / gridSize);
  const c = index % gridSize;
  const [sr, sc] = clue.start;
  if (clue.direction === "across") {
    return r === sr && c >= sc && c < sc + clue.answer.length;
  }
  if (clue.direction === "down") {
    return c === sc && r >= sr && r < sr + clue.answer.length;
  }
  return false;
}

function getClueNumberAtCell(index: number, clues: Clue[], gridSize: number): number | null {
  const r = Math.floor(index / gridSize);
  const c = index % gridSize;
  const clue = clues.find(cu => cu.start[0] === r && cu.start[1] === c);
  return clue ? clue.number : null;
}

function checkGameOver(grid: string[], clues: Clue[], gridSize: number): boolean {
  return clues.every(clue => {
    const [sr, sc] = clue.start;
    for (let i = 0; i < clue.answer.length; i++) {
      const r = sr + (clue.direction === "down" ? i : 0);
      const c = sc + (clue.direction === "across" ? i : 0);
      if (grid[r * gridSize + c] !== clue.answer[i]) return false;
    }
    return true;
  });
}
