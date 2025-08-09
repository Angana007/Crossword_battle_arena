"use client";

import { useState, useEffect } from "react";
import { ref, onValue, set, update } from "firebase/database";
import { rtdb } from "@/lib/FirebaseClient";
import { puzzle1Size, allClues, Clue } from "@/app/puzzles/puzzle1";
import { updateUserStats } from "@/lib/updateUserStats";

export default function GameBoard({ gameId, userId }: { gameId: string; userId: string }) {
  const [grid, setGrid] = useState<string[]>(Array(puzzle1Size * puzzle1Size).fill(""));
  const [solvedBy, setSolvedBy] = useState<{ [index: number]: string }>({});
  const [activeClue, setActiveClue] = useState<Clue | null>(null);

  // 🔄 Listen for RTDB updates: grid + solved words
  useEffect(() => {
    const gridRef = ref(rtdb, `games/${gameId}/grid`);
    const solvedRef = ref(rtdb, `games/${gameId}/solved_words`);

    const unsub1 = onValue(gridRef, (snap) => {
      if (snap.exists()) setGrid(snap.val());
    });
    const unsub2 = onValue(solvedRef, (snap) => {
      if (snap.exists()) setSolvedBy(snap.val());
    });

    // Clean up listeners on unmount
    return () => {
      unsub1();
      unsub2();
    };
  }, [gameId]);

  // 📌 When clicking a cell, find its clue
  const handleCellClick = (index: number) => {
    const r = Math.floor(index / puzzle1Size);
    const c = index % puzzle1Size;

    const found = allClues.find(clue => {
      const [sr, sc] = clue.start;
      if (clue.direction === "across") {
        return r === sr && c >= sc && c < sc + clue.answer.length;
      }
      if (clue.direction === "down") {
        return c === sc && r >= sr && r < sr + clue.answer.length;
      }
      return false;
    });

    setActiveClue(found || null);
  };

  // ✏ Handle word submission & validation
  const handleSubmitWord = () => {
    if (!activeClue) return;

    const guess = prompt(`Enter answer for: ${activeClue.clue}`)?.toUpperCase() || "";
    if (guess === activeClue.answer.toUpperCase()) {
      const updated = [...grid];
      const [sr, sc] = activeClue.start;

      // Fill in the correct word
      for (let i = 0; i < activeClue.answer.length; i++) {
        const r = sr + (activeClue.direction === "down" ? i : 0);
        const c = sc + (activeClue.direction === "across" ? i : 0);
        updated[r * puzzle1Size + c] = activeClue.answer[i];
      }
      set(ref(rtdb, `games/${gameId}/grid`), updated);

      // Mark who solved each letter
      const newSolved: { [cell: number]: string } = {};
      for (let i = 0; i < activeClue.answer.length; i++) {
        const r = sr + (activeClue.direction === "down" ? i : 0);
        const c = sc + (activeClue.direction === "across" ? i : 0);
        newSolved[r * puzzle1Size + c] = userId;
      }
      update(ref(rtdb, `games/${gameId}/solved_words`), newSolved);

      // 🏆 Check for game over
      if (checkGameOver(updated, allClues)) {
        set(ref(rtdb, `games/${gameId}/game_status`), "completed");
        set(ref(rtdb, `games/${gameId}/winner`), userId);

        // Async stats update
        (async () => {
          try {
            await updateUserStats(userId, true); // Player win
            await updateUserStats("ai", false); // AI loss
          } catch (err) {
            console.error("Failed to update stats:", err);
          }
        })();
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

      {/* Crossword grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${puzzle1Size}, 40px)`,
          gap: 1,
          backgroundColor: "#000",
        }}
      >
        {grid.map((letter, i) => {
          const isActive = activeClue && isCellInClue(i, activeClue);
          return (
            <div
              key={i}
              onClick={() => handleCellClick(i)}
              style={{
                width: 40,
                height: 40,
                backgroundColor: solvedBy[i]
                  ? solvedBy[i] === userId
                    ? "lightgreen"
                    : "lightcoral"
                  : isActive
                  ? "lightblue"
                  : "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                cursor: "pointer",
                position: "relative",
              }}
            >
              {/* Clue number in cell */}
              {getClueNumberAtCell(i) && (
                <span
                  style={{
                    position: "absolute",
                    top: 2,
                    left: 2,
                    fontSize: 10,
                    color: "#555",
                  }}
                >
                  {getClueNumberAtCell(i)}
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

function isCellInClue(index: number, clue: Clue) {
  const r = Math.floor(index / puzzle1Size);
  const c = index % puzzle1Size;
  const [sr, sc] = clue.start;

  if (clue.direction === "across") {
    return r === sr && c >= sc && c < sc + clue.answer.length;
  }
  if (clue.direction === "down") {
    return c === sc && r >= sr && r < sr + clue.answer.length;
  }
  return false;
}

function getClueNumberAtCell(index: number): number | null {
  const r = Math.floor(index / puzzle1Size);
  const c = index % puzzle1Size;
  const clue = allClues.find(cu => cu.start[0] === r && cu.start[1] === c);
  return clue ? clue.number : null;
}

function checkGameOver(grid: string[], clues: Clue[]): boolean {
  return clues.every(clue => {
    const [sr, sc] = clue.start;
    for (let i = 0; i < clue.answer.length; i++) {
      const r = sr + (clue.direction === "down" ? i : 0);
      const c = sc + (clue.direction === "across" ? i : 0);
      if (grid[r * puzzle1Size + c] !== clue.answer[i]) return false;
    }
    return true;
  });
}
