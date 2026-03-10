"use client";
import { useState, useEffect } from "react";

interface Webhook { id: string; url: string; events: string; active: boolean; createdAt: string; }
interface Delivery { id: string; event: string; statusCode: number | null; success: boolean; deliveredAt: string; duration: number; retryCount: number; }

export default function WebhooksDashboard() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [deliveries, setDeliveries] = useState<Record<string, Delivery[]>>({});
  const [loading, setLoading] = useState(true);
  const [testUrl, setTestUrl] = useState("");
  const [testResult, setTestResult] = useState("");

  useEffect(() => {
    fetch("/api/v1/webhooks").then(r => r.json()).then(data => {
      const wh = Array.isArray(data) ? data : data.webhooks || [];
      setWebhooks(wh);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function loadDeliveries(whId: string) {
    const res = await fetch(`/api/v1/webhooks/${whId}/deliveries`);
    const data = await res.json();
    setDeliveries(prev => ({ ...prev, [whId]: data.deliveries || [] }));
  }

  async function testWebhook() {
    setTestResult("Sending...");
    try {
      const res = await fetch("/api/v1/webhooks/test", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: testUrl, secret: "test" }),
      });
      const data = await res.json();
      setTestResult(data.success ? `✅ Success (${data.statusCode})` : `❌ Failed: ${data.error || data.statusCode}`);
    } catch (e: any) { setTestResult("❌ " + e.message); }
  }

  if (loading) return <div className="text-gray-500">Loading...</div>;

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Webhooks</h1>

      {/* Test Webhook */}
      <div className="bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">Test Webhook URL</h2>
        <div className="flex gap-3">
          <input value={testUrl} onChange={e => setTestUrl(e.target.value)} placeholder="https://example.com/webhook"
            className="flex-1 bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500/50" />
          <button onClick={testWebhook}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all">
            Send Test Ping
          </button>
        </div>
        {testResult && <p className="mt-2 text-sm">{testResult}</p>}
      </div>

      {/* Registered Webhooks */}
      {webhooks.length === 0 ? (
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-6 text-gray-500">
          No webhooks registered. Use the API to create one.
        </div>
      ) : (
        <div className="space-y-4">
          {webhooks.map(wh => {
            const events: string[] = (() => { try { return JSON.parse(wh.events); } catch { return []; } })();
            const dels = deliveries[wh.id];
            const successRate = dels && dels.length > 0
              ? Math.round((dels.filter(d => d.success).length / dels.length) * 100)
              : null;

            return (
              <div key={wh.id} className="bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white font-medium break-all">{wh.url}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {events.map(e => (
                        <span key={e} className="text-xs bg-gray-700/50 text-gray-300 px-2 py-1 rounded-full">{e}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {successRate !== null && (
                      <span className={`text-sm font-medium ${successRate >= 90 ? "text-blue-400" : successRate >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                        {successRate}% success
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs ${wh.active ? "bg-blue-500/20 text-blue-400" : "bg-red-500/20 text-red-400"}`}>
                      {wh.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <button onClick={() => loadDeliveries(wh.id)} className="text-sm text-blue-400 hover:underline">
                  {dels ? "Refresh deliveries" : "Load delivery history"}
                </button>
                {dels && dels.length > 0 && (
                  <div className="mt-3 space-y-1 max-h-48 overflow-y-auto">
                    {dels.slice(0, 20).map(d => (
                      <div key={d.id} className="flex items-center justify-between text-sm bg-gray-700/30 rounded px-3 py-2">
                        <span className="text-gray-300">{d.event}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-500">{d.duration}ms</span>
                          {d.retryCount > 0 && <span className="text-yellow-400 text-xs">retry #{d.retryCount}</span>}
                          <span className={d.success ? "text-blue-400" : "text-red-400"}>
                            {d.statusCode || "err"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
