// src/memory/store.ts
// ... existing imports ...
import fs from "fs";
import path from "path";

/**
 * SmartMemory (lightweight)
 *
 * Environment-aware simple persistent memory for Solonova.
 * - Node: stores JSON file at ./data/solonova_memory.json (created automatically)
 * - Browser: uses localStorage under key "solonova_memory"
 *
 * Exports:
 * - readSnapshot(userId)
 * - appendEntry(userId, entry)
 * - clearUserMemory(userId)
 * - readAll()   // for debugging / admin
 *
 * Note: This is intentionally dependency-free so it works in hackathon
 * environments and on Mac M4 Air without native installs.
 */

type MemoryEntry = {
  requestId: string;
  prompt: string;
  responseSummary: string;
  timestamp: string;
  meta?: Record<string, any>;
};

type UserMemory = {
  userId: string;
  entries: MemoryEntry[];
  summary?: string; // generated short summary
  lastNotes?: string; // copy of most recent entry summary
  createdAt: string;
  updatedAt: string;
};

type MemoryStore = Record<string, UserMemory>; // keyed by userId

// -------------------- environment helpers --------------------

const isNode =
  typeof process !== "undefined" &&
  process.versions != null &&
  process.versions.node != null;

const getEnv = (key: string) => (typeof process !== "undefined" ? process.env?.[key] : undefined);

const isVercel = getEnv("VERCEL") === "1";
const isNetlify = !!getEnv("NETLIFY");
const NODE_DATA_PATH = (isVercel || isNetlify) ? "/tmp" : "./data";
const NODE_FILE = `${NODE_DATA_PATH}/solonova_memory.json`;
const BROWSER_LS_KEY = "solonova_memory";

/**
 * Safe JSON parse
 */
function safeParse<T = any>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

/* -------------------- node fs helpers -------------------- */

async function ensureNodeDataFile(): Promise<void> {
  if (!isNode) return;
  // lazy import to avoid bundler issues on browser
  const fs = await import("fs").then((m) => m.promises);
  const path = await import("path").then((m) => m);
  try {
    // ensure ./data exists
    await fs.mkdir(NODE_DATA_PATH, { recursive: true });
    // ensure file exists
    try {
      await fs.access(NODE_FILE);
    } catch {
      await fs.writeFile(NODE_FILE, JSON.stringify({}, null, 2), "utf-8");
    }
  } catch (err) {
    // non-fatal — memory will fall back to in-memory store
    // eslint-disable-next-line no-console
    console.warn("SmartMemory: unable to ensure node data file:", err);
  }
}

/**
 * Atomic write for Node: write temp then rename
 */
async function writeNodeFileAtomic(obj: MemoryStore) {
  const fs = await import("fs").then((m) => m.promises);
  const path = await import("path").then((m) => m);
  const tmp = `${NODE_FILE}.tmp`;
  const data = JSON.stringify(obj, null, 2);
  try {
    await fs.writeFile(tmp, data, "utf-8");
    await fs.rename(tmp, NODE_FILE);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("SmartMemory: atomic write failed, attempting direct write:", err);
    try {
      await fs.writeFile(NODE_FILE, data, "utf-8");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("SmartMemory: direct write also failed (persistence disabled for this write):", e);
      // Do NOT throw, to prevent crashing the app on read-only FS
    }
  }
}

async function readNodeFile(): Promise<MemoryStore | null> {
  const fs = await import("fs").then((m) => m.promises);
  try {
    const raw = await fs.readFile(NODE_FILE, "utf-8");
    return safeParse<MemoryStore>(raw) ?? {};
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("SmartMemory: readNodeFile failed:", err);
    return null;
  }
}

/* -------------------- in-memory fallback -------------------- */

let inMemoryStore: MemoryStore = {};

/* -------------------- core persistence helpers -------------------- */

async function loadStore(): Promise<MemoryStore> {
  if (isNode) {
    try {
      await ensureNodeDataFile();
      const fileStore = (await readNodeFile()) ?? {};
      // merge into inMemoryStore to enable faster writes
      inMemoryStore = { ...inMemoryStore, ...fileStore };
      return inMemoryStore;
    } catch {
      return inMemoryStore;
    }
  } else {
    // browser
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(BROWSER_LS_KEY) : null;
      const parsed = safeParse<MemoryStore>(raw) ?? {};
      inMemoryStore = { ...inMemoryStore, ...parsed };
      return inMemoryStore;
    } catch {
      return inMemoryStore;
    }
  }
}

