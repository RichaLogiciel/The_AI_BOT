// lib/rag.ts
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { documents } from "../data/documents";

// Simple keyword-based document retrieval
function findRelevantDoc(prompt: string) {
  let bestDoc = null;
  let bestScore = -1;

  for (const doc of documents) {
    const score = prompt
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => doc.text.toLowerCase().includes(word)).length;

    if (score > bestScore) {
      bestScore = score;
      bestDoc = doc;
    }
  }

  return bestDoc;
}

export async function ragAnswer(prompt: string) {
  try {
    const doc = findRelevantDoc(prompt);
    const context = doc?.text ?? "Sorry, I have no information on this.";

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: `You are an assistant. Answer the question using ONLY the following context.\n\nContext:\n${context}\n\nQuestion: ${prompt}\nAnswer:`,
    });

    return text;
  } catch (err) {
    console.error("RAG Error:", err);
    return "Sorry, I couldn't fetch an answer.";
  }
}
