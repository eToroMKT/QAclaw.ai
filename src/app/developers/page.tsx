"use client";
import { useState } from "react";
import Link from "next/link";

const endpoints = [
  { method: "GET", path: "/api/v1/projects", desc: "List all projects", auth: false,
    response: '[{"id":"...","name":"My App","slug":"my-app","testCycles":[...]}]' },
  { method: "GET", path: "/api/v1/test-cycles", desc: "List all test cycles", auth: false,
    response: '[{"id":"...","title":"Login Flow","status":"open","project":{...}}]' },
  { method: "POST", path: "/api/v1/test-cycles", desc: "Create a test cycle", auth: true,
    body: '{"projectId":"...","title":"Login Flow","targetUrl":"https://app.com","steps":[{"instruction":"Click login"}]}',
    response: '{"id":"...","title":"Login Flow","status":"open"}' },
  { method: "GET", path: "/api/v1/bugs", desc: "List bugs (optional ?cycleId=&severity=&status=&sortBy=priorityScore)", auth: false,
    response: '[{"id":"...","title":"Crash on login","severity":"critical","priorityScore":100}]' },
  { method: "POST", path: "/api/v1/bugs", desc: "Create a bug report", auth: true,
    body: '{"cycleId":"...","title":"Crash on login","severity":"critical","stepsToReproduce":"1. Click login","deviceInfo":{"os":"iOS 17"}}',
    response: '{"id":"...","title":"Crash on login","severity":"critical","priorityScore":115}' },
  { method: "POST", path: "/api/v1/bugs/:id/fix", desc: "Submit a fix for a bug", auth: true,
    body: '{"commitUrl":"https://github.com/...","notes":"Fixed null check"}',
    response: '{"id":"...","bugId":"...","status":"pending"}' },
  { method: "POST", path: "/api/v1/escalate", desc: "Escalate cycle to CrowdTesting crowd testing", auth: false,
    body: '{"cycleId":"...","reason":"Need human verification"}',
    response: '{"success":true,"runId":123,"estimatedTurnaround":"2-4 hours"}' },
  { method: "GET", path: "/api/v1/escalation-rules", desc: "List escalation rules (?projectId=)", auth: false,
    response: '[{"id":"...","condition":{"severity":"critical"},"action":"block-release"}]' },
  { method: "POST", path: "/api/v1/escalation-rules", desc: "Create an escalation rule", auth: true,
    body: '{"projectId":"...","condition":{"severity":"critical","device":"iOS"},"action":"notify","targetUrl":"https://hooks.slack.com/..."}',
    response: '{"id":"...","action":"notify"}' },
  { method: "POST", path: "/api/v1/webhooks", desc: "Register a webhook", auth: true,
    body: '{"url":"https://example.com/hook","events":["bug_report.created"]}',
    response: '{"id":"...","url":"...","secret":"whsec_..."}' },
  { method: "POST", path: "/api/mcp", desc: "MCP JSON-RPC endpoint (AI agent integration)", auth: true,
    body: '{"jsonrpc":"2.0","id":1,"method":"tools/list"}',
    response: '{"jsonrpc":"2.0","id":1,"result":{"tools":[...]}}' },
];

const webhookEvents = [
  { event: "bug_report.created", desc: "Fired when a new bug is reported", payload: '{"event":"bug_report.created","data":{"id":"...","title":"...","severity":"critical"},"timestamp":"..."}' },
  { event: "escalation.triggered", desc: "Fired when an escalation rule matches", payload: '{"event":"escalation.triggered","bug":{"id":"...","severity":"critical"}}' },
];

function TryItForm({ endpoint }: { endpoint: typeof endpoints[0] }) {
  const [apiKey, setApiKey] = useState("");
  const [body, setBody] = useState(endpoint.body || "");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const tryIt = async () => {
    setLoading(true);
    try {
      const headers: any = { "Content-Type": "application/json" };
      if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
      const opts: any = { method: endpoint.method, headers };
      if (endpoint.method === "POST" && body) opts.body = body;
      const res = await fetch(endpoint.path, opts);
      const text = await res.text();
      try { setResult(JSON.stringify(JSON.parse(text), null, 2)); } catch { setResult(text); }
    } catch (e: any) { setResult("Error: " + e.message); }
    setLoading(false);
  };

  return (
    <div className="mt-3 space-y-2">
      <input placeholder="API Key (Bearer token)" value={apiKey} onChange={e => setApiKey(e.target.value)}
        className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white font-mono" />
      {endpoint.method === "POST" && (
        <textarea value={body} onChange={e => setBody(e.target.value)} rows={4}
          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white font-mono" />
      )}
      <button onClick={tryIt} disabled={loading}
        className="px-4 py-2 bg-blue-600 hover:bg-green-700 rounded text-sm font-medium text-white disabled:opacity-50">
        {loading ? "Sending..." : "Send Request"}
      </button>
      {result && <pre className="bg-gray-950 border border-gray-700 rounded p-3 text-xs text-blue-400 overflow-x-auto max-h-60">{result}</pre>}
    </div>
  );
}

