import { rtdb } from "@/lib/FirebaseClient";
import { ref, set } from "firebase/database";

export type AiEventType =
  | "player_solved"
  | "player_win"
  | "ai_solved"
  | "ai_win"
  | "welcome_back";

interface SendAiChatMessageProps {
  gameId: string;
  eventType: AiEventType;
  clue?: any; // Prefer a typed Clue if imported
  playerName: string;
  gameState?: Record<string, any>;
  stats?: Record<string, any>;
}

/**
 * Sends an event to the AI chat API route and writes the AI's reply
 * into Firebase chat_messages for real-time display.
 */
export async function sendAiChatMessage({
  gameId,
  eventType,
  clue,
  playerName,
  gameState = {},
  stats = {},
}: SendAiChatMessageProps) {
  try {
    // Call our API route to get an AI-generated message
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

    if (!res.ok) {
      console.error(`AI chat API error: ${res.status}`);
      return;
    }

    const data = await res.json();
    const message =
      typeof data?.message === "string" && data.message.trim().length > 0
        ? data.message.trim()
        : getFallbackMessage(eventType, playerName);

    // Push the AI's message to the game chat in RTDB
    const chatRef = ref(
      rtdb,
      `chat_messages/${gameId}/${Date.now()}_${Math.floor(Math.random() * 10000)}`
    );
    await set(chatRef, {
      sender: "ai",
      message,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error("Error sending AI chat message:", err);
    // Optional: push a fallback message even if the API call failed
    const fallbackRef = ref(
      rtdb,
      `chat_messages/${gameId}/${Date.now()}_${Math.floor(Math.random() * 10000)}`
    );
    await set(fallbackRef, {
      sender: "ai",
      message: getFallbackMessage(eventType, playerName),
      timestamp: Date.now(),
    });
  }
}

/**
 * Local fallback messages if the AI API fails.
 */
function getFallbackMessage(eventType: AiEventType, playerName: string): string {
  switch (eventType) {
    case "player_solved":
      return `Nice one, ${playerName} — but I’m not done yet!`;
    case "player_win":
      return `You win this round, ${playerName}. I’ll be back for revenge.`;
    case "ai_solved":
      return `Boom! Another one for me.`;
    case "ai_win":
      return `Victory is mine! Better luck next time, ${playerName}.`;
    case "welcome_back":
      return `Welcome back, ${playerName}! Ready for another match?`;
    default:
      return `Let’s see what you’ve got, ${playerName}.`;
  }
}
