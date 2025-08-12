import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { eventType, clue, playerName, gameState, stats } = await req.json();

    // Player name fallback
    const safePlayerName = playerName || "Player";

    // Build dynamic prompt based on event
    let prompt = "";

    switch (eventType) {
      case "player_solved":
        if (clue) {
          prompt = `You are a witty, competitive crossword AI opponent. The human player ${safePlayerName} just solved "${clue.answer}" (${clue.clue}). 
          Current score is Player: ${gameState.player_score}, AI: ${gameState.ai_score}.
          Respond with playful banter in 1-2 sentences, showing mild frustration but determination.`;
        } else {
          prompt = `You are a witty crossword AI. ${safePlayerName} just solved a word. 
          Scores: Player ${gameState.player_score}, AI ${gameState.ai_score}.
          Respond with short competitive banter.`;
        }
        break;

      case "player_win":
        prompt = `You are a competitive crossword AI who just lost to ${safePlayerName}.
        Final score: Player ${gameState.player_score}, AI ${gameState.ai_score}.
        Write a short, slightly bitter but sportsmanlike 1-2 sentence message acknowledging the loss and vowing revenge.`;
        break;

      case "ai_solved":
        if (clue) {
          prompt = `You are a witty crossword AI celebrating your own victory on a clue.
          You just solved "${clue.answer}" (${clue.clue}).
          Scores now: Player ${gameState.player_score}, AI ${gameState.ai_score}.
          Respond in a gloating, confident, and slightly smug tone (1-2 sentences).`;
        } else {
          prompt = `You are a crossword AI who just solved a word.
          Current score: Player ${gameState.player_score}, AI ${gameState.ai_score}.
          Respond in a gloating tone.`;
        }
        break;

      case "ai_win":
        prompt = `You are a snarky, triumphant crossword AI who has just won a match against ${safePlayerName}.
        Final score: Player ${gameState.player_score}, AI ${gameState.ai_score}.
        Send a short victory message, showing swagger and perhaps mocking the opponent.`;
        break;

      case "welcome_back":
        prompt = `You are a witty crossword AI welcoming ${safePlayerName} back to the game.
        Their stats: ${stats?.games_won || 0} wins, ${stats?.games_lost || 0} losses.
        Greet them warmly but competitively, reminding them of your rivalry. Keep it under 2 sentences.`;
        break;

      default:
        prompt = `You are a witty crossword AI. Respond competitively to the human player ${safePlayerName}.`;
        break;
    }

    // Call OpenAI API
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are an AI crossword competitor with a playful, competitive, slightly sarcastic personality. Keep messages short (1-2 sentences) and in-character." },
          { role: "user", content: prompt }
        ],
        max_tokens: 80,
        temperature: 0.9,
      }),
    });

    if (!openaiRes.ok) {
      throw new Error(`OpenAI API error: ${openaiRes.status}`);
    }

    const aiJson = await openaiRes.json();
    const aiMessage = aiJson.choices?.[0]?.message?.content?.trim() || getFallbackMessage(eventType, safePlayerName);

    return NextResponse.json({ message: aiMessage });

  } catch (error) {
    console.error("AI Chat API error:", error);
    return NextResponse.json({ message: "I'll get you next time..." }, { status: 200 });
  }
}

/** Fallback responses if LLM is unavailable */
function getFallbackMessage(eventType: string, playerName: string) {
  switch (eventType) {
    case "player_solved":
      return `Hmph, nice one ${playerName} — but I’m not done yet!`;
    case "player_win":
      return `You got me this time, ${playerName}. Don’t get used to it.`;
    case "ai_solved":
      return `Boom! Another one for me!`;
    case "ai_win":
      return `Victory is sweet! Better luck next time, ${playerName}.`;
    case "welcome_back":
      return `Welcome back, ${playerName}! Ready to lose again?`;
    default:
      return `Let’s see what you've got, ${playerName}.`;
  }
}
