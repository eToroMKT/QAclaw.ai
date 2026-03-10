"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleDemoLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      password,
      callbackUrl: "/dashboard",
      redirect: false,
    });
    if (res?.error) {
      setError("Invalid password");
      setLoading(false);
    } else if (res?.url) {
      window.location.href = res.url;
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" />
      <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />

      <div className="relative z-10 bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-10 max-w-md w-full mx-4">
        <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">
          ClawQA.ai
        </h1>
        <p className="text-gray-400 text-center mb-8">Sign in to continue</p>

        <button
          onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-700/50 border border-gray-600/50 rounded-xl hover:bg-gray-700 hover:border-blue-500/30 transition-all text-white font-medium"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
          Continue with GitHub
        </button>

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-gray-700" />
          <span className="text-gray-500 text-sm">or</span>
          <div className="flex-1 h-px bg-gray-700" />
        </div>

        <form onSubmit={handleDemoLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Demo Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full px-6 py-4 bg-blue-600/20 border border-blue-500/30 rounded-xl hover:bg-blue-600/30 hover:border-blue-500/50 transition-all text-blue-400 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign in with Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
