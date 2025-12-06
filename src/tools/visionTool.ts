// src/tools/visionTool.ts
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { perplexityFast } from "../api/perplexity";

// We'll attempt cloud OCR if OCR_API_KEY is present (Google Vision REST).
// Fallback: use tesseract.js for offline OCR.

async function runGoogleVision(base64Image: string) {
    const key = process.env.OCR_API_KEY;
    if (!key) throw new Error("No OCR_API_KEY");
    const url = `https://vision.googleapis.com/v1/images:annotate?key=${key}`;

    const body = {
        requests: [
            {
                image: { content: base64Image },
                features: [
                    { type: "TEXT_DETECTION", maxResults: 1 },
                    { type: "LABEL_DETECTION", maxResults: 8 },
                    { type: "IMAGE_PROPERTIES", maxResults: 1 },
                ],
            },
        ],
    };

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    const data = await res.json();
    return data;
}

async function runTesseractOCR(imagePath: string) {
    // dynamic import to avoid heavy startup when not used
    const { createWorker } = await import("tesseract.js");

    // Tesseract.js v5: createWorker(langs, oem, config)
    // We'll trust default English for now and minimal config
    const worker = await createWorker("eng");

    const { data } = await worker.recognize(imagePath);
    await worker.terminate();
    return data;
}

export async function visionTool(args: { filePath?: string; url?: string }) {
    try {
        let filePath = args.filePath;
        let tempPath = filePath;
        let base64: string | null = null;

        // If URL provided, fetch and save temporarily
        if (args.url && !filePath) {
            const resp = await fetch(args.url);
            if (!resp.ok) return { error: `Could not fetch url: ${resp.status}` };
            const buffer = Buffer.from(await resp.arrayBuffer());
            const tmpName = `/tmp/solonova-vision-${Date.now()}.jpg`;
            fs.writeFileSync(tmpName, buffer);
            tempPath = tmpName;
        }

        if (!tempPath || !fs.existsSync(tempPath)) {
            return { error: "Missing filePath or file not found" };
        }

        // base64 for cloud API
        const buffer = fs.readFileSync(tempPath);
        base64 = buffer.toString("base64");

        let ocrText = "";
        let labels: string[] = [];
        let rawVision: any = null;

        // Try Google Vision if key available
        if (process.env.OCR_API_KEY) {
            try {
                const gv = await runGoogleVision(base64);
                rawVision = gv;
                const textAnn = gv?.responses?.[0]?.fullTextAnnotation?.text;
                ocrText = textAnn ?? "";
                const lbls = gv?.responses?.[0]?.labelAnnotations ?? [];
                labels = lbls.map((l: any) => l.description).slice(0, 8);
            } catch (err) {
                // fallback to tesseract if google fails
                console.warn("Google Vision failed, falling back to Tesseract:", err);
                const t = await runTesseractOCR(tempPath);
                ocrText = t?.text ?? "";
            }
        } else {
            // No cloud key — use tesseract
            const t = await runTesseractOCR(tempPath);
            ocrText = t?.text ?? "";
            // try to infer some labels from tesseract's HOCR? keep empty
            labels = [];
        }

        // Build a Perplexity prompt for captioning & suggestions
        const promptParts: string[] = [];
        promptParts.push("You are an assistant that describes images succinctly for product UIs.");
        promptParts.push("Provide:");
        promptParts.push("- 1 short caption (max 10 words)");
        promptParts.push("- 1 longer description (2-3 sentences)");
        promptParts.push("- 5-tag label list appropriate for alt text");
        promptParts.push("- 3 suggested use-cases for this image in a solopreneur product context");
        promptParts.push("");
        promptParts.push("OCR text (if any):");
        promptParts.push(ocrText ? `>>> OCR START >>>\n${ocrText.slice(0, 12000)}\n<<< OCR END <<<` : "(no OCR text)");
        promptParts.push("");
        promptParts.push("Detected labels (from vision API):");
        promptParts.push(labels.length ? labels.join(", ") : "(none)");
        promptParts.push("");
        promptParts.push("Now produce the requested items in a clear JSON-like format so the caller can parse it.");

        const prompt = promptParts.join("\n");

        const p = await perplexityFast(prompt);

        // Try to parse Perplexity output if possible; otherwise return raw text
        let parsed = null;
        try {
            // Perplexity may return natural text; attempt to find JSON in response
            const txt = p.content ?? "";
            // heuristic: try to find first {...} or lines
            const jsonStart = txt.indexOf("{");
            if (jsonStart >= 0) {
                const maybe = txt.slice(jsonStart);
                // Try to find the last }
                const jsonEnd = maybe.lastIndexOf("}");
                if (jsonEnd >= 0) {
                    parsed = JSON.parse(maybe.substring(0, jsonEnd + 1));
                } else {
                    parsed = { raw: txt };
                }
            } else {
                parsed = { raw: txt };
            }
        } catch (err) {
            parsed = { raw: p.content ?? "" };
        }

        return {
            ok: true,
            ocrText,
            labels,
            perceptSummary: parsed,
            rawVision,
            latency: p.latency ?? null,
        };
    } catch (err: any) {
        return { error: err?.message ?? String(err), stack: err?.stack ?? null };
    }
}
