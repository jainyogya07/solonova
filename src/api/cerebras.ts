
const CEREBRAS_KEY = process.env.CEREBRAS_API_KEY;
declare var process: any;
const CEREBRAS_URL = "https://api.cerebras.ai/v1/chat/completions";

export async function cerebrasFast(prompt: string) {
  if (!CEREBRAS_KEY) {
    // Return explicit error so Promise.any can ignore if failed, but logic in agent handles priority
    return { content: null, latency: null, error: "Missing CEREBRAS_API_KEY" };
  }

  const start = Date.now();
  try {
    const res = await fetch(CEREBRAS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CEREBRAS_KEY}`,
      },
      body: JSON.stringify({
        model: "llama3.1-8b",
        messages: [{ role: "user", content: prompt }],
        max_completion_tokens: 1500,
        temperature: 0.5,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { content: null, latency: Date.now() - start, error: `HTTP ${res.status}: ${text.slice(0, 100)}` };
    }

    const data: any = await res.json();
    const content = data?.choices?.[0]?.message?.content ?? null;
    return {
      content,
      latency: Date.now() - start,
    };
  } catch (err: any) {
    return { content: null, latency: Date.now() - start, error: String(err.message ?? err) };
  }
}