async function persistStore(store: MemoryStore): Promise<void> {
  if (isNode) {
    try {
      await writeNodeFileAtomic(store);
      inMemoryStore = store;
    } catch {
      inMemoryStore = store; // best-effort
    }
  } else {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(BROWSER_LS_KEY, JSON.stringify(store));
        inMemoryStore = store;
      }
    } catch {
      inMemoryStore = store;
    }
  }
}

/* -------------------- small summary heuristic -------------------- */

/**
 * createSummary:
 * - simple heuristic summary generator
 * - joins last up-to-N entries prompts/responses, truncates to ~300 chars
 * - This is intentionally non-AI to avoid external calls; can be replaced by a model for richer summaries.
 */
function createSummary(entries: MemoryEntry[], maxChars = 300): string {
  if (!entries || entries.length === 0) return "";
  const last = entries.slice(-5).map((e) => {
    const p = e.prompt.trim().replace(/\s+/g, " ");
    const r = e.responseSummary.trim().replace(/\s+/g, " ");
    return `${p} -> ${r}`;
  });
  let s = last.join(" • ");
  if (s.length > maxChars) s = s.slice(0, maxChars - 3) + "...";
  return s;
}

/* -------------------- exported API -------------------- */

/**
 * readSnapshot(userId)
 * - Returns a short snapshot used by Solonova agent:
 *   { summary?: string, lastNotes?: string }
 */
export async function readSnapshot(userId: string): Promise<{ summary?: string; lastNotes?: string } | null> {
  if (!userId) return null;
  try {
    const store = await loadStore();
    const u = store[userId];
    if (!u) return null;
    return { summary: u.summary, lastNotes: u.lastNotes };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("SmartMemory.readSnapshot error:", err);
    return null;
  }
}

/**
 * appendEntry(userId, entry)
 * - Appends an entry for the user and updates summary/lastNotes.
 */
export async function appendEntry(userId: string, entry: MemoryEntry): Promise<void> {
  if (!userId) throw new Error("appendEntry requires userId");
  try {
    const store = await loadStore();
    const now = new Date().toISOString();
    let user = store[userId];
    if (!user) {
      user = {
        userId,
        entries: [],
        summary: "",
        lastNotes: "",
        createdAt: now,
        updatedAt: now,
      };
    }

    // normalize entry
    const newEntry: MemoryEntry = {
      requestId: entry.requestId,
      prompt: entry.prompt,
      responseSummary: entry.responseSummary,
      timestamp: entry.timestamp ?? now,
      meta: entry.meta ?? {},
    };

    user.entries.push(newEntry);
    // keep only recent N entries to avoid huge files
    const MAX_ENTRIES = 200;
    if (user.entries.length > MAX_ENTRIES) {
      user.entries = user.entries.slice(-MAX_ENTRIES);
    }

    // update summaries
    user.lastNotes = newEntry.responseSummary.slice(0, 900);
    user.summary = createSummary(user.entries, 300);
    user.updatedAt = now;

    store[userId] = user;
    await persistStore(store);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("SmartMemory.appendEntry error:", err);
    // don't throw in production agent flow — degrade silently
  }
}

/**
 * clearUserMemory(userId)
 * - remove memory for a specific user (useful for dev / reset)
 */
export async function clearUserMemory(userId: string): Promise<void> {
  if (!userId) return;
  try {
    const store = await loadStore();
    delete store[userId];
    await persistStore(store);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("SmartMemory.clearUserMemory error:", err);
  }
}

/**
 * readAll()
 * - returns whole store (debug/admin). Avoid using in production to prevent sensitive data exposure.
 */
export async function readAll(): Promise<MemoryStore> {
  try {
    const store = await loadStore();
    return store;
  } catch {
    return {};
  }
}

/* -------------------- export defaults for convenience -------------------- */

export default {
  readSnapshot,
  appendEntry,
  clearUserMemory,
  readAll,
};