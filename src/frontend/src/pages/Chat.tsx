import { useRef, useEffect, useState } from "react";
import useSolonova from "../hooks/useSolonova";
import ChatBox from "../components/chat/ChatBox";
import ChatInput from "../components/chat/ChatInput";
import Sidebar from "../components/chat/layout/Sidebar";
import DevPanel from "../components/dev/DevPanel";
import ToolPanel from "../components/ToolPanel";
import VisionPanel from "../components/VisionPanel";

export default function ChatPage() {
  const { messages, loading, lastLatency, sendMessageStream, addMessage, reset } = useSolonova();

  const bottomRef = useRef<HTMLDivElement | null>(null);
  // Right Panel State: "hidden" | "dev" | "tools" | "vision"
  const [rightPanel, setRightPanel] = useState<"hidden" | "dev" | "tools" | "vision">("hidden");
  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
  const handleNewChat = () => {
    reset();
  };

  return (
    <div className="w-screen h-screen flex bg-black text-white overflow-hidden font-sans">
      {/* LEFT SIDEBAR */}
      <div className={`fixed md:static inset-y-0 left-0 z-30 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <Sidebar 
          onAction={(type) => { handleAction(type); setSidebarOpen(false); }} 
          onDemo={() => { handleDemo(); setSidebarOpen(false); }} 
          onNewChat={() => { handleNewChat(); setSidebarOpen(false); }}
          onClose={() => setSidebarOpen(false)}
        />
      </div>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col border-x border-gray-800 relative z-10">
        {/* HEADER */}
        <div className="p-2 md:p-4 border-b border-gray-800 flex justify-between items-center bg-black/80 backdrop-blur">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 hover:bg-gray-800 rounded transition"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="text-lg md:text-xl font-semibold tracking-tight">Solonova Workspace</div>
          </div>

          <div className="flex gap-1 md:gap-2 items-center text-xs md:text-sm opacity-70">
            {loading && <span className="text-purple-400 animate-pulse font-medium hidden sm:inline">Thinking…</span>}
            {lastLatency !== null && <span className="text-green-400 font-mono hidden sm:inline">{lastLatency} ms</span>}

            <div className="h-4 w-[1px] bg-gray-700 mx-1 md:mx-2 hidden sm:block" />

            <button
              onClick={() => setRightPanel(rightPanel === "tools" ? "hidden" : "tools")}
              className={`px-2 md:px-3 py-1 border rounded transition-all text-xs md:text-sm ${rightPanel === "tools" ? "bg-blue-900/50 border-blue-600 text-blue-200" : "border-gray-800 hover:bg-gray-900 text-gray-400"}`}
            >
              <span className="hidden sm:inline">Tools</span>
              <span className="sm:hidden">🔧</span>
            </button>
            <button
              onClick={() => setRightPanel(rightPanel === "vision" ? "hidden" : "vision")}
              className={`px-2 md:px-3 py-1 border rounded transition-all text-xs md:text-sm ${rightPanel === "vision" ? "bg-pink-900/50 border-pink-600 text-pink-200" : "border-gray-800 hover:bg-gray-900 text-gray-400"}`}
            >
              <span className="hidden sm:inline">Ref</span>
              <span className="sm:hidden">👁</span>
            </button>
            <button
              onClick={() => setRightPanel(rightPanel === "dev" ? "hidden" : "dev")}
              className={`px-2 md:px-3 py-1 border rounded transition-all text-xs md:text-sm ${rightPanel === "dev" ? "bg-gray-800 border-gray-600 text-white" : "border-gray-800 hover:bg-gray-900 text-gray-400"}`}
            >
              <span className="hidden sm:inline">Dev</span>
              <span className="sm:hidden">⚙</span>
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
        <div className="p-2 md:p-4 border-t border-gray-800 bg-black">
          <ChatInput onSend={(msg) => sendMessageStream(msg, { userId: "demo-user" })} />
        </div>
      </div>

      {/* RIGHT COLLAPSIBLE PANEL */}
      {rightPanel !== "hidden" && (
        <div className="fixed md:static inset-y-0 right-0 w-full md:w-[360px] border-l border-gray-800 bg-[#0d0d0d] shadow-2xl z-20 flex flex-col h-full overflow-hidden">
          <div className="flex justify-between items-center p-2 md:hidden border-b border-gray-800">
            <span className="font-semibold capitalize">{rightPanel}</span>
            <button
              onClick={() => setRightPanel("hidden")}
              className="p-2 hover:bg-gray-800 rounded transition"
              aria-label="Close panel"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {rightPanel === "dev" && <DevPanel />}
          {rightPanel === "tools" && (
            <ToolPanel onResult={(res) => addMessage("assistant", res)} />
          )}
          {rightPanel === "vision" && (
            <VisionPanel onResult={(res) => addMessage("assistant", res)} />
          )}
        </div>
      )}
      {/* Mobile right panel overlay */}
      {rightPanel !== "hidden" && <div className="fixed inset-0 bg-black/50 z-10 md:hidden" onClick={() => setRightPanel("hidden")} />}
    </div>
  );
}