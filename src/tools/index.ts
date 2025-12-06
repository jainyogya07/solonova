// src/tools/index.ts
import { browserTool } from "./browserTool";
import { fileTool } from "./fileTool";
import { codeRunner } from "./codeRunner";
import { visionTool } from "./visionTool";

import { codeFixTool } from "./codeFix";

export const toolRegistry: Record<string, (args: any) => Promise<any>> = {
    browser: browserTool,
    file: fileTool,
    run: codeRunner,
    vision: visionTool,
    codefix: codeFixTool,
};

export async function callTool(name: string, args: any) {
    const fn = toolRegistry[name];
    if (!fn) throw new Error(`Tool not found: ${name}`);
    return await fn(args);
}
