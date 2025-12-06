
import { handleUserRequest } from "../../agents/solonovaAgent";

export async function agentStreamHandler(body: any, sendChunk: (data: string) => void) {
  if (!body || !body.prompt) {
    sendChunk("ERROR: Missing prompt\n");
    sendChunk("[[END_STREAM]]");
    return;
  }

  // Call the main handler but prefer getting fast content first
  const res = await handleUserRequest({
    type: body.type ?? "chat",
    prompt: body.prompt,
    userId: body.userId ?? "demo-user",
    latencyBudgetMs: body.latencyBudgetMs ?? 1200,
    enableOptimize: body.enableOptimize ?? false,
  });

  const text = res.content ?? "";
  // Stream small chunks to the client (simple chunked streaming)
  const chunkSize = 40; // chars per chunk
  for (let i = 0; i < text.length; i += chunkSize) {
    const piece = text.slice(i, i + chunkSize);
    // send raw chunk (client expects plain text chunks)
    sendChunk(piece);
    // tiny pause to allow UI to animate (adjust to taste)
    await new Promise((r) => setTimeout(r, 6));
  }

  // signal done (some clients look for sentinel)
  sendChunk("[[END_STREAM]]");
}