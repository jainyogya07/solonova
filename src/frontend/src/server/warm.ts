// warm.ts — keeps model endpoints warm for ultra-low latency
import { cerebrasFast } from "../../../api/cerebras";
import { geminiReason } from "../../../api/gemini";

async function warm() {
  try {
    await cerebrasFast("ping");
    await geminiReason("ping");
    console.log("[Solonova Warm Pool] engines warmed.");
  } catch (e) {
    console.log("[Warm Error]", e);
  }
}

// warm every 60 seconds
setInterval(warm, 60000);

// warm immediately on server start
warm();