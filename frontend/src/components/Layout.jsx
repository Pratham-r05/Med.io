import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { PanelLeftOpen } from 'lucide-react';
import Sidebar from './Sidebar';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen w-full bg-black text-slate-100 overflow-hidden relative">
      {/* Background animations */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute text-8xl text-blue-400 opacity-15 icon1 top-[10%] left-[10%] animate-float1">🩺</div>
        <div className="absolute text-8xl text-blue-400 opacity-15 icon2 top-[20%] left-[80%] animate-float2">💊</div>
        <div className="absolute text-8xl text-blue-400 opacity-15 icon3 top-[60%] left-[20%] animate-float3">🏥</div>
        <div className="absolute text-8xl text-blue-400 opacity-15 icon4 top-[70%] left-[70%] animate-float4">❤️</div>
        <div className="absolute text-8xl text-blue-400 opacity-15 icon5 top-[40%] left-[50%] animate-float5">🔬</div>
        <div className="absolute text-8xl text-blue-400 opacity-15 icon6 top-[85%] left-[40%] animate-float6">🩹</div>
      </div>
      
      {/* Sidebar Container */}
      <div className={`relative z-20 flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden shadow-[2px_0_10px_rgba(0,0,0,0.3)] ${
        isSidebarOpen ? 'w-80' : 'w-0'
      }`}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col h-full overflow-hidden bg-transparent">
        {/* Top Left Open Button (only visible when sidebar is closed) */}
        {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="absolute left-6 top-8 z-50 p-2 bg-slate-900/50 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all backdrop-blur-md hover:bg-slate-800"
          >
            <PanelLeftOpen size={20} />
          </button>
        )}

        <header className="pt-8 pb-4 px-8 text-center shrink-0 border-b border-white/[0.03]">
          <div className="inline-block mb-3 relative">
            <span className="text-5xl opacity-20 absolute -top-4 -left-6 blur-sm animate-pulse">🔬</span>
            <span className="text-4xl relative z-10">🔬</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-1 tracking-tight">
            How are you feeling today?
          </h1>
          <p className="text-slate-400 text-sm font-medium opacity-60">
            I'm here to help with your medical questions
          </p>
        </header>
        <div className="flex-1 min-h-0 overflow-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
