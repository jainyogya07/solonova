// src/tools/codeFix.ts
import { perplexityFast } from "../api/perplexity.js";

export async function codeFixTool(args: { code: string; lang?: string; explain?: boolean }) {
    const prompt = `
You are an expert dev. Fix the following ${args.lang ?? "code"} so it runs and explain changes briefly.
Return JSON with keys: { fixedCode: "...", explanation: "..." }.
Code:
\`\`\`
${args.code}
\`\`\`
`;
    const res = await perplexityFast(prompt);
    // try parse JSON from response
    const txt = res.content ?? "";
    try {
        const jsonStart = txt.indexOf("{");
        if (jsonStart >= 0) {
            const maybe = txt.slice(jsonStart);
            const parsed = JSON.parse(maybe);
            return parsed;
        }
    } catch (err) {
        // fallback: return raw
    }
    return { fixedCode: txt, explanation: "Auto-fix output (raw)" };
}
