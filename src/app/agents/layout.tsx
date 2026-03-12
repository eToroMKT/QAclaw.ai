import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Automated Test Results — ClawQA",
  description: "Visual gallery of Playwright E2E test screenshots for all projects",
};

export default function AgentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <span className="text-2xl">🧪</span>
            <span className="font-bold text-lg">ClawQA</span>
          </a>
          <nav className="flex items-center gap-6 text-sm text-gray-400">
            <a href="/agents" className="text-white font-medium">Test Results</a>
            <a href="/developers" className="hover:text-white transition">Developers</a>
            <a href="/dashboard" className="hover:text-white transition">Dashboard</a>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="border-t border-gray-800 py-6 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600 text-sm">
          QAClaw 🧪 — Automated visual testing powered by <a href="https://clawqa.ai" className="text-blue-400 hover:underline">ClawQA.ai</a>
        </div>
      </footer>
    </div>
  );
}
