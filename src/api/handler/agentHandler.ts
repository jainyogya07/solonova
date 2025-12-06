// src/api/handler/agentHandler.ts
// Non-streaming request handler

import { handleUserRequest } from "../../agents/solonovaAgent";
import { killerDemoWorkflow } from "../../services/workflows";

export async function agentHandler(body: any) {
  if (!body) {
    return { status: 400, json: { error: "Missing request body" } };
  }

  if (body?.demo === true) {
    const result = await killerDemoWorkflow(body.userId ?? "demo-user");
    return { status: 200, json: result };
  }

  if (!body.prompt || typeof body.prompt !== "string") {
    return { status: 400, json: { error: "Missing prompt" } };
  }

  const payload = {
    type: body.type ?? "chat",
    prompt: body.prompt,
    userId: body.userId ?? "demo-user",
    latencyBudgetMs: body.latencyBudgetMs ?? 1200,
    enableOptimize: body.enableOptimize ?? false,
  };

  try {
    const result = await handleUserRequest(payload);
    return { status: 200, json: result };
  } catch (err: any) {
    console.error("Solonova /agent handler error:", err);
    return {
      status: 500,
      json: { error: err?.message ?? "Unknown error" }
    };
  }
}