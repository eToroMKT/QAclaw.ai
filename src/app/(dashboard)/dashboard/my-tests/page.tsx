"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Execution {
  id: string; status: string; startedAt: string; completedAt: string | null;
  cycle: { id: string; title: string; priority: string; stepsJson: string; project: { name: string; slug: string; }; };
}

const statusColors: Record<string, string> = {
  claimed: "bg-blue-500/20 text-blue-400",
  in_progress: "bg-yellow-500/20 text-yellow-400",
  submitted: "bg-blue-500/20 text-blue-400",
};

export default function MyTestsPage() {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/my-tests").then(r => r.json()).then(d => { setExecutions(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">My Tests</h1>
      <div className="bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-8">
        {loading ? <p className="text-gray-500">Loading...</p> : executions.length === 0 ? (
          <p className="text-gray-500">No tests claimed yet. <Link href="/dashboard/browse-tests" className="text-blue-400 hover:underline">Browse available tests</Link></p>
        ) : (
          <div className="space-y-3">
            {executions.map(e => {
              let stepCount = 0; try { stepCount = JSON.parse(e.cycle.stepsJson).length; } catch {}
              return (
                <Link key={e.id} href={`/dashboard/my-tests/${e.id}`}
                  className="flex items-center justify-between bg-gray-700/30 rounded-xl px-5 py-4 hover:bg-gray-700/50 transition-colors block">
                  <div>
                    <p className="font-medium text-white">{e.cycle.title}</p>
                    <p className="text-sm text-gray-400">{e.cycle.project.name} · {stepCount} steps · Started {new Date(e.startedAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColors[e.status] || "bg-gray-700/50 text-gray-400"}`}>
                    {e.status.replace(/_/g, " ")}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
