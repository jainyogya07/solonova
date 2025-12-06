// src/frontend/src/components/DevConsole.tsx
import React, { useEffect, useState } from "react";

export default function DevConsole() {
    const [logs, setLogs] = useState<any[]>([]);
    const [latencies, setLatencies] = useState<number[]>([]);

    const fetchLogs = async () => {
        try {
            const r = await fetch("http://localhost:5174/api/logs");
            const d = await r.json();
            setLogs(d?.logs ?? []);
            // derive latencies from meta if available
            const l = (d?.logs ?? [])
                .map((x: any) => x.meta?.metrics?.totalLatencyMs)
                .filter(Boolean)
                .slice(0, 50);
            setLatencies(l.reverse());
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchLogs();
        const id = setInterval(fetchLogs, 2500);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="glass p-3 w-96 h-screen overflow-auto border-l border-gray-800 bg-[#0a0a0a]">
            <div className="text-sm font-semibold mb-2 text-purple-400">Dev Console</div>

            <div className="mb-3">
                <div className="text-xs opacity-60 mb-1">Recent latency (ms)</div>
                <div className="p-2 bg-[#080808] rounded h-20 flex items-center border border-gray-800">
                    <Sparkline data={latencies} />
                </div>
            </div>

            <div>
                <div className="text-xs opacity-60 mb-2">Logs</div>
                <div className="space-y-2">
                    {logs.map((l: any, idx: number) => (
                        <div key={idx} className="p-2 bg-[#111] rounded text-xs border border-gray-800 font-mono">
                            <div className="opacity-60 flex justify-between">
                                <span>{new Date(l.ts).toLocaleTimeString()}</span>
                                <span className={l.level === "error" ? "text-red-500" : "text-blue-400"}>{l.level}</span>
                            </div>
                            <div className="whitespace-pre-wrap mt-1 text-gray-300">{l.msg}</div>
                            {l.meta && <pre className="text-[10px] mt-1 text-gray-500 overflow-x-auto">{JSON.stringify(l.meta, null, 2)}</pre>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// simple sparkline, no external lib
function Sparkline({ data }: { data: number[] }) {
    const width = 240, height = 40, padding = 2;
    const xs = data;
    if (!xs || xs.length === 0) return <div className="text-xs opacity-50 w-full text-center">no data</div>;
    const max = Math.max(...xs), min = Math.min(...xs);
    const points = xs.map((v, i) => {
        const x = (i / (Math.max(1, xs.length - 1))) * (width - 2 * padding) + padding;
        const y = height - padding - ((v - min) / Math.max(1, (max - min))) * (height - 2 * padding);
        return `${x},${y}`;
    }).join(" ");
    return (
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            <polyline points={points} fill="none" stroke="#9b72ff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
