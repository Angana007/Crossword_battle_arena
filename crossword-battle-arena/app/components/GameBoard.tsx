// app/components/GameBoard.tsx
"use client";
import { useState, useEffect } from "react";
import { ref, onValue, set, update } from "firebase/database";
import { rtdb } from "@/lib/FirebaseClient";

export default function GameBoard({ gameId, userId }: { gameId: string; userId: string }) {
  const [grid, setGrid] = useState<string[]>(Array(100).fill(""));
  const [solvedBy, setSolvedBy] = useState<{ [index: number]: string }>({});

  useEffect(() => {
    const gridRef = ref(rtdb, `games/${gameId}/grid`);
    const solvedRef = ref(rtdb, `games/${gameId}/solved_words`);

    onValue(gridRef, (snap) => {
      if (snap.exists()) setGrid(snap.val());
    });

    onValue(solvedRef, (snap) => {
      if (snap.exists()) setSolvedBy(snap.val());
    });
  }, [gameId]);

  const handleCellClick = (index: number) => {
    const letter = prompt("Enter letter:")?.trim().toUpperCase() || "";
    if (letter.length === 1) {
      const updated = [...grid];
      updated[index] = letter;
      set(ref(rtdb, `games/${gameId}/grid`), updated);
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(10, 40px)",
        gap: 1,
        backgroundColor: "#000",
      }}
    >
      {grid.map((letter, i) => (
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
              : "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          {letter}
        </div>
      ))}
    </div>
  );
}
