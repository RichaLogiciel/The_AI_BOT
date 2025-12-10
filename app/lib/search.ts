import { createEmbedding } from "./embed";
import { documents } from "../data/documents";

function cosine(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export async function findRelevantDoc(query: string) {
  const queryEmb = await createEmbedding(query);

  let best = null;
  let bestScore = -1;

  for (const doc of documents) {
    const docEmb = await createEmbedding(doc.text); // compute on the fly
    const score = cosine(queryEmb, docEmb);
    if (score > bestScore) {
      bestScore = score;
      best = doc;
    }
  }

  return best;
}
