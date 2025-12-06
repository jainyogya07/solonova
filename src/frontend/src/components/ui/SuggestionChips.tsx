// src/frontend/src/components/ui/SuggestionChips.tsx

export type Suggestion = {
  id: string;
  label: string;      // short chip text
  prompt: string;     // full prompt sent to Solonova
  kind?: "quick" | "workflow" | "memory";
};

export default function SuggestionChips({
  suggestions,
  onSelect,
  className = "",
}: {
  suggestions: Suggestion[];
  onSelect: (s: Suggestion) => void;
  className?: string;
}) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className={`w-full flex flex-wrap gap-2 ${className}`}>
      {suggestions.map((s) => (
        <button
          key={s.id}
          onClick={() => {
            try {
              // lightweight analytics point
              console.log("[Solonova] suggestion.clicked", { id: s.id, label: s.label });
            } catch { }
            onSelect(s);
          }}
          className="px-3 py-1.5 text-sm rounded-full glass border border-[#ffffff14] hover:scale-[1.02] transition flex items-center gap-2"
          title={s.prompt}
        >
          <span className="opacity-90">{s.label}</span>
        </button>
      ))}
    </div>
  );
}