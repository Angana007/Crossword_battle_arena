import { NextResponse } from "next/server";
import { firestore } from "@/lib/FirebaseClient";
import { collection, getDocs, orderBy, limit, query } from "firebase/firestore";
import { clerkClient } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const q = query(
      collection(firestore, "user_stats"),
      orderBy("games_won", "desc"),
      limit(10)
    );
    const snap = await getDocs(q);

    const client = await clerkClient();

    const players = await Promise.all(
      snap.docs.map(async (doc) => {
        const data = doc.data();
        let name = data?.name || "";
        let imageUrl = "";

        try {
          const user = await client.users.getUser(doc.id);
          if (user) {
            name = user.fullName || name || doc.id;
            imageUrl = user.imageUrl || "";
          }
        } catch {}
        return {
          id: doc.id,
          name,
          imageUrl,
          games_played: data.games_played || 0,
          games_won: data.games_won || 0,
          games_lost: data.games_lost || 0,
        };
      })
    );

    return NextResponse.json(players);
  } catch (err) {
    console.error("Leaderboard API error:", err);
    return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 });
  }
}
