// src/frontend/src/components/chat/ChatBox.tsx
import type { SolonovaMessage } from "../../hooks/useSolonova";

interface ChatBoxProps {
  messages: SolonovaMessage[];
  loading: boolean;
  onToolResult?: (title: string, content: string) => void;
  onSend?: (text: string) => void; // Added for completeness if needed
}

export default function ChatBox({ messages, loading, onToolResult }: ChatBoxProps) {
  // Check if we're waiting for assistant response (user just sent message)
  const userTyping = messages[messages.length - 1]?.role === "user" && loading;

  return (
    <div className="w-full h-full overflow-y-auto p-4 space-y-4 bg-[#0b0b0b] text-white">

      {messages.map((m, index) => {
        const isAssistant = m.role === "assistant";
        const isLast = index === messages.length - 1;
        const isStreaming = isAssistant && isLast && loading;

        return (
          <div
            key={m.id}
            className={`max - w - 3xl p - 4 rounded - lg ${m.role === "user"
                ? "bg-[#222] border border-[#333]"
                : "bg-[#111] border border-purple-700/40"
              } `}
          >
            {/* HEADER */}
            <div className="text-xs opacity-60 mb-1">
              {m.role.toUpperCase()} • {new Date(m.timestamp).toLocaleTimeString()}
            </div>

            {/* BODY */}
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {m.content}

              {/* STREAMING CURSOR */}
              {isStreaming && (
                <span className="animate-pulse text-purple-400 ml-1">▮</span>
              )}
            </div>
            {/* detect code block and offer fix */}
            {/``` /.test(m.content) && (
              <div className="mt-2 text-right">
                <button
                  onClick={async () => {
                    const codeMatch = m.content.match(/```(?:\w*\n)?([\s\S]*?)```/);
                    const code = codeMatch ? codeMatch[1] : m.content;
                    // call codefix tool via /api/tools/call
                    // Note: We need to somehow inject the result back?
                    // The user provided code uses `sendMessage`. We don't have sendMessage in scope here easily?
                    // Actually, ChatBox is a dumb component. It doesn't have `sendMessage`.
                    // It receives `messages`.
                    // The provided code snippet: `sendMessage(...)`.
                    // So ChatBox likely needs `onFix` prop or I need to hack it.
                    // Or maybe it's not a dumb component?
                    // Let's check props.
                    // Current file has `messages`. `sendMessage` is not prop.
                    // But `onSend` is.
                    // I'll assume I can just use `onSend` to trigger a user request to fix it?
                    // OR, I can fetch directly and then call `onSend` with the result?
                    // User snippet: `sendMessage("**Auto-Fix Result**...", ...)`
                    // I will use `onSend` if available, or fetch and alerts.
                    // Wait, `onSend` usually usually takes user text.
                    // If I modify ChatBox to take `onFix` or similar?
                    // The user said: "Inside ChatBox component... sendMessage(...)".
                    // Code snippet implies `sendMessage` is available.
                    // If `ChatBox` doesn't have it, I should modify `Chat.tsx` pass it or use `onSend`.

                    // Actually, looking at `ChatBox.tsx` content (I viewed it earlier):
                    // It receives `messages, loading, onSend`.
                    // It DOES NOT receive `sendMessage`.
                    // I will use `onSend` to effectively send the fix result as if the user typed it?
                    // No, that's weird.
                    // I'll add `onFix` callback prop to ChatBox and let `Chat.tsx` handle it?
                    // The user said "Just the code you drop in".
                    // I'll assume I should modify usage.
                    // But to be fast, I'll just use `alert` for now or try to use `onSend`.
                    // User snippet seems to suggest `sendMessage` IS valid.
                    // Maybe `ChatBox` is inside `Chat.tsx`? No, it's separate file.
                    // I'll trust the user instructions and try to assume `sendMessage` context is something I missed?
                    // Or maybe I update `ChatBox` to accept `sendMessage` prop.

                    try {
                      const r = await fetch("/api/tools/call", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ tool: "codefix", args: { code, lang: "auto" } })
                      });
                      const d = await r.json();
                      const result = d?.result;
                      const fixed = result?.fixedCode ?? JSON.stringify(result);

                      if (onToolResult) {
                        onToolResult("Code Auto-Fix", "```typescript\n" + fixed + "\n```");
                      } else {
                        alert("Fix Result:\n" + fixed);
                      }
                    } catch (e) {
                      alert("Fix failed: " + e);
                    }
                  }}
                  className="px-2 py-1 bg-yellow-900/50 hover:bg-yellow-800 text-yellow-200 rounded text-xs border border-yellow-700/50 transition"
                >
                  🔧 Fix Code
                </button>
              </div>
            )}
          </div >
        );
      })}

      {/* USER TYPING INDICATOR */}
      {
        userTyping && (
          <div className="max-w-3xl p-4 rounded-lg bg-[#222] border border-[#333]">
            <div className="text-xs opacity-60 mb-1">USER • typing…</div>
            <div className="flex gap-1">
              <span className="animate-pulse">●</span>
              <span className="animate-pulse delay-150">●</span>
              <span className="animate-pulse delay-300">●</span>
            </div>
          </div>
        )
      }

    </div >
  );
}