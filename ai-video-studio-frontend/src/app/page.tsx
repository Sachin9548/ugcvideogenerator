import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#050505] text-white overflow-hidden font-sans selection:bg-purple-500/30">
      {/* --- BACKGROUND GLOW EFFECTS (Animated) --- */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px] animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-pink-600/20 blur-[120px] animate-pulse pointer-events-none delay-1000"></div>

      {/* --- NAVBAR (Glassmorphism) --- */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-xl">
              U
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              UGC<span className="text-purple-400">Studio</span>
            </h1>
          </div>

          <div className="hidden md:flex space-x-8 text-sm font-medium text-gray-300">
            <Link href="#features" className="hover:text-white transition">
              Features
            </Link>
            <Link href="#how-it-works" className="hover:text-white transition">
              How it Works
            </Link>
            <Link href="#pricing" className="hover:text-white transition">
              Pricing
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {/* Agar user logged out hai */}
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="hidden md:block text-sm font-medium hover:text-white transition">
                  Sign In
                </button>
              </SignInButton>
              <SignInButton mode="modal">
                <button className="bg-white text-black px-5 py-2.5 rounded-full text-sm font-bold hover:bg-gray-200 transition transform hover:scale-105">
                  Get Started ✨
                </button>
              </SignInButton>
            </Show>

            {/* Agar user logged in hai */}
            <Show when="signed-in">
              <Link
                href="/dashboard"
                className="bg-white text-black px-5 py-2.5 rounded-full text-sm font-bold hover:bg-gray-200 transition transform hover:scale-105"
              >
                Dashboard
              </Link>
              {/* User ki profile picture aayegi */}
              <UserButton />
            </Show>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <main className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 max-w-7xl mx-auto text-center z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-purple-300 mb-8 backdrop-blur-sm shadow-2xl">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
          </span>
          UGC Studio AI Model is Live
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-8 leading-tight">
          Create{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 animate-gradient">
            Viral Videos
          </span>{" "}
          <br className="hidden md:block" />
          at the Speed of Thought.
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
          Generate breathtaking Cinematic or highly-engaging UGC style videos in
          30-60 seconds. Just type your prompt, select your assets, and let our
          AI handle the rest.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg hover:shadow-[0_0_40px_-10px_rgba(168,85,247,0.8)] transition-all transform hover:-translate-y-1"
          >
            Generate Video Now
          </Link>
          <Link
            href="#demo"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white font-bold text-lg hover:bg-white/10 transition-all"
          >
            Watch Demo 🎬
          </Link>
        </div>

        {/* --- DASHBOARD PREVIEW / MOCKUP --- */}
        <div className="mt-20 relative mx-auto max-w-5xl">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-500/20 to-transparent blur-3xl -z-10"></div>
          <div className="rounded-2xl border border-white/10 bg-black/50 p-2 md:p-4 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="aspect-video bg-[#0a0a0a] rounded-xl border border-white/5 flex flex-col items-center justify-center relative overflow-hidden group">
              {/* Fake UI Elements inside the Mockup */}
              <div className="absolute top-4 left-4 flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="absolute bottom-4 left-4 right-4 h-12 bg-white/5 rounded-lg border border-white/10 flex items-center px-4 backdrop-blur-md">
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-1/3 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                </div>
              </div>

              {/* Play Button */}
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 group-hover:scale-110 transition-transform cursor-pointer">
                <svg
                  className="w-8 h-8 text-white ml-2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <p className="mt-4 text-gray-400 font-medium">
                AI Processing: 30s UGC Style...
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* --- FEATURES SECTION --- */}
      <section
        id="features"
        className="py-24 px-6 max-w-7xl mx-auto relative z-10"
      >
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Powerful Features for Creators
          </h2>
          <p className="text-gray-400">
            Everything you need to scale your video production.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors backdrop-blur-sm group hover:-translate-y-2 duration-300">
            <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6 border border-purple-500/30 group-hover:bg-purple-500/40 transition">
              🎥
            </div>
            <h3 className="text-xl font-bold mb-3">Cinematic & UGC Styles</h3>
            <p className="text-gray-400 leading-relaxed">
              Choose between ultra-realistic cinematic shots or relatable,
              engaging UGC formats optimized for TikTok and Reels.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors backdrop-blur-sm group hover:-translate-y-2 duration-300">
            <div className="w-14 h-14 bg-pink-500/20 rounded-xl flex items-center justify-center mb-6 border border-pink-500/30 group-hover:bg-pink-500/40 transition">
              ⚡
            </div>
            <h3 className="text-xl font-bold mb-3">Asynchronous Engine</h3>
            <p className="text-gray-400 leading-relaxed">
              Don't wait around. Start generating, close the tab, and we'll
              notify you when your 4K video is ready for download.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors backdrop-blur-sm group hover:-translate-y-2 duration-300">
            <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6 border border-blue-500/30 group-hover:bg-blue-500/40 transition">
              💳
            </div>
            <h3 className="text-xl font-bold mb-3">Fair Credit System</h3>
            <p className="text-gray-400 leading-relaxed">
              Pay only for what you generate. Real-time credit deductions ensure
              you always know exactly what you're spending.
            </p>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-white/10 bg-black/50 py-12 mt-20 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-xs">
              U
            </div>
            <span className="text-lg font-bold">UGC Studio</span>
          </div>
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} UGC Studio AI. Built for creators.
          </p>
          <div className="flex space-x-4 text-gray-500">
            <Link href="#" className="hover:text-white transition">
              Twitter
            </Link>
            <Link href="#" className="hover:text-white transition">
              Discord
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
