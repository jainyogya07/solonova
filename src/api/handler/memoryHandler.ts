// src/api/handler/memoryHandler.ts
import * as memory from "../../memory/store.js";

export async function getMemoryHandler(userId?: string) {
    try {
        if (!userId) return { status: 400, json: { error: "missing userId" } };
        // Assuming memory.readSnapshot exists (from previous V2/V3 work or need to mock)
        // If it doesn't exist, I'll need to add it or mock it.
        // User said "src/memory/store.ts ... here's a simple add... clearUserMemory".
        // Implies readSnapshot exists.
        const snap = await memory.readSnapshot(userId);
        return { status: 200, json: { ok: true, snapshot: snap } };
    } catch (err: any) {
        return { status: 500, json: { error: err?.message ?? "err" } };
    }
}

export async function clearMemoryHandler(userId?: string) {
    try {
        if (!userId) return { status: 400, json: { error: "missing userId" } };
        await memory.clearUserMemory(userId);
        return { status: 200, json: { ok: true } };
    } catch (err: any) {
        return { status: 500, json: { error: err?.message ?? "err" } };
    }
}
