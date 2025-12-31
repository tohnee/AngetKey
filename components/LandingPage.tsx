import React from 'react';
import Editor from './Editor';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 font-bold tracking-tighter text-xl">
            <div className="w-5 h-5 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-sm"></div>
            <span>AgentKey</span>
          </div>
          <div className="flex items-center space-x-6 text-sm font-medium text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#playground" className="hover:text-white transition-colors">Playground</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
            <button 
              onClick={() => alert("This is a simulation. In the real version, this downloads the AgentKey-v1.0.dmg file.")}
              className="bg-white text-black px-4 py-2 rounded-full hover:bg-zinc-200 transition-colors font-bold"
            >
              Download v1.0
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-blue-500/10 to-transparent blur-3xl -z-10" />
        
        <div className="inline-flex items-center space-x-2 border border-blue-500/20 bg-blue-500/10 px-3 py-1 rounded-full text-blue-400 text-xs font-mono mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <span>Public Beta Live</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
          The OS-Level Input Layer <br /> for the AI Era.
        </h1>
        <p className="text-lg text-zinc-400 max-w-2xl mb-10 leading-relaxed">
          AgentKey is a <b>cursor-anchored</b> AI shell. It brings your agents (<span className="text-zinc-200">@coder</span>, <span className="text-zinc-200">@writer</span>) directly to where you type. Open Source, Local-First, and written in Rust.
        </p>

        <div className="flex items-center space-x-4">
          <button 
             onClick={() => document.getElementById('playground')?.scrollIntoView({ behavior: 'smooth' })}
             className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]"
          >
            Try Online Demo
          </button>
          <button 
             onClick={() => alert("Download started (Simulation)...")}
             className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-medium border border-white/5 transition-all"
          >
            Download .dmg
          </button>
        </div>
        
        <p className="mt-4 text-xs text-zinc-600">macOS 12+ (Apple Silicon & Intel) • Windows Coming Soon</p>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 border-t border-white/5 bg-zinc-900/20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400 mb-4 text-xl">🚀</div>
            <h3 className="text-xl font-bold mb-2">Native Performance</h3>
            <p className="text-zinc-400 text-sm">Built with Rust and Tauri. &lt; 10MB memory footprint. Instant startup with zero latency.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400 mb-4 text-xl">🔒</div>
            <h3 className="text-xl font-bold mb-2">BYOK & Privacy</h3>
            <p className="text-zinc-400 text-sm">Bring Your Own Key. Your data goes directly to OpenAI/Gemini. No middleman servers.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center text-green-400 mb-4 text-xl">🧠</div>
            <h3 className="text-xl font-bold mb-2">Context Memory</h3>
            <p className="text-zinc-400 text-sm">Use <code>//save</code> to carry context across apps. Move from VSCode to Slack without losing thought.</p>
          </div>
        </div>
      </section>

      {/* Playground Embed */}
      <section id="playground" className="py-20 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold mb-4">Web Playground</h2>
            <p className="text-zinc-400">Experience the core interaction loop in your browser before installing.</p>
          </div>
          
          <div className="rounded-xl overflow-hidden shadow-2xl border border-white/10 ring-4 ring-white/5 bg-[#09090b]">
             {/* We embed the Editor component here, slightly modified props could be passed if needed */}
             <Editor />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-white/5 text-center text-zinc-500 text-sm">
        <p>&copy; 2024 AgentKey Open Source. Distributed under MIT License.</p>
      </footer>
    </div>
  );
};

export default LandingPage;