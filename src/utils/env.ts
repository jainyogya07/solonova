
// src/utils/env.ts
declare var process: any;
declare var Deno: any;

/**
 * Safely get environment variables in Node and Deno (Edge) runtimes.
 */
export function getEnv(key: string): string | undefined {
    // Check Node.js
    if (typeof process !== "undefined" && process.env) {
        return process.env[key];
    }

    // Check Deno / Edge Runtime
    // @ts-ignore
    if (typeof Deno !== "undefined" && Deno.env) {
        // @ts-ignore
        return Deno.env.get(key);
    }

    // Fallback for Netlify Edge if Deno global is different or strict
    // Sometimes Netlify exposes 'Netlify.env.get(key)' context, but Deno.env usually works.

    return undefined;
}
