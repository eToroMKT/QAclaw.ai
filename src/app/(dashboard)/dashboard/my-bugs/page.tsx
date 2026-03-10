"use client";
import { useState, useEffect } from "react";

interface Bug {
  id: string; title: string; severity: string; status: string; createdAt: string;
  stepsToReproduce: string; expectedResult: string; actualResult: string;
}

const severityColors: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  major: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  minor: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  cosmetic: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export default function MyBugsPage() {
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/bugs/session/mine").then(r => r.json()).then(d => { setBugs(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-bold mb-8">My Bug Reports</h1>
      <div className="bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-8">
        {loading ? <p className="text-gray-500">Loading...</p> : bugs.length === 0 ? (
          <p className="text-gray-500">No bug reports submitted yet.</p>
        ) : (
          <div className="space-y-2">
            {bugs.map(b => (
              <div key={b.id}>
                <button onClick={() => setExpanded(expanded === b.id ? null : b.id)}
                  className="w-full flex items-center justify-between bg-gray-700/30 rounded-xl px-5 py-4 hover:bg-gray-700/50 transition-colors text-left">
                  <div className="flex-1">
                    <p className="font-medium text-white">{b.title}</p>
                    <p className="text-xs text-gray-400">{new Date(b.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${severityColors[b.severity] || severityColors.minor}`}>{b.severity}</span>
                    <span className="text-xs bg-gray-700/50 text-gray-300 px-2 py-1 rounded-full">{b.status}</span>
                  </div>
                </button>
                {expanded === b.id && (
                  <div className="bg-gray-700/20 rounded-b-xl px-5 py-4 mt-px space-y-2 text-sm">
                    {b.stepsToReproduce && <div><span className="text-gray-400">Steps:</span> <p className="text-gray-300 whitespace-pre-wrap">{b.stepsToReproduce}</p></div>}
                    {b.expectedResult && <div><span className="text-gray-400">Expected:</span> <p className="text-gray-300">{b.expectedResult}</p></div>}
                    {b.actualResult && <div><span className="text-gray-400">Actual:</span> <p className="text-gray-300">{b.actualResult}</p></div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
