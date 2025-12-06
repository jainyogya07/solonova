import { useRef, useEffect, useState } from "react";
import useSolonova from "../hooks/useSolonova";
import ChatBox from "../components/chat/ChatBox";
import ChatInput from "../components/chat/ChatInput";
import Sidebar from "../components/chat/layout/Sidebar";
import DevPanel from "../components/dev/DevPanel";
import ToolPanel from "../components/ToolPanel";
import VisionPanel from "../components/VisionPanel";

export default function ChatPage() {
  const { messages, loading, lastLatency, sendMessageStream, addMessage } = useSolonova();

  const bottomRef = useRef<HTMLDivElement | null>(null);
  // Right Panel State: "hidden" | "dev" | "tools" | "vision"
  const [rightPanel, setRightPanel] = useState<"hidden" | "dev" | "tools" | "vision">("hidden");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Sidebar Handlers
  const handleAction = (type: string) => {
    sendMessageStream(`Run action: ${type}`, { type: type as any, userId: "demo-user" });
  };
  const handleDemo = () => {
    sendMessageStream("Running Demo...", { type: "chat", userId: "demo-user" });
  };

  return (
    <div className="w-screen h-screen flex bg-black text-white overflow-hidden font-sans">
      {/* LEFT SIDEBAR */}
      <Sidebar onAction={handleAction} onDemo={handleDemo} />

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col border-x border-gray-800 relative z-10">
        {/* HEADER */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-black/80 backdrop-blur">
          <div className="text-xl font-semibold tracking-tight">Solonova Workspace</div>

          <div className="flex gap-2 items-center text-sm opacity-70">
            {loading && <span className="text-purple-400 animate-pulse font-medium">Thinking…</span>}
            {lastLatency !== null && <span className="text-green-400 font-mono">{lastLatency} ms</span>}

            <div className="h-4 w-[1px] bg-gray-700 mx-2" />

            <button
              onClick={() => setRightPanel(rightPanel === "tools" ? "hidden" : "tools")}
              className={`px-3 py-1 border rounded transition-all ${rightPanel === "tools" ? "bg-blue-900/50 border-blue-600 text-blue-200" : "border-gray-800 hover:bg-gray-900 text-gray-400"}`}
            >
              Tools
            </button>
            <button
              onClick={() => setRightPanel(rightPanel === "vision" ? "hidden" : "vision")}
              className={`px-3 py-1 border rounded transition-all ${rightPanel === "vision" ? "bg-pink-900/50 border-pink-600 text-pink-200" : "border-gray-800 hover:bg-gray-900 text-gray-400"}`}
            >
              Ref
            </button>
            <button
              onClick={() => setRightPanel(rightPanel === "dev" ? "hidden" : "dev")}
              className={`px-3 py-1 border rounded transition-all ${rightPanel === "dev" ? "bg-gray-800 border-gray-600 text-white" : "border-gray-800 hover:bg-gray-900 text-gray-400"}`}
            >
              Dev
            </button>
          </div>
        </div>

        {/* CHAT BODY */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <ChatBox
            messages={messages}
            loading={loading}
            onToolResult={(title, content) => addMessage("assistant", `**${title}**\n${content}`)}
          />
          <div ref={bottomRef} />
        </div>

        {/* INPUT */}
        <div className="p-4 border-t border-gray-800 bg-black">
          <ChatInput onSend={(msg) => sendMessageStream(msg, { userId: "demo-user" })} />
        </div>
      </div>

      {/* RIGHT COLLAPSIBLE PANEL */}
      {rightPanel !== "hidden" && (
        <div className="w-[360px] border-l border-gray-800 bg-[#0d0d0d] shadow-2xl z-20 flex flex-col h-full overflow-hidden">
          {rightPanel === "dev" && <DevPanel />}
          {rightPanel === "tools" && (
            <ToolPanel onResult={(res) => addMessage("assistant", res)} />
          )}
          {rightPanel === "vision" && (
            <VisionPanel onResult={(res) => addMessage("assistant", res)} />
          )}
        </div>
      )}
    </div>
  );
}