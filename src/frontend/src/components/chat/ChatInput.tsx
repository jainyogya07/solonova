// src/frontend/src/components/chat/ChatInput.tsx

import { useState } from "react";

export default function ChatInput({
  onSend,
}: {
  onSend: (msg: string) => void;
}) {
  const [value, setValue] = useState("");

  const handleSend = () => {
    if (!value.trim()) return;
    onSend(value);      // ❗ Correct usage — parent decides what send does
    setValue("");
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full flex flex-col gap-2 p-3 border-t border-gray-700 bg-[#0f0f0f]">

      {/* SMART ACTIONS */}
      <div className="flex gap-2">
        <button
          className="text-xs bg-[#222] px-2 py-1 rounded hover:bg-[#333] transition"
          onClick={() => onSend("Explain this →")}
        >
          🧠 Explain
        </button>
        <button
          className="text-xs bg-[#222] px-2 py-1 rounded hover:bg-[#333] transition"
          onClick={() => onSend("Fix this code →")}
        >
          🔧 Fix Code
        </button>
        <button
          className="text-xs bg-[#222] px-2 py-1 rounded hover:bg-[#333] transition"
          onClick={() => onSend("Improve this →")}
        >
          ✨ Improve
        </button>
        <button
          className="text-xs bg-[#222] px-2 py-1 rounded hover:bg-[#333] transition"
          onClick={() => onSend("Write code for →")}
        >
          💻 Generate Code
        </button>
      </div>

      {/* INPUT AREA */}
      <div className="flex items-center gap-2">
        <textarea
          className="flex-1 resize-none bg-[#1a1a1a] text-white p-3 rounded-md outline-none border border-gray-700 rounded-lg"
          rows={1}
          placeholder="Ask Solonova…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-500 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}