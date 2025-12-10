import { embed } from "ai";

export async function createEmbedding(text: string) {
  const result = await embed({
    model: "text-embedding-3-small",
    value: text
  });

  return result.embedding;
}
