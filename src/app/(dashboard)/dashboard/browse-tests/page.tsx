"use client";
import { useState, useEffect } from "react";

interface TestCycle {
  id: string; title: string; priority: string; status: string;
  stepsJson: string; deviceReqs: string;
  project: { id: string; name: string; slug: string; };
}

const priorityColors: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  normal: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  low: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export default function BrowseTestsPage() {
  const [cycles, setCycles] = useState<TestCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/v1/test-cycles?status=open")
      .then(r => r.json())
      .then(d => { setCycles(Array.isArray(d) ? d.filter((c: TestCycle) => c.status === "open") : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function claim(cycleId: string) {
    setClaiming(cycleId);
    setMessage("");
    const res = await fetch("/api/test-cycles/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cycleId }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage("Test claimed! Go to My Tests to start.");
      setCycles(cycles.filter(c => c.id !== cycleId));
    } else {
      setMessage(data.error || "Failed to claim");
    }
    setClaiming(null);
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Browse Available Tests</h1>
      <p className="text-gray-400 text-sm mb-6">Claim up to 3 active tests at a time.</p>
      {message && <div className="mb-4 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-blue-400 text-sm">{message}</div>}

      {loading ? <p className="text-gray-500">Loading...</p> : cycles.length === 0 ? (
        <div className="bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-8">
          <p className="text-gray-500">No open tests available right now.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {cycles.map(c => {
            let stepCount = 0; try { stepCount = JSON.parse(c.stepsJson).length; } catch {}
            let devices: string[] = []; try { devices = JSON.parse(c.deviceReqs); } catch {}
            return (
              <div key={c.id} className="bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{c.project.name}</p>
                    <h3 className="text-lg font-semibold text-white mb-2">{c.title}</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${priorityColors[c.priority] || priorityColors.normal}`}>{c.priority}</span>
                      <span className="text-xs bg-gray-700/50 text-gray-300 px-2 py-1 rounded-full">{stepCount} steps</span>
                    </div>
                    {devices.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {devices.map(d => <span key={d} className="text-xs bg-gray-700/50 text-gray-400 px-2 py-0.5 rounded-full">{d}</span>)}
                      </div>
                    )}
                  </div>
                  <button onClick={() => claim(c.id)} disabled={claiming === c.id}
                    className="px-5 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-blue-400 hover:to-blue-500 transition-all disabled:opacity-50">
                    {claiming === c.id ? "Claiming..." : "Claim This Test"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
