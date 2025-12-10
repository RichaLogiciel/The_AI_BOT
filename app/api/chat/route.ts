// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { documents } from "@/app/data/documents";

// Simple keyword RAG helper
function findRelevantDoc(prompt: string) {
  let bestDoc = null;
  let bestScore = -1;
  const words = prompt.toLowerCase().split(/\W+/).filter(Boolean);

  for (const doc of documents) {
    const score = words.filter((word) =>
      doc.text.toLowerCase().includes(word)
    ).length;

    if (score > bestScore) {
      bestScore = score;
      bestDoc = doc;
    }
  }
  return bestDoc;
}

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();
    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { answer: "Please provide a valid question." },
        { status: 400 }
      );
    }

    const doc = findRelevantDoc(question);
    const context = doc?.text ?? "No matching context found.";

    // If no API key, fall back to a simple context-based reply
    if (!process.env.OPENAI_API_KEY) {
      const fallback =
        doc?.text ??
        "Sorry, I do not have enough information to answer that right now.";
      return NextResponse.json({ answer: fallback });
    }

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: `You are a concise assistant. Answer using ONLY this context. If the context is not relevant, say you do not have that information.\n\nContext:\n${context}\n\nQuestion: ${question}\nAnswer:`,
    });

    return NextResponse.json({ answer: text ?? "No answer available." });
  } catch (err) {
    console.error("API RAG Error:", err);
    return NextResponse.json(
      { answer: "Sorry, I couldn't fetch an answer." },
      { status: 500 }
    );
  }
}
