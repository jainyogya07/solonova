// src/utils/latency.ts
/**
 * Lightweight latency utilities for Solonova.
 * 
 * These are intentionally simple & dependency-free.
 * They work in both browser and Node environments.
 */

export function measureLatency(start: number): number {
  return Math.round(performance.now() - start);
}

export function durationMs(start: number): number {
  return measureLatency(start);
}

export function since(ts: number) {
  return `${measureLatency(ts)}ms`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Returns true if measured latency is greater than allowed limit.
 */
export function latencyBudgetExceeded(latency: number, budget: number): boolean {
  return latency > budget;
}