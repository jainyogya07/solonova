import { perplexityFast, perplexityReason } from "../api/perplexity.ts";
import { cerebrasFast } from "../api/cerebras.ts";
import { vultrOptimize } from "../api/vultr.ts";
import * as memory from "../memory/store.ts";
import { log, debug } from "../utils/logger.ts";

export interface AgentRequest {
  type: "chat" | "idea" | "plan" | "code" | "optimize";
  prompt: string;
  userId?: string;
  latencyBudgetMs?: number;
  enableOptimize?: boolean;
  id?: string;
}

export interface AgentResponse {
  id: string;
  type: string;
  content: string | null;
  sources: { source: string; latencyMs?: number }[];
  merged: boolean;
  timestamp: string;
  metrics: {
    totalLatencyMs: number;
    cerebrasMs?: number;
  };
  memoryWritten: boolean;
  warn?: string | null;
}

const DEFAULT_LATENCY_BUDGET = 800;
const FAST_TIMEOUT = 8000; // ms
const DEEP_TIMEOUT = 2500; // optional background

export async function handleUserRequest(req: AgentRequest): Promise<AgentResponse> {
  const id = req.id ?? `sol - ${Math.random().toString(36).slice(2, 9)} `;
  const startTotal = performance.now();
  const latencyBudget = req.latencyBudgetMs ?? DEFAULT_LATENCY_BUDGET;

  // load user memory (non-blocking if it fails)
  let userContext = "";
  try {
    if (req.userId) {
      const snapshot = await memory.readSnapshot(req.userId).catch((e) => null);
      if (snapshot) userContext = `UserMemory: ${snapshot.summary ?? ""} \n\n`;
    }
  } catch (e) {
    debug("memory.read.failed", e);
  }

  const basePrompt = `${userContext}Request Type: ${req.type} \n\n${req.prompt} `;

  // 1) Fast path — try to get quick response (within FAST_TIMEOUT)
  // 1) Fast path — Race Cerebras (Ultra-Fast) vs Perplexity (Fast)
  // We want the winner. But if Cerebras fails (missing key), we want Perplexity.
  // Promise.any would wait for first success.
  let fastRes = { content: null as string | null, latency: null as number | null, error: null as string | null };

  try {
    const t0 = performance.now();

    // We wrap each in a promise that rejects if content is null/error so Promise.any skips them
    const pCerebras = cerebrasFast(basePrompt).then(res => {
      if (!res.content) throw new Error(res.error || "cerebras.empty");
      return { source: "cerebras", ...res };
    });
    const pPerplexity = perplexityFast(basePrompt).then(res => {
      if (!res.content) throw new Error(res.error || "perplexity.empty");
      return { source: "perplexity", ...res };
    });

    // Race with timeout
    const winner: any = await Promise.race([
      Promise.any([pCerebras, pPerplexity]),
      new Promise((_, rej) => setTimeout(() => rej(new Error("fast.timeout")), FAST_TIMEOUT))
    ]);

    fastRes = { content: winner.content, latency: winner.latency, error: null };
  } catch (err: any) {
    debug("fast.path.failed", err);
    // If all failed, we might want to check individual errors? 
    // For now, fastRes stays null
    if (err instanceof AggregateError) {
      fastRes.error = "All providers failed: " + err.errors.map(e => e.message).join(", ");
    } else {
      fastRes.error = err.message;
    }
  }

  // 2) Return early with fastRes if available. Meanwhile spawn background deep reasoning if preferDepth requested.
  // Kick off deep reasoning in background (do not await)
  if (req.latencyBudgetMs && req.latencyBudgetMs > 1200) {
    // only spawn background deep reasoning when client asked for higher budget
    (async () => {
      try {
        const deep = (await Promise.race([
          perplexityReason(basePrompt),
          new Promise((_, rej) => setTimeout(() => rej(new Error("deep.timeout")), DEEP_TIMEOUT)),
        ])) as any;
        // write deeper summary to memory asynchronously (non-blocking)
        if (req.userId && deep?.content) {
          memory.appendEntry(req.userId, {
            requestId: id,
            prompt: req.prompt,
            responseSummary: deep.content.slice(0, 900),
            timestamp: new Date().toISOString(),
          }).catch((e) => debug("memory.append.failed", e));
        }
      } catch (e) {
        debug("deep.reasoning.background.failed", e);
      }
    })();
  }

  // 3) If optimization requested, run it but do not block the fast reply if it will be long.
  let vultrRes: any = null;
  if (req.enableOptimize || req.type === "optimize") {
    // run optimizer but cap time; we will await it only if budget allows, else run in background
    const allowWait = (latencyBudget >= 4000);
    if (allowWait) {
      try {
        vultrRes = await vultrOptimize(req.prompt);
      } catch (e) {
        debug("vultr.failed", e);
      }
    } else {
      // background
      vultrOptimize(req.prompt).then((r) => {
        debug("vultr.background.done", r);
      }).catch((e) => debug("vultr.background.failed", e));
    }
  }

  // 4) Build final content using fastRes primarily; if none, return fallback
  let content = fastRes.content ?? null;
  if (!content) {
    const errorDetails = (fastRes as any).error ? `Error: ${(fastRes as any).error} ` : "fast: no";
    content = `Sorry — Solonova couldn't generate an answer. Debug info:\n- ${errorDetails}\n`;
  }

  const totalLatency = Math.round(performance.now() - startTotal);
  const resp: AgentResponse = {
    id,
    type: req.type,
    content,
    sources: [
      { source: "perplexity-fast", latencyMs: fastRes.latency ?? undefined },
      ...(vultrRes ? [{ source: "vultr", latencyMs: vultrRes?.latency ?? undefined }] : []),
    ],
    merged: false,
    timestamp: new Date().toISOString(),
    metrics: {
      totalLatencyMs: totalLatency,
      cerebrasMs: fastRes.latency ?? 0,
    },
    memoryWritten: false,
    warn: null,
  };

  // Best-effort memory write (async)
  if (req.userId && content && content.length > 30) {
    memory.appendEntry(req.userId, {
      requestId: id,
      prompt: req.prompt,
      responseSummary: content.slice(0, 900),
      timestamp: new Date().toISOString(),
    }).catch((e) => debug("memory.append.failed", e));
    resp.memoryWritten = true;
  }

  log("Agent.request.done", { id, metrics: resp.metrics });

  return resp;
}