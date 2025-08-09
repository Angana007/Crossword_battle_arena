import { NextResponse } from "next/server";

// EXAMPLE WITH OPENAI
export async function POST(req: Request) {
  const { eventType, gameState, lastPlayerAction, playerName } = await req.json();

  // Craft your prompt dynamically (adjust for event, score, personality)
  let prompt = "";
  if (eventType === "player_solved") {
    prompt = `As a witty crossword AI, respond to ${playerName} solving a word (currently score: ${gameState.player_score} for player, ${gameState.ai_score} for AI). Make it competitive but playful.`;
  }
  if (eventType === "ai_win") {
    prompt = `You've just won the crossword match against ${playerName}. Send a victory message as a snarky, triumphant AI.`;
  }
  // etc...

  // Call OpenAI API (substitute with your actual secret key; never expose to client!)
  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo", // or your chosen model
      messages: [{ role: "system", content: "You are an AI crossword competitor with a snarky personality." }, { role: "user", content: prompt }]
    })
  });
  const aiJson = await openaiRes.json();
  const aiMessage = aiJson.choices?.[0]?.message?.content || "Well played!";

  return NextResponse.json({ message: aiMessage });
}
