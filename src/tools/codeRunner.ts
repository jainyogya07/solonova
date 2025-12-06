// src/tools/codeRunner.ts
import { exec } from "child_process";
import fs from "fs";

export async function codeRunner(args: { lang: string; code: string }) {
    return new Promise((resolve) => {
        const { lang, code } = args;

        const tmp =
            lang === "python"
                ? "/tmp/solonova.py"
                : "/tmp/solonova.js";

        const cmd =
            lang === "python"
                ? `python3 ${tmp}`
                : lang === "js"
                    ? `node ${tmp}`
                    : null;

        if (!cmd) return resolve({ error: "Unknown language" });

        fs.writeFileSync(tmp, code);

        exec(cmd, { timeout: 5000 }, (err, stdout, stderr) => {
            if (err) {
                return resolve({
                    error: err.message,
                    stderr,
                });
            }
            resolve({ stdout, stderr });
        });
    });
}
