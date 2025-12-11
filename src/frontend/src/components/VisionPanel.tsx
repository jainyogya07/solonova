// src/frontend/src/components/VisionPanel.tsx
import { useState } from "react";
import { apiUrl } from "../utils/api";

export default function VisionPanel({ onResult }: { onResult?: (txt: string) => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [out, setOut] = useState<any>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const uploadAndAnalyze = async () => {
        if (!file) return;
        setLoading(true);
        setOut(null);
        try {
            const form = new FormData();
            form.append("file", file);
            
            // Upload file
            const upl = await fetch(apiUrl("/api/upload"), { method: "POST", body: form });
            if (!upl.ok) {
                throw new Error(`Upload failed: ${upl.status} ${upl.statusText}`);
            }
            const up = await upl.json();
            if (!up?.path) throw new Error("Upload failed: No file path returned");

            // Call vision tool
            const call = await fetch(apiUrl("/api/tools/call"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tool: "vision", args: { filePath: up.path } }),
            });
            if (!call.ok) {
                throw new Error(`Vision API failed: ${call.status} ${call.statusText}`);
            }
            const d = await call.json();
            if (d.error) {
                throw new Error(d.error);
            }
            setOut(d.result);
            // Send only the refined description to chat
            const description = d.result?.perceptSummary?.description || d.result?.description || "Image analysis completed.";
            onResult?.(description);
        } catch (err: any) {
            const errorMsg = err?.message ?? String(err);
            console.error("Vision error:", err);
            setOut({ error: errorMsg });
            onResult?.(`Vision error: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] ?? null;
        setFile(f);
        if (f) {
            const url = URL.createObjectURL(f);
            setPreview(url);
        } else {
            setPreview(null);
        }
    };

    return (
        <div className="p-4 space-y-3 border-t border-gray-700 bg-[#0f0f0f]">
            <div className="flex justify-between items-center">
                <h3 className="text-sm opacity-60 font-semibold">👁️ VISION</h3>
                {loading && <span className="text-xs text-purple-400 animate-pulse">Analyzing...</span>}
            </div>

            <div className="space-y-2">
                <div className="flex gap-2 items-start">
                    <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        className="flex-1 w-full p-2 bg-[#1a1a1a] text-white rounded border border-gray-700 text-sm"
                    />
                    {preview && (
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-10 h-10 object-cover rounded border border-gray-600"
                        />
                    )}
                </div>

                <div className="flex gap-2">
                    <button
                        disabled={loading || !file}
                        onClick={uploadAndAnalyze}
                        className={`flex-1 px-3 py-2 rounded text-sm transition ${loading || !file
                                ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                                : "bg-purple-600 hover:bg-purple-500 text-white"
                            }`}
                    >
                        {loading ? "Scanning..." : "Analyze Image"}
                    </button>

                    <button
                        onClick={() => { setFile(null); setOut(null); setPreview(null); }}
                        className="px-3 py-2 bg-[#222] hover:bg-[#333] text-white rounded text-sm transition"
                    >
                        Clear
                    </button>
                </div>
            </div>

            {out && (
                <div className="mt-2 p-3 bg-[#111] rounded border border-gray-800">
                    <div className="mb-2 text-purple-400 font-bold text-sm">Refined Description:</div>
                    {out.error ? (
                        <div className="text-red-400 text-sm">{out.error}</div>
                    ) : (
                        <div className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                            {out.perceptSummary?.description || out.description || "No description available."}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
