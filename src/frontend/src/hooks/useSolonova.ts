import { apiUrl } from "../utils/api";
// src/hooks/useSolonova.ts
import { useState, useCallback, useEffect, useRef } from "react";

export interface SolonovaMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  meta?: unknown;
}

export interface SolonovaSendOptions {
  type?: "chat" | "idea" | "plan" | "code" | "optimize";
  userId?: string;
  latencyBudgetMs?: number;
  enableOptimize?: boolean;
}

// === persistence config ===
const STORAGE_KEY = "solonova_messages_v1";
const MAX_MESSAGES = 80;
const WRITE_DEBOUNCE_MS = 500;

function safeParse(s?: string) {
  try {
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export default function useSolonova() {
  const [messages, setMessages] = useState<SolonovaMessage[]>(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    const parsed = safeParse(raw ?? undefined);
    return Array.isArray(parsed) ? parsed.slice(-MAX_MESSAGES) : [];
  });

  const [loading, setLoading] = useState(false);
  const [lastLatency, setLastLatency] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // debounce localStorage writes
  const writeTimer = useRef<number | null>(null);
  const queueWrite = useCallback((msgs: SolonovaMessage[]) => {
    if (writeTimer.current) window.clearTimeout(writeTimer.current);
    writeTimer.current = window.setTimeout(() => {
      try {
        // keep last N messages only
        const trimmed = msgs.slice(-MAX_MESSAGES);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      } catch (e) {
        // QuotaExceeded or other errors — swallow and skip write
        console.warn("localStorage write failed, skipping. ", e);
      }
    }, WRITE_DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    queueWrite(messages);
  }, [messages, queueWrite]);

  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
    setLastLatency(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch { }
  }, []);

  // expose helper manually if needed by UI
  const addMessage = useCallback((role: "user" | "assistant", content: string) => {
    const msg: SolonovaMessage = {
      id: `${role.charAt(0)}-${Math.random().toString(36).slice(2)}`,
      role,
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msg]);
  }, []);

  const sendMessage = useCallback(async (text: string, opts: SolonovaSendOptions = {}) => {
    if (!text.trim()) return;
    setError(null);
    setLoading(true);

    const id = `u-${Math.random().toString(36).slice(2)}`;
    const userMsg: SolonovaMessage = { id, role: "user", content: text, timestamp: new Date().toISOString() };
    setMessages((p) => [...p, userMsg]);

    try {
      const resp = await fetch(apiUrl("/api/agent"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: opts.type ?? "chat",
          prompt: text,
          userId: opts.userId ?? "demo-user",
          latencyBudgetMs: opts.latencyBudgetMs ?? 1200,
          enableOptimize: opts.enableOptimize ?? false,
        }),
      });
      if (!resp.ok) throw new Error(`API error ${resp.status}`);
      const json = await resp.json();
      setLastLatency(json?.metrics?.totalLatencyMs ?? null);
      const assistantMsg: SolonovaMessage = {
        id: `a-${json.id}`,
        role: "assistant", // fixed role type
        content: json.content,
        timestamp: json.timestamp || new Date().toISOString(),
        meta: json,
      };
      setMessages((p) => [...p, assistantMsg]);
    } catch (err: any) {
      console.error("sendMessage error", err);
      setError(err instanceof Error ? err.message : "Unknown");
    } finally {
      setLoading(false);
    }
  }, []);

  // streaming version (reads chunked output from /api/agent/stream)
  const sendMessageStream = useCallback(async (text: string, opts: SolonovaSendOptions = {}) => {
    if (!text.trim()) return;
    setError(null);
    setLoading(true);

    const userId = opts.userId ?? "demo-user";
    const userMsg: SolonovaMessage = {
      id: `u-${Math.random().toString(36).slice(2)}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((p) => [...p, userMsg]);

    const assistantId = `a-${Math.random().toString(36).slice(2)}`;
    // placeholder assistant message (progressively filled)
    // NOTE: using "as const" for role to fix lint error
    setMessages((p) => [...p, { id: assistantId, role: "assistant" as const, content: "", timestamp: new Date().toISOString() }]);

    try {
      const resp = await fetch(apiUrl("/api/agent/stream"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: opts.type ?? "chat",
          prompt: text,
          userId,
          latencyBudgetMs: opts.latencyBudgetMs ?? 1200,
        }),
      });

      if (!resp.ok) throw new Error(`stream error ${resp.status}`);
      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulated = "";

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = !!streamDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });

          if (chunk.includes("[[END_STREAM]]")) {
            accumulated += chunk.replace("[[END_STREAM]]", "");
            setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: accumulated } : m)));
            break;
          }
          accumulated += chunk;
          // Update assistant message content progressively
          setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: accumulated } : m)));
        }
      }
    } catch (err: any) {
      console.error("sendMessageStream error", err);
      setError(err instanceof Error ? err.message : "Unknown");
      // update assistant with error text if needed
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: "[Error streaming response]" } : m)));
    } finally {
      setLoading(false);
    }
  }, []);

  // expose API
  return {
    messages,
    loading,
    error,
    lastLatency,
    sendMessage,
    sendMessageStream,
    addMessage,
    reset,
  };
}