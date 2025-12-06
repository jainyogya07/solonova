// src/tools/browserTool.ts
import fetch from "node-fetch";
import { parse } from "node-html-parser";
import { perplexityFast } from "../api/perplexity";

export async function browserTool(args: { url?: string; q?: string }) {
    // If URL provided -> fetch -> extract text -> summarize via Perplexity
    if (args.url) {
        const res = await fetch(args.url, { headers: { "User-Agent": "Solonova/1.0" } });
        const html = await res.text();
        const root = parse(html);
        // heuristic: get main text
        const content = root.querySelector("main")?.innerText ||
            root.querySelector("article")?.innerText ||
            root.structuredText ||
            root.textContent;
        const prompt = `Summarize the following web page content in 5 bullet points:\n\n${content.slice(0, 10000)}`;
        const p = await perplexityFast(prompt);
        return { summary: p.content ?? "(no summary)", latency: p.latency };
    }

    // If q provided -> use search aggregator (DuckDuckGo HTML results)
    if (args.q) {
        // Simple: call DuckDuckGo HTML result fetch — keep lightweight
        const query = encodeURIComponent(args.q);
        const searchUrl = `https://html.duckduckgo.com/html/?q=${query}`;
        const r = await fetch(searchUrl, { headers: { "User-Agent": "Solonova/10" } });
        const text = await r.text();
        // Extract first few links using regex
        const links = Array.from(text.matchAll(/href="(https?:\/\/[^"]+)"/g)).slice(0, 5).map((m: RegExpMatchArray) => m[1]);
        // Fetch first link and summarize
        if (links.length) {
            return await browserTool({ url: links[0] });
        }
        return { summary: "No results found", links: [] };
    }

    return { error: "no args" };
}
