export type Clue = {
  number: number;
  clue: string;
  answer: string;
  start: [number, number]; // [row, col], 0-indexed
  direction: "across" | "down";
};
export const gridSize = 10;
export const puzzle2Size = 10;

export const allClues: Clue[] = [
  // Across
  {
    number: 1,
    clue: "Star at the center of our solar system",
    answer: "SUN",
    start: [0, 0],
    direction: "across",
  },
  {
    number: 4,
    clue: "Nighttime flying insect",
    answer: "MOTH",
    start: [0, 4],
    direction: "across",
  },
  {
    number: 7,
    clue: "Ocean predator with sharp teeth",
    answer: "SHARK",
    start: [2, 0],
    direction: "across",
  },
  {
    number: 9,
    clue: "Large land mammal with a trunk",
    answer: "ELEPHANT",
    start: [4, 0],
    direction: "across",
  },
  {
    number: 11,
    clue: "Liquid precipitation",
    answer: "RAIN",
    start: [6, 3],
    direction: "across",
  },
  {
    number: 13,
    clue: "Fastest land animal",
    answer: "CHEETAH",
    start: [8, 0],
    direction: "across",
  },

  // Down
  {
    number: 1,
    clue: "Bovine animal",
    answer: "STEER",
    start: [0, 0],
    direction: "down",
  },
  {
    number: 2,
    clue: "Frozen water",
    answer: "ICE",
    start: [0, 2],
    direction: "down",
  },
  {
    number: 3,
    clue: "Not closed",
    answer: "OPEN",
    start: [0, 5],
    direction: "down",
  },
  {
    number: 5,
    clue: "Male child",
    answer: "BOY",
    start: [0, 8],
    direction: "down",
  },
  {
    number: 6,
    clue: "Cooking vessel",
    answer: "PAN",
    start: [3, 6],
    direction: "down",
  },
];
