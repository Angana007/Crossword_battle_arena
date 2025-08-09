import { getFirestore, doc, updateDoc, increment } from "firebase/firestore";

const firestore = getFirestore();

export async function updateUserStats(userId: string, didWin: boolean) {
  const userRef = doc(firestore, "user_stats", userId);
  await updateDoc(userRef, {
    games_played: increment(1),
    games_won: increment(didWin ? 1 : 0),
    games_lost: increment(didWin ? 0 : 1),
  });
}
