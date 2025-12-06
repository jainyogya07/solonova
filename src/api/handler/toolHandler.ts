// src/api/handler/toolHandler.ts
import { callTool } from "../../tools";

export async function toolHandler(body: any) {
    if (!body || !body.tool) {
        return { status: 400, json: { error: "missing tool" } };
    }

    try {
        const result = await callTool(body.tool, body.args ?? {});
        return { status: 200, json: { ok: true, result } };
    } catch (err: any) {
        console.error("toolHandler error", err);
        return { status: 500, json: { error: err?.message ?? "tool error" } };
    }
}
