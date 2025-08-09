import React, { useState } from "react";
import { puzzle1 } from "../puzzles/puzzle1";

function CrosswordGrid() {
  // Use local state for testing
  const [grid, setGrid] = useState(Array(5).fill().map(() => Array(5).fill("")));
  const [selected, setSelected] = useState({ row: null, col: null });

  // Select cell to type in
  const selectCell = (row, col) => setSelected({ row, col });

  // Simple letter entry
  const handleInput = (e) => {
    const val = e.target.value.toUpperCase().slice(-1);
    if (selected.row !== null && selected.col !== null && /^[A-Z]$/.test(val)) {
      const newGrid = grid.map(arr => [...arr]);
      newGrid[selected.row][selected.col] = val;
      setGrid(newGrid);
    }
  };

  return (
    <div>
      <h2>Crossword Battle Arena</h2>
      <table>
        <tbody>
          {grid.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td
                  key={c}
                  style={{
                    border: "1px solid #333", width: "32px", height: "32px",
                    background: selected.row===r&&selected.col===c ? "#eef" : "#fff"
                  }}
                  onClick={() => selectCell(r, c)}
                >
                  {grid[r][c]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <input
        maxLength={1}
        value={
          selected.row !== null && selected.col !== null
            ? grid[selected.row][selected.col]
            : ""
        }
        onChange={handleInput}
        disabled={selected.row === null}
      />
      <CluesList clues={puzzle1.clues} />
    </div>
  );
}

export default CrosswordGrid;
