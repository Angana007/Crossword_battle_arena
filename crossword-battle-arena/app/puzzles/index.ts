import * as puzzle1 from "./puzzle1";
import * as puzzle2 from "./puzzle2";

// ✅ Registry object — keys must match puzzle_id values in Firebase
export const puzzles = {
  puzzle1,
  puzzle2,
};

// ✅ Type for valid puzzle IDs
export type PuzzleId = keyof typeof puzzles; // "puzzle1" | "puzzle2"

// ✅ Re-export the shared Clue type
export type { Clue } from "./puzzle1";

// ✅ A helper to safely get puzzle data by ID (with fallback)
export function getPuzzleData(id: string) {
  return Object.prototype.hasOwnProperty.call(puzzles, id)
    ? puzzles[id as PuzzleId]
    : puzzles["puzzle1"];
}
