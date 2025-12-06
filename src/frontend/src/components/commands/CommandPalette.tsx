// src/frontend/src/components/commands/CommandPalette.tsx

import { useEffect } from "react";

const ACTIONS = [
  { id: "idea", label: "💡 Generate Idea" },
  { id: "plan", label: "🧭 Build Plan" },
  { id: "code", label: "🧩 Generate Code" },
  { id: "optimize", label: "⚙️ Optimize via GPU" },
  { id: "demo", label: "⚡ Run Killer Demo Mode" },
  { id: "clear", label: "🗑️ Clear Chat" },
];

export default function CommandPalette({
  open,
  onClose,
  onAction,
}: {
  open: boolean;
  onClose: () => void;
  onAction: (id: string) => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[200] bg-black/50 backdrop-blur-sm">
      <div className="glass p-6 rounded-xl w-full max-w-md shadow-soft border border-[#ffffff20]">

        <h2 className="text-xl mb-4 text-center font-semibold">
          🔍 Solonova Command Palette
        </h2>

        <div className="flex flex-col gap-2">
          {ACTIONS.map((a) => (
            <button
              key={a.id}
              onClick={() => {
                onAction(a.id);
                onClose();
              }}
              className="w-full p-3 text-left rounded-md bg-[#1a1a1a] hover:bg-[#242424] border border-[#ffffff20] transition"
            >
              {a.label}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}