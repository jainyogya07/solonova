
import { agentStreamHandler } from "../../src/api/handler/agentStream.ts";

export default async (request: Request) => {
    // Only handle POST requests to this endpoint
    const url = new URL(request.url);
    if (request.method !== "POST") {
        // If not POST, pass through or 405. 
        // Since this function is mapped to a specific route, 405 is appropriate or context.next()
        return new Response("Method not allowed", { status: 405 });
    }

    // Parse Body
    let body;
    try {
        body = await request.json();
    } catch {
        return new Response("Invalid JSON", { status: 400 });
    }

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Execute Agent Logic
    // We don't await this here, we return the Response immediately with the readable stream.
    // The logic runs and pumps data into the writer.
    (async () => {
        try {
            await agentStreamHandler(body, (chunk) => {
                // synchronously encode/write? writer.write returns promise.
                // We should await it to respect backpressure but for text chat it's fine.
                writer.write(encoder.encode(chunk));
            });
        } catch (err: any) {
            const msg = `\n\nError: ${err?.message || String(err)}\n`;
            writer.write(encoder.encode(msg));
        } finally {
            writer.close();
        }
    })();

    return new Response(readable, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
};

export const config = { path: "/api/agent/stream" };
