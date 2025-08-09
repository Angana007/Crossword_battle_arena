// app/components/ChatBox.tsx
"use client";
import { useEffect, useState } from "react";
import { ref, push, onValue } from "firebase/database";
import { rtdb } from "@/lib/FirebaseClient";

export default function ChatBox({ gameId, userName }: { gameId: string; userName: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    const chatRef = ref(rtdb, `chat_messages/${gameId}`);
    onValue(chatRef, (snap) => {
      const msgs = snap.val() ? Object.values(snap.val()) : [];
      setMessages(msgs);
    });
  }, [gameId]);

  const sendMessage = () => {
    if (!input.trim()) return;
    push(ref(rtdb, `chat_messages/${gameId}`), {
      sender: "player",
      message: input,
      timestamp: Date.now(),
    });
    setInput("");
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: 10, marginTop: 10 }}>
      <div style={{ height: 200, overflowY: "auto", marginBottom: 8 }}>
        {messages.map((m, i) => (
          <div key={i}>
            <strong>{m.sender === "player" ? userName : "AI"}:</strong> {m.message}
          </div>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type message..."
        style={{ width: "80%", marginRight: 5 }}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
