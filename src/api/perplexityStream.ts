// src/api/perplexityStream.ts
import { createParser } from "eventsource-parser";

export async function perplexityStream(prompt: string, opts: any = {}) {
    const PPLX_URL = process.env.PPLX_URL ?? "https://api.perplexity.ai/chat/completions";
    const PPLX_KEY = process.env.PPLX_KEY;

    const res = await fetch(PPLX_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${PPLX_KEY}`,
        },
        body: JSON.stringify({
            model: opts.model ?? "sonar-pro",
            messages: [{ role: "user", content: prompt }],
            stream: true,
        }),
    });

    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Perplexity stream failed: ${res.status} ${txt}`);
    }

    // Return the body stream itself to be parsed by caller
    return res.body;
}
