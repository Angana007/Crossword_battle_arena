import { rtdb } from "@/lib/FirebaseClient";
import { ref, set } from "firebase/database";

export async function sendAiChatMessage({
  gameId,
  eventType,
  clue,
  playerName,
  gameState,
  stats,
}: {
  gameId: string;
  eventType: "player_solved" | "player_win" | "ai_solved" | "ai_win" | "welcome_back";
  clue?: any;
  playerName: string;
  gameState: any;
  stats?: any;
}) {
  try {
    // Call API route for AI to generate message
    const res = await fetch("/api/ai-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType,
        clue,
        playerName,
        gameState,
        stats,
      }),
    });

    const { message } = await res.json();

    // Push the AI's message into Firebase chat_messages so ChatBox sees it in real-time
    await set(
      ref(
        rtdb,
        `chat_messages/${gameId}/${Date.now()}_${Math.floor(Math.random() * 10000)}`
      ),
      {
        sender: "ai",
        message,
        timestamp: Date.now(),
      }
    );
  } catch (err) {
    console.error("Error sending AI chat message:", err);
  }
}
