// src/frontend/src/components/layout/Sidebar.tsx

import { useNavigate } from "react-router-dom";

export default function Sidebar({
  onAction,
  onDemo,
  onNewChat,
  onClose,
}: {
  onAction: (type: string) => void;
  onDemo: () => void;
  onNewChat: () => void;
  onClose?: () => void;
}) {
  const navigate = useNavigate();

  return (
    <div className="h-full w-64 glass shadow-soft p-3 md:p-4 flex flex-col text-white border border-[#ffffff12] bg-black/95 md:bg-transparent">

      {/* LOGO */}
      <div className="flex items-center justify-between mb-4 md:mb-8">
        <div
          className="text-xl md:text-2xl bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text font-bold cursor-pointer"
          onClick={() => navigate("/")}
        >
          Solonova
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1 hover:bg-gray-800 rounded transition"
            aria-label="Close sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* New Chat Button */}
      <button
        onClick={onNewChat}
        className="w-full px-3 py-2 mb-4 md:mb-6 text-left rounded-md bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition font-medium border border-purple-500/50 text-sm md:text-base"
      >
        ➕ New Chat
      </button>

      {/* Quick Actions */}
      <div className="flex flex-col gap-2 md:gap-3 mb-6 md:mb-8">
        <div className="text-xs opacity-60 tracking-wide">ACTIONS</div>

        <button
          onClick={() => onAction("idea")}
          className="w-full px-2 md:px-3 py-1.5 md:py-2 text-left rounded-md bg-[#1a1a1a] hover:bg-[#252525] transition border border-gray-700 text-sm md:text-base"
        >
          💡 Generate Idea
        </button>

        <button
          onClick={() => onAction("plan")}
          className="w-full px-2 md:px-3 py-1.5 md:py-2 text-left rounded-md bg-[#1a1a1a] hover:bg-[#252525] transition border border-gray-700 text-sm md:text-base"
        >
          🧭 Build Plan
        </button>

        <button
          onClick={() => onAction("code")}
          className="w-full px-2 md:px-3 py-1.5 md:py-2 text-left rounded-md bg-[#1a1a1a] hover:bg-[#252525] transition border border-gray-700 text-sm md:text-base"
        >
          🧩 Generate Code
        </button>

        <button
          onClick={() => onAction("optimize")}
          className="w-full px-2 md:px-3 py-1.5 md:py-2 text-left rounded-md bg-[#1a1a1a] hover:bg-[#252525] transition border border-gray-700 text-sm md:text-base"
        >
          ⚙️ Optimize via GPU
        </button>
      </div>

      {/* Demo */}
      <div className="flex flex-col mb-6 md:mb-8">
        <div className="text-xs opacity-60 mb-1 tracking-wide">DEMO</div>

        <button
          onClick={onDemo}
          className="w-full px-2 md:px-3 py-1.5 md:py-2 text-left rounded-md bg-purple-700 hover:bg-purple-600 transition text-sm md:text-base"
        >
          ⚡ One-Click Killer Demo
        </button>
      </div>

      {/* Settings */}
      <div className="mt-auto">
        <div className="text-xs opacity-60 tracking-wide mb-2">SETTINGS</div>

        <button className="w-full px-2 md:px-3 py-1.5 md:py-2 text-left mb-2 rounded-md bg-[#1a1a1a] border border-gray-700 hover:bg-[#252525] cursor-pointer text-sm md:text-base">
          🧠 Memory Viewer (soon)
        </button>

        <button className="w-full px-2 md:px-3 py-1.5 md:py-2 text-left rounded-md bg-[#1a1a1a] border border-gray-700 hover:bg-[#252525] cursor-pointer text-sm md:text-base">
          ⚙️ Preferences (soon)
        </button>
      </div>

    </div>
  );
}