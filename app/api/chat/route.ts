// app/api/chat/route.tsimport { NextRequest } from "next/server";
import { mistral } from "@ai-sdk/mistral";
import { streamText } from "ai";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();

    if (!question || typeof question !== "string") {
      return new Response("Invalid question", { status: 400 });
    }

    // Ensure API key is present
    if (!process.env.MISTRAL_API_KEY) {
      return new Response("Mistral API key missing in environment.", {
        status: 500,
      });
    }

    // STREAM the AI response
    const result = await streamText({
      model: mistral("mistral-large-latest"),
      prompt: question,
    });

    // RETURN STREAMING RESPONSE
    return result.toTextStreamResponse();

  } catch (err) {
    console.error("Mistral Error:", err);
    return new Response("Server Error", { status: 500 });
  }
}
