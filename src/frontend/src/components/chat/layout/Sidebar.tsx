// src/frontend/src/components/layout/Sidebar.tsx

import { useNavigate } from "react-router-dom";

export default function Sidebar({
  onAction,
  onDemo,
}: {
  onAction: (type: string) => void;
  onDemo: () => void;
}) {
  const navigate = useNavigate();

  return (
    <div className="h-full w-64 glass shadow-soft p-4 flex flex-col text-white border border-[#ffffff12]">

      {/* LOGO */}
      <div
        className="text-2xl bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text font-bold cursor-pointer mb-8"
        onClick={() => navigate("/")}
      >
        Solonova
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col gap-3 mb-8">
        <div className="text-xs opacity-60 tracking-wide">ACTIONS</div>

        <button
          onClick={() => onAction("idea")}
          className="w-full px-3 py-2 text-left rounded-md bg-[#1a1a1a] hover:bg-[#252525] transition border border-gray-700"
        >
          💡 Generate Idea
        </button>

        <button
          onClick={() => onAction("plan")}
          className="w-full px-3 py-2 text-left rounded-md bg-[#1a1a1a] hover:bg-[#252525] transition border border-gray-700"
        >
          🧭 Build Plan
        </button>

        <button
          onClick={() => onAction("code")}
          className="w-full px-3 py-2 text-left rounded-md bg-[#1a1a1a] hover:bg-[#252525] transition border border-gray-700"
        >
          🧩 Generate Code
        </button>

        <button
          onClick={() => onAction("optimize")}
          className="w-full px-3 py-2 text-left rounded-md bg-[#1a1a1a] hover:bg-[#252525] transition border border-gray-700"
        >
          ⚙️ Optimize via GPU
        </button>
      </div>

      {/* Demo */}
      <div className="flex flex-col mb-8">
        <div className="text-xs opacity-60 mb-1 tracking-wide">DEMO</div>

        <button
          onClick={onDemo}
          className="w-full px-3 py-2 text-left rounded-md bg-purple-700 hover:bg-purple-600 transition"
        >
          ⚡ One-Click Killer Demo
        </button>
      </div>

      {/* Settings */}
      <div className="mt-auto">
        <div className="text-xs opacity-60 tracking-wide mb-2">SETTINGS</div>

        <button className="w-full px-3 py-2 text-left mb-2 rounded-md bg-[#1a1a1a] border border-gray-700 hover:bg-[#252525] cursor-pointer">
          🧠 Memory Viewer (soon)
        </button>

        <button className="w-full px-3 py-2 text-left rounded-md bg-[#1a1a1a] border border-gray-700 hover:bg-[#252525] cursor-pointer">
          ⚙️ Preferences (soon)
        </button>
      </div>

    </div>
  );
}