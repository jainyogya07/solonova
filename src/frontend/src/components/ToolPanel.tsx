import { useState } from "react";
import { apiUrl } from "../utils/api";

export default function ToolPanel({ onResult }: { onResult: (result: string) => void }) {
    const [query, setQuery] = useState("");
    const [code, setCode] = useState("");
    const [lang, setLang] = useState("python");
    const [file, setFile] = useState<File | null>(null);
    const [lastOutput, setLastOutput] = useState<{ text: string, isError: boolean } | null>(null);

    // Helpers to handle output updates
    const handleSuccess = (title: string, text: string) => {
        setLastOutput({ text, isError: false });
        onResult(`**${title}**\n\n${text}`);
    };

    const handleError = (err: any) => {
        const msg = err?.message || String(err);
        setLastOutput({ text: "Error: " + msg, isError: true });
        // onResult(`**❌ Error**\n\n${msg}`); // Optional: send error to chat? Maybe loop spam if auto retry.
    };

    return (
        <div className="p-4 space-y-3 border-t border-gray-700 bg-[#0f0f0f]">
            <h3 className="text-sm opacity-60 font-semibold">🛠️ TOOLS</h3>

            {/* Web Search */}
            <div className="space-y-2">
                <input
                    placeholder="Search web or enter URL..."
                    className="w-full p-2 bg-[#1a1a1a] text-white rounded border border-gray-700 text-sm"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && query.trim()) {
                            setLastOutput({ text: "Searching...", isError: false });
                            fetch(apiUrl("/api/tools/call"), {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ tool: "browser", args: { q: query } }),
                            })
                                .then(r => {
                                    if (!r.ok) throw new Error(`Search failed: ${r.status} ${r.statusText}`);
                                    return r.json();
                                })
                                .then(d => {
                                    if (d.error) throw new Error(d.error);
                                    const summary = d.result?.summary || "No results found.";
                                    handleSuccess("🔎 Search Result", summary);
                                })
                                .catch(handleError);
                        }
                    }}
                />
                <button
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white p-2 rounded text-sm transition"
                    onClick={() => {
                        if (query.trim()) {
                            setLastOutput({ text: "Searching...", isError: false });
                            fetch(apiUrl("/api/tools/call"), {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ tool: "browser", args: { q: query } }),
                            })
                                .then(r => {
                                    if (!r.ok) throw new Error(`Search failed: ${r.status} ${r.statusText}`);
                                    return r.json();
                                })
                                .then(d => {
                                    if (d.error) throw new Error(d.error);
                                    const summary = d.result?.summary || "No results found.";
                                    handleSuccess("🔎 Search Result", summary);
                                })
                                .catch(handleError);
                        }
                    }}
                >
                    🔎 Search Web
                </button>
            </div>

            {/* Code Runner */}
            <div className="space-y-2 pt-2 border-t border-gray-700">
                <select
                    value={lang}
                    onChange={(e) => setLang(e.target.value)}
                    className="w-full bg-[#1a1a1a] text-white p-2 rounded border border-gray-700 text-sm"
                >
                    <option value="python">Python</option>
                    <option value="js">JavaScript</option>
                </select>
                <textarea
                    placeholder={`Write ${lang === "python" ? "Python" : "JavaScript"} code...`}
                    className="w-full h-32 bg-[#1a1a1a] text-white p-2 rounded border border-gray-700 text-sm font-mono"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                />
                <button
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white p-2 rounded text-sm transition"
                    onClick={async () => {
                        if (!code.trim()) return;
                        setLastOutput({ text: "Running...", isError: false });
                        try {
                            const res = await fetch(apiUrl("/api/tools/call"), {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ tool: "run", args: { lang, code } }),
                            });
                            if (!res.ok) throw new Error(`Code execution failed: ${res.status} ${res.statusText}`);
                            const data = await res.json();
                            const resultObj = data.result || {};
                            const outputText = resultObj.stdout || resultObj.stderr || resultObj.error || JSON.stringify(resultObj);

                            // Determine functionality error (stderr/error field)
                            // Note: stderr isn't always fatal (params might print to stderr), but usually implies warning/error.
                            const isErr = !!(resultObj.error || (resultObj.stderr && resultObj.stderr.trim().length > 0));

                            setLastOutput({ text: outputText, isError: isErr });
                            onResult(`**🛠️ Code Output**\n\`\`\`\n${outputText}\n\`\`\``);
                        } catch (e: any) {
                            handleError(e);
                        }
                    }}
                >
                    ▶️ Run Code
                </button>
            </div>

            {/* File Upload */}
            <div className="space-y-2 pt-2 border-t border-gray-700">
                <input
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="w-full p-2 bg-[#1a1a1a] text-white rounded border border-gray-700 text-sm"
                />
                <button
                    className="w-full bg-green-600 hover:bg-green-500 text-white p-2 rounded text-sm transition"
                    onClick={async () => {
                        if (!file) {
                            setLastOutput({ text: "Error: No file selected", isError: true });
                            return;
                        }
                        setLastOutput({ text: "Uploading & Summarizing...", isError: false });

                        try {
                            // 1. Upload
                            const form = new FormData();
                            form.append("file", file);
                            const upload = await fetch(apiUrl("/api/upload"), {
                                method: "POST",
                                body: form
                            });
                            if (!upload.ok) throw new Error(`Upload failed: ${upload.status} ${upload.statusText}`);
                            const up = await upload.json();
                            if (!up?.path) throw new Error(up.error || "Upload failed: No file path returned");

                            // 2. Summarize
                            const toolRes = await fetch(apiUrl("/api/tools/call"), {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ tool: "file", args: { filePath: up.path } }),
                            });
                            if (!toolRes.ok) throw new Error(`Summarize failed: ${toolRes.status} ${toolRes.statusText}`);
                            const data = await toolRes.json();
                            if (data.error) throw new Error(data.error);

                            const summary = data.result?.summary || "No summary available.";
                            handleSuccess("📁 File Summary", summary);

                        } catch (err: any) {
                            handleError(err);
                        }
                    }}
                >
                    📁 Summarize File
                </button>
            </div>

            {/* SHARED OUTPUT DISPLAY */}
            {lastOutput && (
                <div className="pt-2 border-t border-gray-700">
                    <div className="p-3 bg-[#111] rounded border border-gray-800">
                        <div className="text-purple-400 font-bold text-sm mb-2">
                            {lastOutput.isError ? "❌ Error" : "✓ Result"}
                        </div>
                        <div className={`text-sm whitespace-pre-wrap leading-relaxed ${lastOutput.isError ? "text-red-400" : "text-gray-300"}`}>
                            {lastOutput.text}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
