
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import os from "os";

// Fix imports to be relative to this file (in src/)
import { agentHandler } from "./api/handler/agentHandler";
import { agentStreamHandler } from "./api/handler/agentStream";
import { toolHandler } from "./api/handler/toolHandler";
import { logsHandler } from "./api/handler/logsHandler"; // changed from .js to no extension or matches resolver
import { getMemoryHandler, clearMemoryHandler } from "./api/handler/memoryHandler";

const app = express();

// Handle Vercel read-only filesystem by using /tmp for uploads
const isVercel = process.env.VERCEL === "1";
const uploadDir = isVercel ? os.tmpdir() : path.join(process.cwd(), "uploads");

// Ensure upload dir exists locally
if (!isVercel && !fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });

// -------------------------------
//  MIDDLEWARE
// -------------------------------
app.use(
    cors({
        origin: "*", // Allow all for Vercel demo simplicity, or restrict to frontend URL
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use(express.json({ limit: "10mb" }));

// -------------------------------
//  NORMAL AI REQUEST
// -------------------------------
app.post("/api/agent", async (req: Request, res: Response) => {
    try {
        const result = await agentHandler(req.body);
        return res.status(result.status).json(result.json);
    } catch (err) {
        console.error("❌ /api/agent error:", err);
        return res.status(500).json({ error: "Server error" });
    }
});

// -------------------------------
//  STREAMING AI REQUEST
// -------------------------------
// Fix: Use correct endpoint handler matching local server
app.post("/api/agent/stream", async (req: Request, res: Response) => {
    try {
        // SSE Headers for Vercel
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("Content-Encoding", "none"); // Important for Vercel streaming

        const isNetlify = !!process.env.NETLIFY;
        let buffer = "";

        await agentStreamHandler(req.body, (chunk: string) => {
            if (isNetlify) {
                buffer += chunk;
            } else {
                res.write(chunk);
            }
        });

        if (isNetlify) {
            res.write(buffer);
        }

        res.end();
    } catch (err: any) {
        console.error("❌ /api/agent/stream error:", err);
        // Force 200 OK so client reads the error text
        if (!res.headersSent) res.status(200);
        res.write(`\n\nError: ${err?.message ?? String(err)}\n`);
        res.end();
    }
});

// -------------------------------
//  TOOL INVOCATION
// -------------------------------
app.post("/api/tools/call", async (req: Request, res: Response) => {
    try {
        const result = await toolHandler(req.body);
        return res.status(result.status).json(result.json);
    } catch (err) {
        console.error("❌ /api/tools/call error:", err);
        return res.status(500).json({ error: "Tool execution error" });
    }
});

// -------------------------------
//  FILE UPLOAD
// -------------------------------
app.post("/api/upload", upload.single("file"), (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }
    res.json({ ok: true, path: req.file.path });
});

// -------------------------------
//  HEALTH CHECK
// -------------------------------
app.get("/api/health", (req: Request, res: Response) =>
    res.json({ ok: true, service: "Solonova Backend (Vercel Ready)" })
);

// -------------------------------
//  LOGS (Dev Console)
// -------------------------------
app.get("/api/logs", async (req, res) => {
    const r = await logsHandler();
    res.status(r.status).json(r.json);
});

// -------------------------------
//  MEMORY INSPECTOR
// -------------------------------
app.get("/api/memory/:userId", async (req, res) => {
    const r = await getMemoryHandler(req.params.userId as string);
    res.status(r.status).json(r.json);
});

app.post("/api/memory/:userId/clear", async (req, res) => {
    const r = await clearMemoryHandler(req.params.userId as string);
    res.status(r.status).json(r.json);
});

// -------------------------------
//  ERROR HANDLER
// -------------------------------
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("🔥 Unhandled server error:", err);
    res.status(500).json({ error: "Internal server error" });
});

export default app;
