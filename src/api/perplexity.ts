// src/api/perplexity.ts
// Defensive Perplexity API with proper error handling

const PPLX_KEY = process.env.PPLX_KEY;
const PPLX_URL = process.env.PPLX_URL ?? "https://api.perplexity.ai/chat/completions";

const SYSTEM_PROMPT = "You are Solonova, a friendly AI assistant for solopreneurs. Be conversational and natural. When someone greets you (hi, hello, hey, etc.), just greet them back warmly in 1-2 sentences. NEVER give dictionary definitions or explanations of what greetings mean. Only provide detailed information when explicitly asked.";

export async function perplexityFast(prompt: string) {
    if (!PPLX_KEY) {
        console.error("perplexityFast: missing PPLX_KEY");
        return { content: null, latency: null, error: "Missing PPLX_KEY env var" };
    }

    const start = Date.now();

    try {
        const res = await fetch(PPLX_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${PPLX_KEY}`,
                Accept: "application/json",
            },
            body: JSON.stringify({
                model: "sonar",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: prompt }
                ],
                max_tokens: 2000,
                temperature: 0.35,
            }),
        });

        if (!res.ok) {
            const text = await res.text().catch(() => "");
            return { content: null, latency: Date.now() - start, error: `HTTP ${res.status} ${res.statusText}: ${text.slice(0, 100)}` };
        }

        const text = await res.text();
        let data: any = {};

        try {
            data = JSON.parse(text);
        } catch (e) {
            console.warn("perplexityFast: non-json response", text.slice(0, 500));
            return { content: null, latency: Date.now() - start, error: "Invalid JSON response" };
        }

        const latency = Date.now() - start;

        return {
            content: data?.choices?.[0]?.message?.content ?? data?.output ?? null,
            latency,
        };
    } catch (err: any) {
        console.error("perplexityFast error:", err);
        return { content: null, latency: null, error: `Fetch Error: ${err.message}` };
    }
}

export async function perplexityReason(prompt: string) {
    if (!PPLX_KEY) {
        return { content: null, latency: null, error: true };
    }

    const start = Date.now();

    try {
        const res = await fetch(PPLX_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${PPLX_KEY}`,
                Accept: "application/json",
            },
            body: JSON.stringify({
                model: "sonar-reasoning",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: prompt }
                ],
                max_tokens: 4000,
                temperature: 0.35,
            }),
        });

        const text = await res.text();
        let data: any = {};

        try {
            data = JSON.parse(text);
        } catch (e) {
            console.warn("perplexityReason: non-json response", text.slice(0, 500));
        }

        const latency = Date.now() - start;
        let content = data?.choices?.[0]?.message?.content ?? data?.output ?? null;

        // Strip <think> blocks from reasoning model
        if (content) {
            content = content.replace(/<think>[\s\S]*?<\/think>\s*/g, "").trim();
        }

        return { content, latency };
    } catch (err) {
        console.error("perplexityReason error:", err);
        return { content: null, latency: null, error: true };
    }
}