import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

      {/* Top nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">
          🦞 ClawQA.ai
        </span>
        <div className="hidden sm:flex items-center gap-6">
          <Link href="/docs/" className="text-sm text-gray-400 hover:text-white transition">Docs</Link>
          <Link href="/docs/for-agents.html" className="text-sm text-gray-400 hover:text-white transition">For Agents</Link>
          <Link href="/docs/for-testers.html" className="text-sm text-gray-400 hover:text-white transition">For Testers</Link>
          <Link href="/login" className="text-sm px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition">
            Sign in
          </Link>
        </div>
        <Link href="/login" className="sm:hidden text-sm px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition">
          Sign in
        </Link>
      </nav>

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto px-6 pt-16 pb-20">
        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-blue-400 to-blue-500 bg-clip-text text-transparent">
          AI Builds. Humans Verify.
        </h1>
        <p className="text-xl text-gray-400 mb-4 max-w-2xl">
          The API-first QA platform that connects AI coding agents with real human testers.
          Submit tests programmatically, get structured bug reports back, auto-fix, and ship faster.
        </p>
        <p className="text-gray-500 mb-10 max-w-xl">
          1M+ testers across 200+ countries on real devices.
        </p>

        <div className="flex gap-4 mb-16">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-400 hover:to-blue-500 transition-all shadow-lg shadow-blue-500/25"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            Get Started
          </Link>
          <Link
            href="/docs/"
            className="inline-flex items-center gap-2 px-8 py-4 border border-gray-600 text-gray-300 font-semibold rounded-xl hover:border-gray-400 hover:text-white transition-all"
          >
            📖 Read the Docs
          </Link>
        </div>

        {/* How it works */}
        <div className="w-full max-w-3xl mb-16">
          <h2 className="text-2xl font-bold text-white mb-8">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800/40 backdrop-blur border border-gray-700/50 rounded-xl p-6 text-left">
              <div className="text-3xl mb-3">🤖</div>
              <h3 className="font-bold text-white mb-2">1. AI Submits Tests</h3>
              <p className="text-sm text-gray-400">Your AI agent calls the ClawQA API with test steps and target URL. One API call.</p>
            </div>
            <div className="bg-gray-800/40 backdrop-blur border border-gray-700/50 rounded-xl p-6 text-left">
              <div className="text-3xl mb-3">🧪</div>
              <h3 className="font-bold text-white mb-2">2. Humans Test</h3>
              <p className="text-sm text-gray-400">Real testers on real devices across 200+ countries execute your tests. Bugs come back structured.</p>
            </div>
            <div className="bg-gray-800/40 backdrop-blur border border-gray-700/50 rounded-xl p-6 text-left">
              <div className="text-3xl mb-3">🔄</div>
              <h3 className="font-bold text-white mb-2">3. AI Auto-Fixes</h3>
              <p className="text-sm text-gray-400">Bug reports flow back via webhook. AI fixes the code, re-submits for verification. Loop closed.</p>
            </div>
          </div>
        </div>

        {/* The core loop code snippet */}
        <div className="w-full max-w-2xl mb-16 text-left">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">One API call to start testing</h2>
          <div className="bg-gray-900/80 border border-gray-700/50 rounded-xl p-6 font-mono text-sm overflow-x-auto">
            <div className="text-gray-500 mb-2"># Submit a test cycle</div>
            <div><span className="text-blue-400">curl</span> -X POST https://clawqa.ai/api/v1/test-cycles \</div>
            <div className="pl-4">-H <span className="text-yellow-300">{'"'}Authorization: Bearer clq_live_...{'"'}</span> \</div>
            <div className="pl-4">-d <span className="text-yellow-300">{"'{\"title\": \"Checkout Flow\", \"target_url\": \"https://myapp.dev\", \"steps\": [...]}'}"}</span></div>
            <div className="mt-4 text-gray-500"># Response</div>
            <div>{"{"} <span className="text-blue-400">{'"'}id{'"'}</span>: <span className="text-yellow-300">{'"'}cyc_abc123{'"'}</span>, <span className="text-blue-400">{'"'}status{'"'}</span>: <span className="text-yellow-300">{'"'}open{'"'}</span> {"}"}</div>
          </div>
        </div>

        {/* Active projects */}
        <div className="w-full max-w-3xl mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">Currently testing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-800/40 backdrop-blur border border-gray-700/50 rounded-xl p-5 flex items-center gap-4">
              <div className="text-3xl">🤖</div>
              <div>
                <h3 className="font-bold text-white">Clawdet</h3>
                <p className="text-sm text-gray-400">AI Telegram bot + web dashboard</p>
                <span className="text-xs text-blue-400">3 test cycles</span>
              </div>
            </div>
            <div className="bg-gray-800/40 backdrop-blur border border-gray-700/50 rounded-xl p-5 flex items-center gap-4">
              <div className="text-3xl">🦞</div>
              <div>
                <h3 className="font-bold text-white">ClawQA.AI</h3>
                <p className="text-sm text-gray-400">This platform — eating our own dogfood</p>
                <span className="text-xs text-blue-400">4 test cycles</span>
              </div>
            </div>
          </div>
        </div>

        {/* Docs links */}
        <div className="w-full max-w-3xl">
          <h2 className="text-2xl font-bold text-white mb-6">Documentation</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Link href="/docs/overview.html" className="bg-gray-800/30 border border-gray-700/40 rounded-lg p-4 hover:border-blue-500/40 transition text-left">
              <div className="text-lg mb-1">🔭</div>
              <div className="text-sm font-medium text-white">Overview</div>
              <div className="text-xs text-gray-500">What &amp; why</div>
            </Link>
            <Link href="/docs/architecture.html" className="bg-gray-800/30 border border-gray-700/40 rounded-lg p-4 hover:border-blue-500/40 transition text-left">
              <div className="text-lg mb-1">🏗️</div>
              <div className="text-sm font-medium text-white">Architecture</div>
              <div className="text-xs text-gray-500">Technical deep-dive</div>
            </Link>
            <Link href="/docs/phases.html" className="bg-gray-800/30 border border-gray-700/40 rounded-lg p-4 hover:border-blue-500/40 transition text-left">
              <div className="text-lg mb-1">📊</div>
              <div className="text-sm font-medium text-white">Roadmap</div>
              <div className="text-xs text-gray-500">12-phase plan</div>
            </Link>
            <Link href="/docs/for-agents.html" className="bg-gray-800/30 border border-gray-700/40 rounded-lg p-4 hover:border-blue-500/40 transition text-left">
              <div className="text-lg mb-1">🤖</div>
              <div className="text-sm font-medium text-white">For Agents</div>
              <div className="text-xs text-gray-500">API reference</div>
            </Link>
            <Link href="/docs/for-testers.html" className="bg-gray-800/30 border border-gray-700/40 rounded-lg p-4 hover:border-blue-500/40 transition text-left">
              <div className="text-lg mb-1">🧪</div>
              <div className="text-sm font-medium text-white">For Testers</div>
              <div className="text-xs text-gray-500">Earn crypto</div>
            </Link>
            <Link href="/docs/" className="bg-gray-800/30 border border-gray-700/40 rounded-lg p-4 hover:border-blue-500/40 transition text-left">
              <div className="text-lg mb-1">📚</div>
              <div className="text-sm font-medium text-white">All Docs</div>
              <div className="text-xs text-gray-500">Full hub</div>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-800 text-center text-sm text-gray-600">
          Built by <span className="text-gray-400">Claw 🦞</span> · 2026
        </div>
      </div>
    </div>
  );
}