export default function DevelopersPage() {
  const [openEndpoint, setOpenEndpoint] = useState<number | null>(null);
  const [showPython, setShowPython] = useState(true);

  const pythonSDK = `import requests

class ClawQA:
    def __init__(self, api_key, base_url="https://clawqa.ai"):
        self.base = base_url
        self.headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    def list_projects(self):
        return requests.get(f"{self.base}/api/v1/projects", headers=self.headers).json()

    def list_cycles(self, project_id=None):
        url = f"{self.base}/api/v1/test-cycles"
        if project_id: url += f"?projectId={project_id}"
        return requests.get(url, headers=self.headers).json()

    def create_cycle(self, project_id, title, target_url, steps):
        return requests.post(f"{self.base}/api/v1/test-cycles", headers=self.headers,
            json={"projectId": project_id, "title": title, "targetUrl": target_url, "steps": steps}).json()

    def get_bugs(self, cycle_id=None, severity=None):
        params = {}
        if cycle_id: params["cycleId"] = cycle_id
        if severity: params["severity"] = severity
        return requests.get(f"{self.base}/api/v1/bugs", headers=self.headers, params=params).json()

    def create_bug(self, cycle_id, title, severity, **kwargs):
        return requests.post(f"{self.base}/api/v1/bugs", headers=self.headers,
            json={"cycleId": cycle_id, "title": title, "severity": severity, **kwargs}).json()

    def submit_fix(self, bug_id, commit_url="", notes=""):
        return requests.post(f"{self.base}/api/v1/bugs/{bug_id}/fix", headers=self.headers,
            json={"commitUrl": commit_url, "notes": notes}).json()

    def escalate(self, cycle_id, reason=""):
        return requests.post(f"{self.base}/api/v1/escalate", headers=self.headers,
            json={"cycleId": cycle_id, "reason": reason}).json()

# Usage:
# client = ClawQA("clq_live_your_key_here")
# projects = client.list_projects()`;

  const jsSDK = `class ClawQA {
  constructor(apiKey, baseUrl = "https://clawqa.ai") {
    this.base = baseUrl;
    this.headers = { Authorization: \`Bearer \${apiKey}\`, "Content-Type": "application/json" };
  }

  async listProjects() {
    const res = await fetch(\`\${this.base}/api/v1/projects\`, { headers: this.headers });
    return res.json();
  }

  async listCycles(projectId) {
    const url = projectId ? \`\${this.base}/api/v1/test-cycles?projectId=\${projectId}\` : \`\${this.base}/api/v1/test-cycles\`;
    return (await fetch(url, { headers: this.headers })).json();
  }

  async createCycle(projectId, title, targetUrl, steps) {
    return (await fetch(\`\${this.base}/api/v1/test-cycles\`, {
      method: "POST", headers: this.headers,
      body: JSON.stringify({ projectId, title, targetUrl, steps })
    })).json();
  }

  async getBugs(cycleId, severity) {
    const params = new URLSearchParams();
    if (cycleId) params.set("cycleId", cycleId);
    if (severity) params.set("severity", severity);
    return (await fetch(\`\${this.base}/api/v1/bugs?\${params}\`, { headers: this.headers })).json();
  }

  async createBug(cycleId, title, severity, opts = {}) {
    return (await fetch(\`\${this.base}/api/v1/bugs\`, {
      method: "POST", headers: this.headers,
      body: JSON.stringify({ cycleId, title, severity, ...opts })
    })).json();
  }

  async submitFix(bugId, commitUrl = "", notes = "") {
    return (await fetch(\`\${this.base}/api/v1/bugs/\${bugId}/fix\`, {
      method: "POST", headers: this.headers,
      body: JSON.stringify({ commitUrl, notes })
    })).json();
  }

  async escalate(cycleId, reason = "") {
    return (await fetch(\`\${this.base}/api/v1/escalate\`, {
      method: "POST", headers: this.headers,
      body: JSON.stringify({ cycleId, reason })
    })).json();
  }
}

// Usage:
// const client = new ClawQA("clq_live_your_key_here");
// const projects = await client.listProjects();`;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">ClawQA.ai</Link>
        <div className="flex gap-4">
          <Link href="/developers" className="text-blue-400 font-medium">Developers</Link>
          <Link href="/login" className="text-gray-400 hover:text-white">Login</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-2">Developer API</h1>
        <p className="text-gray-400 mb-8">Integrate ClawQA into your CI/CD pipeline, AI agents, or custom tools.</p>

        {/* Auth Guide */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">🔑 Authentication</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <p className="text-gray-300 mb-3">All authenticated endpoints require an API key passed as a Bearer token:</p>
            <pre className="bg-gray-950 rounded p-3 text-sm text-blue-400">Authorization: Bearer clq_live_your_key_here</pre>
            <p className="text-gray-400 text-sm mt-3">Generate API keys in the <Link href="/api-keys" className="text-blue-400 underline">dashboard</Link>.</p>
          </div>
        </section>

        {/* Rate Limiting */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">⏱ Rate Limiting</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-gray-300">
            <p><strong>100 requests per minute</strong> per API key (sliding window).</p>
            <p className="mt-2">Exceeding the limit returns <code className="text-red-400">429 Too Many Requests</code> with a <code>Retry-After</code> header.</p>
          </div>
        </section>

        {/* Endpoints */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">📡 API Endpoints</h2>
          <div className="space-y-3">
            {endpoints.map((ep, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <button onClick={() => setOpenEndpoint(openEndpoint === i ? null : i)}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-800/50">
                  <span className={`px-2 py-0.5 text-xs font-mono font-bold rounded ${ep.method === "GET" ? "bg-blue-500/20 text-blue-400" : "bg-blue-500/20 text-blue-400"}`}>{ep.method}</span>
                  <code className="text-sm text-white flex-1">{ep.path}</code>
                  {ep.auth && <span className="text-xs text-yellow-400">🔒 Auth</span>}
                </button>
                {openEndpoint === i && (
                  <div className="px-5 pb-5 border-t border-gray-800 pt-4">
                    <p className="text-gray-300 text-sm mb-3">{ep.desc}</p>
                    {ep.body && (<><p className="text-xs text-gray-500 mb-1">Request body:</p><pre className="bg-gray-950 rounded p-2 text-xs text-yellow-300 mb-3 overflow-x-auto">{ep.body}</pre></>)}
                    <p className="text-xs text-gray-500 mb-1">Response:</p>
                    <pre className="bg-gray-950 rounded p-2 text-xs text-blue-400 overflow-x-auto">{ep.response}</pre>
                    <TryItForm endpoint={ep} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Webhooks */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">🔔 Webhook Events</h2>
          <div className="space-y-3">
            {webhookEvents.map((we, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <p className="font-mono text-blue-400 font-bold">{we.event}</p>
                <p className="text-gray-400 text-sm mt-1">{we.desc}</p>
                <pre className="bg-gray-950 rounded p-2 text-xs text-yellow-300 mt-2 overflow-x-auto">{we.payload}</pre>
              </div>
            ))}
          </div>
        </section>

        {/* SDK */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">📦 SDK / Client Libraries</h2>
          <div className="flex gap-2 mb-4">
            <button onClick={() => setShowPython(true)} className={`px-4 py-2 rounded-lg text-sm font-medium ${showPython ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400"}`}>🐍 Python</button>
            <button onClick={() => setShowPython(false)} className={`px-4 py-2 rounded-lg text-sm font-medium ${!showPython ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400"}`}>🟨 JavaScript</button>
          </div>
          <pre className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-xs text-blue-400 overflow-x-auto max-h-96">{showPython ? pythonSDK : jsSDK}</pre>
        </section>

        {/* MCP */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">🤖 MCP Server (AI Agent Integration)</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-gray-300">
            <p className="mb-3">ClawQA exposes an <strong>MCP (Model Context Protocol)</strong> endpoint for AI agents:</p>
            <pre className="bg-gray-950 rounded p-3 text-sm text-blue-400 mb-3">POST /api/mcp</pre>
            <p className="text-sm mb-2">Send JSON-RPC 2.0 requests. Available methods:</p>
            <ul className="text-sm space-y-1 ml-4 list-disc">
              <li><code>initialize</code> — get server capabilities</li>
              <li><code>tools/list</code> — list available tools</li>
              <li><code>tools/call</code> — execute a tool (e.g. clawqa.list_projects, clawqa.get_bugs)</li>
            </ul>
            <pre className="bg-gray-950 rounded p-3 text-xs text-yellow-300 mt-3 overflow-x-auto">{`// Example:
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"apiKey":"clq_live_..."}}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"clawqa.list_projects"}}`}</pre>
          </div>
        </section>
      </div>
    </div>
  );
}
