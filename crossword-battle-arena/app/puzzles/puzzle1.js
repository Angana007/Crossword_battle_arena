// app/puzzles/puzzle1.js
export const puzzle1 = {
  grid: [
    ["C", "A", "T", "", ""],
    ["", "", "A", "", ""],
    ["D", "O", "G", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
  ],
  clues: {
    across: [
      { number: 1, clue: "A furry pet (Row 1)", answer: "CAT", row: 0, col: 0 },
      { number: 2, clue: "Barks (Row 3)", answer: "DOG", row: 2, col: 0 },
    ],
    down: [
      { number: 1, clue: "Meows (Col 1)", answer: "CAT", row: 0, col: 0 },
      { number: 2, clue: "Best friend (Col 3)", answer: "DOG", row: 0, col: 2 },
    ]
  }
};
