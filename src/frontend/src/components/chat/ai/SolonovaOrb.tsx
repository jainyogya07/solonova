// src/frontend/src/components/ai/SolonovaOrb.tsx

export default function SolonovaOrb({ active }: { active: boolean }) {
  return (
    <div className="relative flex items-center justify-center w-20 h-20">
      {/* Outer glow */}
      <div
        className={`absolute w-full h-full rounded-full blur-2xl transition-all duration-500 ${
          active
            ? "bg-purple-500/50 scale-110"
            : "bg-purple-700/20 scale-100"
        }`}
      ></div>

      {/* Inner orb */}
      <div
        className={`relative w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 shadow-lg transition-all duration-500 ${
          active ? "animate-pulse" : ""
        }`}
        style={{
          boxShadow: active
            ? "0 0 30px rgba(150, 80, 255, 0.7)"
            : "0 0 15px rgba(150, 80, 255, 0.3)",
        }}
      ></div>

      {/* Breathing shimmer */}
      <div className="absolute inset-0 rounded-full animate-spin-slow pointer-events-none opacity-20">
        <div className="w-full h-full rounded-full bg-gradient-to-r from-transparent via-white to-transparent"></div>
      </div>
    </div>
  );
}