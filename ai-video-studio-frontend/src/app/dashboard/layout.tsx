"use client";

import { UserButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();
  const [credits, setCredits] = useState(0);

  // Database se credits layega
  const fetchCredits = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`https://ugcvideogenerator.onrender.com/video/user-data/${userId}`);
      const data = await res.json();
      if (data.success) setCredits(data.credits);
    } catch (error) {
      console.error("Failed to fetch credits");
    }
  };

  // Aapko dev test ke liye free credits dega
  const handleDevRecharge = async () => {
    await fetch(`https://ugcvideogenerator.onrender.com/video/dev-recharge/${userId}`);
    fetchCredits();
    alert("💸 50 Test Credits Added Successfully!");
  };

  useEffect(() => {
    fetchCredits();
  }, [userId]);

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-white/10 bg-black/50 backdrop-blur-md hidden md:flex flex-col">
        <div className="h-20 flex items-center px-6 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold mr-2">U</div>
          <h1 className="text-xl font-bold">UGC Studio</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition">
            <span></span> Studio
          </Link>
            <Link href="/dashboard/advanced" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-medium transition">
            <span>🚀</span> Advanced Studio
          </Link>

          <Link href="/dashboard/gallery" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition">
            <span></span> My Gallery
          </Link>
        </nav>

        {/* Credits Display */}
        <div className="p-4 border-t border-white/10">
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-white/10 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-400 mb-1">Available Credits</p>
            <p className={`text-3xl font-bold ${credits < 10 ? "text-red-500" : "text-white"}`}>{credits}</p>
            <button className="mt-2 w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition">
              Upgrade Plan
            </button>
            <button onClick={handleDevRecharge} className="mt-3 text-[11px] text-gray-500 hover:text-white underline">
              [Dev] Add 50 Credits
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col relative overflow-y-auto">
        <header className="h-20 border-b border-white/10 bg-black/40 flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-xl font-semibold">AI Video Generator</h2>
          <div className="flex items-center gap-4">
            <div className={`hidden sm:flex items-center gap-2 border px-4 py-1.5 rounded-full text-sm font-medium ${credits < 10 ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-white/5 border-white/10'}`}>
              <span className="text-yellow-500">⚡</span> {credits} Credits
            </div>
            <UserButton />
          </div>
        </header>

        <div className="p-8 max-w-5xl mx-auto w-full relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}