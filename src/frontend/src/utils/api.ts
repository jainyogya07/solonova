const rawBase = import.meta.env.VITE_API_BASE || "";
const trimmedBase = rawBase.endsWith("/") ? rawBase.slice(0, -1) : rawBase;

export const API_BASE = trimmedBase;
export const apiUrl = (path: string) => `${API_BASE}${path}`;

