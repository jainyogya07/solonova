
import { useState } from "react";

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
                            fetch("http://localhost:5174/api/tools/call", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ tool: "browser", args: { q: query } }),
                            })
                                .then(r => r.json())
                                .then(d => {
                                    if (d.error) throw new Error(d.error);
                                    handleSuccess("🔎 Search Result", JSON.stringify(d.result, null, 2));
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
                            fetch("http://localhost:5174/api/tools/call", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ tool: "browser", args: { q: query } }),
                            })
                                .then(r => r.json())
                                .then(d => {
                                    if (d.error) throw new Error(d.error);
                                    handleSuccess("🔎 Search Result", JSON.stringify(d.result, null, 2));
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
                            const res = await fetch("http://localhost:5174/api/tools/call", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ tool: "run", args: { lang, code } }),
                            });
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
                            const upload = await fetch("http://localhost:5174/api/upload", {
                                method: "POST",
                                body: form
                            });
                            const up = await upload.json();
                            if (!up.ok) throw new Error(up.error || "Upload failed");

                            // 2. Summarize
                            const toolRes = await fetch("http://localhost:5174/api/tools/call", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ tool: "file", args: { filePath: up.path } }),
                            });
                            const data = await toolRes.json();
                            if (data.error) throw new Error(data.error);

                            handleSuccess("📁 File Summary", JSON.stringify(data.result, null, 2));

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
                    <div className="p-2 bg-black rounded border border-gray-800 text-xs font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
                        <div className="text-gray-500 mb-1">Tool Output:</div>
                        <div className={lastOutput.isError ? "text-red-400" : "text-green-400"}>
                            {lastOutput.text}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
