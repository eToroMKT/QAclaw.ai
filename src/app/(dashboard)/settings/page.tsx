"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [role, setRole] = useState("tester");
  const [country, setCountry] = useState("");
  const [devices, setDevices] = useState("");
  const [languages, setLanguages] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // CrowdTesting settings
  const [crowdTestingKey, setCrowdTestingKey] = useState("");
  const [crowdTestingProduct, setCrowdTestingProduct] = useState("");
  const [crowdTestingAutoUrl, setCrowdTestingAutoUrl] = useState("https://prod-auto-api.cloud.crowdTesting.com:443/");
  const [crowdTestingPublicUrl, setCrowdTestingPublicUrl] = useState("https://prod-public-api.cloud.crowdTesting.com:443/");
  const [crowdTestingStatus, setCrowdTestingStatus] = useState<"checking" | "configured" | "not_configured">("checking");
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState("");

  useEffect(() => {
    fetch("/api/me").then(r => r.json()).then(data => {
        // Using new status endpoint
      if (data) {
        setRole(data.role || "tester");
        if (data.testerProfile) {
          setCountry(data.testerProfile.country || "");
          setDevices(JSON.parse(data.testerProfile.devices || "[]").join(", "));
          setLanguages(JSON.parse(data.testerProfile.languages || "[]").join(", "));
          setBio(data.testerProfile.bio || "");
        }
      }
    });
    fetch("/api/v1/crowdTesting/status")
      .then(r => r.json())
      .then(data => {
        // Using new status endpoint
        if (data.configured === false) setCrowdTestingStatus("not_configured");
        else if (data.configured && data.reachable) setCrowdTestingStatus("configured"); else setCrowdTestingStatus("not_configured");
      })
      .catch(() => setCrowdTestingStatus("not_configured"));
  }, []);

  async function handleSave() {
    setSaving(true); setMessage("");
    try {
      await fetch("/api/me", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, devices: devices.split(",").map(d => d.trim()).filter(Boolean), languages: languages.split(",").map(l => l.trim()).filter(Boolean), country, bio }),
      });
      await update();
      setMessage("Settings saved!");
    } catch { setMessage("Error saving settings"); }
    setSaving(false);
  }

  async function testConnection() {
    setTestingConnection(true);
    setConnectionResult("");
    try {
      const res = await fetch("/api/v1/crowdTesting/status");
      const data = await res.json();
      if (!data.configured) {
        setConnectionResult("❌ Not configured — set env vars on server");
      } else if (data.reachable) {
        setConnectionResult("✅ CrowdTesting is configured and reachable");
        setCrowdTestingStatus("configured");
      } else {
        setConnectionResult("⚠️ Configured but not reachable");
      }
    } catch (e: any) {
      setConnectionResult("❌ Connection failed: " + e.message);
    }
    setTestingConnection(false);
  }

  const user = session?.user;
  const inputClass = "w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500/50";

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      {/* Profile Section */}
      <div className="bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-8 mb-6">
        <h2 className="text-xl font-semibold mb-6">Profile</h2>
        <div className="flex items-center gap-4 mb-6">
          {user?.image && <Image src={user.image} alt="" width={64} height={64} className="rounded-full" />}
          <div>
            <p className="text-lg font-medium">{user?.name}</p>
            <p className="text-gray-400 text-sm">{user?.email}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Role</label>
            <select value={role} onChange={e => setRole(e.target.value)} className={inputClass}>
              <option value="tester">Tester</option>
              <option value="agent-owner">Agent Owner</option>
            </select>
          </div>
          {role === "tester" && (
            <>
              <div><label className="block text-sm text-gray-400 mb-2">Devices</label><input value={devices} onChange={e => setDevices(e.target.value)} placeholder="iPhone 15, Pixel 8" className={inputClass} /></div>
              <div><label className="block text-sm text-gray-400 mb-2">Languages</label><input value={languages} onChange={e => setLanguages(e.target.value)} placeholder="English, Spanish" className={inputClass} /></div>
              <div><label className="block text-sm text-gray-400 mb-2">Country</label><input value={country} onChange={e => setCountry(e.target.value)} placeholder="United States" className={inputClass} /></div>
              <div><label className="block text-sm text-gray-400 mb-2">Bio</label><textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Testing experience..." className={inputClass} /></div>
            </>
          )}
        </div>
        <button onClick={handleSave} disabled={saving}
          className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-400 hover:to-blue-500 transition-all disabled:opacity-50">
          {saving ? "Saving..." : "Save Settings"}
        </button>
        {message && <p className="mt-3 text-sm text-blue-400">{message}</p>}
      </div>

      {/* Testing Platform Integration Section */}
      <div className="bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Testing Platform Integration</h2>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            crowdTestingStatus === "configured" ? "bg-blue-500/20 text-blue-400" :
            crowdTestingStatus === "not_configured" ? "bg-gray-500/20 text-gray-400" :
            "bg-yellow-500/20 text-yellow-400"
          }`}>
            {crowdTestingStatus === "checking" ? "Checking..." : crowdTestingStatus === "configured" ? "✓ Connected" : "Not configured"}
          </span>
        </div>
        <p className="text-gray-400 text-sm mb-6">
          Connect to CrowdTesting to escalate test cycles to crowd testers. Uses the official CrowdTesting Automation API
          (prod-auto-api.cloud.crowdTesting.com).
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">API Key</label>
            <input type="password" value={crowdTestingKey} onChange={e => setCrowdTestingKey(e.target.value)}
              placeholder={crowdTestingStatus === "configured" ? "••••••••••••" : "API key not set"}
              className={inputClass} disabled />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Product ID</label>
            <input type="number" value={crowdTestingProduct} onChange={e => setCrowdTestingProduct(e.target.value)}
              placeholder={crowdTestingStatus === "configured" ? "Configured" : "Product ID not set"}
              className={inputClass} disabled />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Auto API URL</label>
            <input value={crowdTestingAutoUrl} onChange={e => setCrowdTestingAutoUrl(e.target.value)}
              className={inputClass} disabled />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Public API URL</label>
            <input value={crowdTestingPublicUrl} onChange={e => setCrowdTestingPublicUrl(e.target.value)}
              className={inputClass} disabled />
          </div>
        </div>
        <div className="mt-6 flex items-center gap-4">
          <button onClick={testConnection} disabled={testingConnection}
            className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-all disabled:opacity-50">
            {testingConnection ? "Testing..." : "Test Connection"}
          </button>
          {connectionResult && <span className="text-sm">{connectionResult}</span>}
        </div>
        <p className="text-gray-500 text-xs mt-4">
          ⚠️ Credentials are configured via environment variables on the server (TESTING_API_KEY, TESTING_PRODUCT_ID, TESTING_AUTO_API_URL, TESTING_PUBLIC_API_URL).
        </p>
      </div>
    </div>
  );
}
