// server.js — Solonova backend for Vite React frontend

import express from "express";
import cors from "cors";
import { agentHandler } from "./src/api/handler/agentHandler.js";
import { agentStreamHandler } from "./src/api/handler/agentStream.js";

const app = express();

// -------------------------------
//  MIDDLEWARE
// -------------------------------
app.use(
    cors({
        origin: "http://localhost:5173", // Vite frontend
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type"],
    })
);

app.use(express.json({ limit: "2mb" })); // avoid crash on big prompts

// -------------------------------
//  NORMAL AI REQUEST
// -------------------------------
app.post("/api/agent", async (req, res) => {
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
app.post("/api/agent/stream", async (req, res) => {
    try {
        // Streaming headers
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Transfer-Encoding", "chunked");
        res.setHeader("Cache-Control", "no-cache");
        res.flushHeaders?.(); // ensure immediate flush (Express 4+)

        await agentStreamHandler(req.body, (chunk) => {
            try {
                res.write(chunk);
            } catch (err) {
                console.error("❌ Streaming write error:", err);
            }
        });

        res.end();
    } catch (err) {
        console.error("❌ /api/agent/stream error:", err);
        try {
            res.end();
        } catch { }
    }
});

// -------------------------------
//  HEALTH CHECK
// -------------------------------
app.get("/api/health", (req, res) =>
    res.json({ ok: true, service: "Solonova Backend" })
);

// -------------------------------
// ERROR HANDLER (for safety)
// -------------------------------
app.use((err, req, res, next) => {
    console.error("🔥 Unhandled server error:", err);
    res.status(500).json({ error: "Internal server error" });
});

// -------------------------------
//  START SERVER
// -------------------------------
const PORT = 5174;
app.listen(PORT, () => {
    console.log(`🚀 Solonova backend running at http://localhost:${PORT}`);
});
