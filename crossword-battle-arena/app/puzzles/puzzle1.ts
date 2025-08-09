// app/puzzles/puzzle1.ts
export type Clue = {
  number: number;
  clue: string;
  answer: string;
  start: [number, number]; // [row, col]
  direction: "across" | "down";
};

export const puzzle1Size = 10;

export const acrossClues: Clue[] = [
  { number: 1, clue: "Opposite of cold", answer: "HOT", start: [0, 0], direction: "across" },
  { number: 2, clue: "Not short", answer: "LONG", start: [2, 2], direction: "across" }
];

export const downClues: Clue[] = [
  { number: 3, clue: "Common pet", answer: "CAT", start: [0, 2], direction: "down" },
  { number: 4, clue: "To exist", answer: "BE", start: [0, 5], direction: "down" }
];

export const allClues: Clue[] = [...acrossClues, ...downClues];
