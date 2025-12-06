// src/frontend/src/pages/Landing.tsx

import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="w-screen h-screen bg-[#050505] text-white flex flex-col items-center justify-center relative overflow-hidden">

      {/* BACKGROUND GLOW */}
      <div className="absolute w-[600px] h-[600px] bg-purple-600 blur-[180px] opacity-20 rounded-full -top-40 -left-40"></div>
      <div className="absolute w-[500px] h-[500px] bg-blue-600 blur-[200px] opacity-20 rounded-full bottom-0 right-0"></div>

      {/* CONTENT */}
      <div className="relative z-10 text-center px-6 max-w-3xl">

        <h1 className="text-5xl font-bold tracking-wide mb-4 bg-gradient-to-r from-purple-400 via-fuchsia-300 to-blue-300 text-transparent bg-clip-text">
          Solonova
        </h1>

        <p className="text-lg opacity-80 leading-relaxed mb-8">
          Your ultra-low-latency solopreneur sidekick.  
          Generate ideas, build plans, write code, and optimize instantly —  
          powered by Cerebras, Gemini, and Vultr.
        </p>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mb-10">

          <div className="p-5 bg-[#101010] border border-gray-800 rounded-xl">
            <div className="text-purple-400 font-semibold text-lg mb-2">⚡ Ultra Fast</div>
            <div className="text-sm opacity-70">
              Cerebras + optimized routing delivers sub-second draft responses.
            </div>
          </div>

          <div className="p-5 bg-[#101010] border border-gray-800 rounded-xl">
            <div className="text-purple-400 font-semibold text-lg mb-2">🧠 Smart Workflows</div>
            <div className="text-sm opacity-70">
              Business plans, code generation, and reasoning with Gemini.
            </div>
          </div>

          <div className="p-5 bg-[#101010] border border-gray-800 rounded-xl">
            <div className="text-purple-400 font-semibold text-lg mb-2">🚀 GPU Optimization</div>
            <div className="text-sm opacity-70">
              Vultr GPU nodes for benchmarking, running & optimizing heavy code.
            </div>
          </div>

        </div>

        {/* CTA BUTTON */}
        <button
          onClick={() => navigate("/chat")}
          className="px-8 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-medium text-lg transition shadow-lg shadow-purple-900/40"
        >
          Launch Solonova →
        </button>
      </div>
    </div>
  );
}