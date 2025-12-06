// src/api/handler/logsHandler.ts
import { getLogs } from "../../utils/logger.js";

export async function logsHandler() {
    try {
        const data = getLogs();
        return { status: 200, json: { ok: true, logs: data } };
    } catch (err: any) {
        return { status: 500, json: { error: String(err?.message ?? err) } };
    }
}
