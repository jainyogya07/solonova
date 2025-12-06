// src/utils/logger.ts
declare var process: any;

const MAX_LOGS = 500;
type LogEntry = { ts: string; level: "info" | "warn" | "error"; msg: string; meta?: any };
const logs: LogEntry[] = [];

export function log(tag: string, meta?: any) {
  const entry: LogEntry = { ts: new Date().toISOString(), level: "info", msg: tag, meta };
  logs.push(entry);
  if (logs.length > MAX_LOGS) logs.shift();
  console.info(tag, meta);
}

export function debug(tag: string, meta?: any) {
  const entry: LogEntry = { ts: new Date().toISOString(), level: "info", msg: tag, meta };
  logs.push(entry); if (logs.length > MAX_LOGS) logs.shift();
  let debugMode = false;
  try { debugMode = !!process?.env?.DEBUG; } catch { }
  if (debugMode) console.debug(tag, meta);
}

export function error(tag: string, meta?: any) {
  const entry: LogEntry = { ts: new Date().toISOString(), level: "error", msg: tag, meta };
  logs.push(entry); if (logs.length > MAX_LOGS) logs.shift();
  console.error(tag, meta);
}

export function getLogs() {
  return logs.slice().reverse(); // newest first
}