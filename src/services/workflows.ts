// src/services/workflows.ts
/**
 * Workflow helpers for Solonova Agent.
 * Provides high-level workflows that orchestrate multiple agent calls.
 */

import { handleUserRequest } from "../agents/solonovaAgent";

/**
 * killerDemoWorkflow:
 * A multi-step demo that showcases Solonova's full capability:
 * 1. Generate a unique SaaS idea
 * 2. Create a 7-step MVP launch plan
 * 3. Generate production-ready backend code
 * 4. Optimize the code via Vultr GPU
 */
export async function killerDemoWorkflow(userId = "demo-user") {
    const ideaPrompt = "Generate a unique solopreneur SaaS idea that can be built in 1 week.";
    const planPrompt = "Turn this into a 7-step MVP launch plan.";
    const codePrompt = "Generate the main backend function for the MVP (clean, production-ready).";

    // STEP 1 — Idea
    const idea = await handleUserRequest({
        type: "idea",
        prompt: ideaPrompt,
        userId,
        latencyBudgetMs: 1000,
    });

    // STEP 2 — Plan (feed idea content)
    const plan = await handleUserRequest({
        type: "plan",
        prompt: `Idea: ${idea.content || ""}\n\n${planPrompt}`,
        userId,
        latencyBudgetMs: 1500,
    });

    // STEP 3 — Code
    const code = await handleUserRequest({
        type: "code",
        prompt: `SaaS Idea: ${idea.content || ""}\nMVP Plan: ${plan.content || ""}\n\n${codePrompt}`,
        userId,
        latencyBudgetMs: 2000,
    });

    // STEP 4 — Optimize via Vultr GPU
    const optimize = await handleUserRequest({
        type: "optimize",
        prompt: code.content || "",
        userId,
        latencyBudgetMs: 4000,
        enableOptimize: true,
    });

    // FINAL
    return {
        idea,
        plan,
        code,
        optimize,
    };
}
