// src/frontend/src/components/VisionPanel.tsx
import { useState } from "react";

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
            const upl = await fetch("http://localhost:5174/api/upload", { method: "POST", body: form });
            const up = await upl.json();
            if (!up?.path) throw new Error("Upload failed");

            const call = await fetch("http://localhost:5174/api/tools/call", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tool: "vision", args: { filePath: up.path } }),
            });
            const d = await call.json();
            setOut(d.result);
            onResult?.(JSON.stringify(d.result, null, 2));
        } catch (err: any) {
            setOut({ error: err.message ?? String(err) });
            onResult?.(`Vision error: ${err?.message ?? err}`);
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
                <div className="mt-2 p-3 bg-[#111] rounded text-xs font-mono border border-gray-800 overflow-x-auto max-h-60 overflow-y-auto">
                    <div className="mb-2 text-purple-400 font-bold">Analysis Result:</div>
                    {out.perceptSummary && (
                        <div className="mb-3 whitespace-pre-wrap font-sans text-gray-300">
                            {out.perceptSummary.raw || JSON.stringify(out.perceptSummary, null, 2)}
                        </div>
                    )}

                    {out.labels && out.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                            {out.labels.map((l: string, i: number) => (
                                <span key={i} className="px-1.5 py-0.5 bg-gray-800 rounded text-[10px] text-gray-400">{l}</span>
                            ))}
                        </div>
                    )}

                    {out.ocrText && (
                        <div className="opacity-60 border-t border-gray-800 pt-2 mt-2">
                            <div className="mb-1 font-bold">OCR Text:</div>
                            {out.ocrText.slice(0, 200)}...
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
