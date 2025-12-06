// src/frontend/src/components/MemoryPanel.tsx
import React, { useEffect, useState } from "react";

export default function MemoryPanel({ userId = "demo-user" }: { userId?: string }) {
    const [snap, setSnap] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const fetchMem = async () => {
        setLoading(true);
        try {
            const r = await fetch(`http://localhost:5174/api/memory/${userId}`);
            const d = await r.json();
            setSnap(d.snapshot ?? null);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => { fetchMem(); }, [userId]);

    return (
        <div className="glass p-3 w-80 bg-[#0a0a0a] border-l border-gray-800 h-screen overflow-auto">
            <div className="text-sm font-semibold mb-2 text-green-400">Memory Inspector</div>
            <div className="text-xs opacity-60 mb-2">User: {userId}</div>
            <div className="flex gap-2 mb-3">
                <button onClick={fetchMem} className="px-2 py-1 bg-[#222] rounded text-xs hover:bg-[#333] transition">Refresh</button>
                <button onClick={async () => { await fetch(`http://localhost:5174/api/memory/${userId}/clear`, { method: "POST" }); fetchMem(); }} className="px-2 py-1 bg-red-900/50 text-red-200 border border-red-800 rounded text-xs hover:bg-red-800 transition">Clear</button>
            </div>

            {loading && <div className="mt-2 opacity-60 text-xs animate-pulse">Loading...</div>}

            {snap && (
                <pre className="mt-3 text-[10px] bg-[#111] p-2 rounded max-h-[500px] overflow-auto border border-gray-800 font-mono text-gray-400">
                    {JSON.stringify(snap, null, 2)}
                </pre>
            )}
        </div>
    );
}
