"use client";
import { useState, useEffect } from "react";

interface ApiKeyInfo {
  id: string;
  keyPrefix: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadKeys() {
    const res = await fetch("/api/api-keys");
    if (res.ok) setKeys(await res.json());
    setLoading(false);
  }

  useEffect(() => { loadKeys(); }, []);

  async function createKey() {
    const res = await fetch("/api/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newKeyName || "Unnamed Key" }),
    });
    if (res.ok) {
      const data = await res.json();
      setCreatedKey(data.key);
      setNewKeyName("");
      loadKeys();
    }
  }

  async function revokeKey(id: string) {
    await fetch(`/api/api-keys?id=${id}`, { method: "DELETE" });
    loadKeys();
  }

  function copyKey() {
    if (createdKey) navigator.clipboard.writeText(createdKey);
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">API Keys</h1>

      {createdKey && (
        <div className="mb-6 bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
          <p className="text-blue-400 font-semibold mb-2">🔑 New API Key Created</p>
          <p className="text-xs text-gray-400 mb-3">Copy this key now — you won&apos;t see it again!</p>
          <div className="flex gap-2">
            <code className="flex-1 bg-gray-900/50 rounded-lg px-4 py-3 text-sm text-blue-300 font-mono break-all">{createdKey}</code>
            <button onClick={copyKey} className="px-4 py-2 bg-gray-700 rounded-lg text-sm hover:bg-gray-600 transition">Copy</button>
          </div>
          <button onClick={() => setCreatedKey(null)} className="mt-3 text-sm text-gray-500 hover:text-gray-300">Dismiss</button>
        </div>
      )}

      <div className="bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-8 mb-6">
        <h2 className="text-xl font-semibold mb-4">Create New Key</h2>
        <div className="flex gap-3">
          <input
            value={newKeyName}
            onChange={e => setNewKeyName(e.target.value)}
            placeholder="Key name (e.g., Production)"
            className="flex-1 bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500/50"
          />
          <button onClick={createKey}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-400 hover:to-blue-500 transition-all">
            Generate
          </button>
        </div>
      </div>

      <div className="bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-8">
        <h2 className="text-xl font-semibold mb-4">Active Keys</h2>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : keys.length === 0 ? (
          <p className="text-gray-500">No API keys yet.</p>
        ) : (
          <div className="space-y-3">
            {keys.map(k => (
              <div key={k.id} className="flex items-center justify-between bg-gray-700/30 rounded-xl px-5 py-4">
                <div>
                  <p className="font-medium">{k.name}</p>
                  <p className="text-sm text-gray-400 font-mono">{k.keyPrefix}</p>
                  <p className="text-xs text-gray-500">Created {new Date(k.createdAt).toLocaleDateString()}</p>
                </div>
                <button onClick={() => revokeKey(k.id)} className="text-sm text-red-400 hover:text-red-300 transition">Revoke</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
