import React, { useEffect, useState } from "react";
import { apiUrl } from "../../utils/api";

export default function DevPanel() {
    const [logs, setLogs] = useState<any[]>([]);
    const [latencies, setLatencies] = useState<number[]>([]);
    const [memorySnap, setMemorySnap] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            // Logs & Latency
            try {
                const r = await fetch(apiUrl("/api/logs"));
                const d = await r.json();
                setLogs(d?.logs ?? []);
                const l = (d?.logs ?? [])
                    .map((x: any) => x.meta?.metrics?.totalLatencyMs)
                    .filter(Boolean)
                    .slice(0, 50);
                setLatencies(l.reverse());
            } catch (e) { /* ignore */ }

            // Memory
            try {
                const r2 = await fetch(apiUrl("/api/memory/demo-user"));
                const d2 = await r2.json();
                setMemorySnap(d2.snapshot);
            } catch (e) { /* ignore */ }
        };

        fetchData();
        const interval = setInterval(fetchData, 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-full overflow-y-auto p-4 text-sm bg-[#0d0d0d] text-gray-300 font-sans">
            <div className="text-lg font-semibold mb-4 text-purple-300">
                Developer Console
            </div>

            <div className="border border-gray-700 p-3 rounded mb-6 bg-[#111]">
                <div className="opacity-70 mb-1 text-xs uppercase tracking-wider">Recent Latency</div>
                <div className="h-20 flex items-end gap-[1px]">
                    {/* Simple Bar Chart / Sparkline */}
                    {latencies.length > 0 ? (
                        <div className="w-full h-full flex items-end gap-1">
                            {latencies.map((v, i) => (
                                <div key={i} className="bg-purple-500/50 w-full rounded-t" style={{ height: `${Math.min(v / 100, 100)}%` }}></div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center w-full py-6 text-gray-500 text-xs">No data yet</div>
                    )}
                </div>
                <div className="text-right text-[10px] opacity-50 mt-1">{latencies[0] ? `${latencies[0]}ms` : ""}</div>
            </div>

            <div className="opacity-70 mb-1 text-xs uppercase tracking-wider">Logs</div>
            <div className="border border-gray-700 p-2 rounded h-[250px] overflow-y-auto bg-[#0a0a0a] font-mono text-xs mb-6">
                {logs.length === 0 && <div className="text-gray-500 italic p-2">Waiting for logs...</div>}
                {logs.map((l: any, i: number) => (
                    <div key={i} className="mb-2 border-b border-gray-800/50 pb-1 last:border-0">
                        <div className="flex justify-between opacity-50 text-[10px]">
                            <span>{new Date(l.ts).toLocaleTimeString()}</span>
                            <span className={l.level === "error" ? "text-red-400" : "text-blue-400"}>{l.level}</span>
                        </div>
                        <div className="text-gray-300 break-words">{l.msg}</div>
                    </div>
                ))}
            </div>

            <div className="opacity-70 mb-1 text-xs uppercase tracking-wider">Memory Inspector</div>
            <div className="border border-gray-700 p-3 rounded bg-[#111]">
                <div className="text-gray-400 text-xs mb-2">User: <span className="text-green-400">demo-user</span></div>
                {memorySnap ? (
                    <pre className="text-[10px] overflow-auto max-h-[200px] text-gray-500">
                        {JSON.stringify(memorySnap, null, 2)}
                    </pre>
                ) : (
                    <div className="text-gray-500 italic text-xs">No memory snapshot</div>
                )}
            </div>
        </div>
    );
}
