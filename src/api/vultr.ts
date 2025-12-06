// src/api/vultr.ts
import { measureLatency } from "../utils/latency.ts";
import { log } from "../utils/logger.ts";

const VULTR_URL = process.env.VULTR_URL || "https://api.vultr.com/v2/compute/run";
const VULTR_KEY = process.env.VULTR_KEY;

export async function vultrOptimize(code: string) {
  const start = Date.now();

  if (!VULTR_KEY) {
    console.error("Vultr API key missing (process.env.VULTR_KEY)");
    return { result: null, latency: null, error: true, source: "vultr" };
  }

  try {
    const payload = {
      machine: "a100",
      lang: "python",
      task: "optimize",
      code,
    };

    const res = await fetch(VULTR_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${VULTR_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const latency = measureLatency(start);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("Vultr non-OK response", res.status, text);
      return { result: null, latency, error: true, raw: text, source: "vultr" };
    }

    const data = await res.json().catch((e) => {
      console.error("Vultr JSON parse error", e);
      return null;
    });

    // defensive extraction — adapt if Vultr returns different shape
    const result = data?.result ?? data?.output ?? data?.data ?? null;
    const logs = data?.logs ?? null;

    log("Vultr Optimization", { latency, result });

    return { result, logs, latency, source: "vultr", raw: data ?? null };
  } catch (err) {
    const latency = measureLatency(start);
    console.error("Vultr error:", err);
    return { result: null, latency, error: true, source: "vultr" };
  }
}