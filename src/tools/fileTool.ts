// src/tools/fileTool.ts
import fs from "fs";
import path from "path";
import { perplexityFast } from "../api/perplexity";

export async function fileTool(args: { filePath: string }) {
    try {
        const abs = path.resolve(args.filePath);

        if (!fs.existsSync(abs)) {
            return { error: "File does not exist" };
        }

        const data = fs.readFileSync(abs, "utf8");

        const prompt = `Summarize this document in 5 bullets. If technical, extract key insights:\n\n${data.slice(0, 15000)}`;

        const r = await perplexityFast(prompt);

        return {
            filename: args.filePath,
            summary: r.content,
            latency: r.latency,
        };
    } catch (err: any) {
        return { error: err?.message ?? "Unknown fileTool error" };
    }
}
