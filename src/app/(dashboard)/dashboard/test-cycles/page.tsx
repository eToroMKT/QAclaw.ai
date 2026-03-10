"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Project { id: string; name: string; slug: string; }
interface TestCycle {
  id: string; title: string; priority: string; status: string;
  stepsJson: string; deviceReqs: string; createdAt: string;
  project: { id: string; name: string; slug: string; };
}

const priorityColors: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  normal: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  low: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};
const statusColors: Record<string, string> = {
  open: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  in_progress: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  running: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  escalated_to_applause: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export default function TestCyclesPage() {
  const [cycles, setCycles] = useState<TestCycle[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterProject, setFilterProject] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Form state
  const [formProjectId, setFormProjectId] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formTargetUrl, setFormTargetUrl] = useState("");
  const [formPriority, setFormPriority] = useState("normal");
  const [formDescription, setFormDescription] = useState("");
  const [steps, setSteps] = useState([{ instruction: "", expectedResult: "" }]);
  const [deviceReqs, setDeviceReqs] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function loadCycles() {
    const res = await fetch("/api/v1/test-cycles");
    if (res.ok) setCycles(await res.json());
    setLoading(false);
  }

  async function loadProjects() {
    const res = await fetch("/api/v1/projects");
    if (res.ok) setProjects(await res.json());
  }

  useEffect(() => { loadCycles(); loadProjects(); }, []);

  const filtered = cycles.filter(c => {
    if (filterProject && c.project.id !== filterProject) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    return true;
  });

  function addStep() { setSteps([...steps, { instruction: "", expectedResult: "" }]); }
  function removeStep(i: number) { setSteps(steps.filter((_, idx) => idx !== i)); }
  function updateStep(i: number, field: string, val: string) {
    const s = [...steps]; (s[i] as any)[field] = val; setSteps(s);
  }
  function toggleDevice(d: string) {
    setDeviceReqs(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  }

  async function handleSubmit() {
    setError("");
    if (!formProjectId || !formTitle || !formTargetUrl || !steps.some(s => s.instruction)) {
      setError("Please fill in all required fields and at least one step.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/test-cycles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: formProjectId, title: formTitle, description: formDescription,
        targetUrl: formTargetUrl, priority: formPriority,
        steps: steps.filter(s => s.instruction), deviceRequirements: deviceReqs,
      }),
    });
    if (res.ok) {
      setShowForm(false);
      setFormTitle(""); setFormTargetUrl(""); setFormDescription("");
      setSteps([{ instruction: "", expectedResult: "" }]); setDeviceReqs([]);
      loadCycles();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to create cycle");
    }
    setSubmitting(false);
  }

  const devices = ["iOS Safari", "Android Chrome", "Windows Chrome", "macOS Safari"];

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Test Cycles</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-400 hover:to-blue-500 transition-all">
          {showForm ? "Cancel" : "Create New Cycle"}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-8 mb-6">
          <h2 className="text-xl font-semibold mb-4">New Test Cycle</h2>
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <select value={formProjectId} onChange={e => setFormProjectId(e.target.value)}
              className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500/50">
              <option value="">Select Project *</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={formPriority} onChange={e => setFormPriority(e.target.value)}
              className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500/50">
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Title *"
              className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500/50" />
            <input value={formTargetUrl} onChange={e => setFormTargetUrl(e.target.value)} placeholder="Target URL *"
              className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500/50" />
          </div>
          <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Description (optional)" rows={2}
            className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 mb-4" />

          <h3 className="text-sm font-semibold text-gray-300 mb-2">Test Steps</h3>
          <div className="space-y-3 mb-4">
            {steps.map((s, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="text-gray-500 pt-3 text-sm w-6">{i + 1}.</span>
                <input value={s.instruction} onChange={e => updateStep(i, "instruction", e.target.value)} placeholder="Instruction"
                  className="flex-1 bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50" />
                <input value={s.expectedResult} onChange={e => updateStep(i, "expectedResult", e.target.value)} placeholder="Expected result"
                  className="flex-1 bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50" />
                {steps.length > 1 && <button onClick={() => removeStep(i)} className="text-red-400 hover:text-red-300 pt-2">✕</button>}
              </div>
            ))}
          </div>
          <button onClick={addStep} className="text-sm text-blue-400 hover:text-blue-300 mb-4">+ Add Step</button>

          <h3 className="text-sm font-semibold text-gray-300 mb-2">Device Requirements</h3>
          <div className="flex flex-wrap gap-3 mb-6">
            {devices.map(d => (
              <label key={d} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input type="checkbox" checked={deviceReqs.includes(d)} onChange={() => toggleDevice(d)}
                  className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500" />
                {d}
              </label>
            ))}
          </div>

          <button onClick={handleSubmit} disabled={submitting}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-400 hover:to-blue-500 transition-all disabled:opacity-50">
            {submitting ? "Creating..." : "Create Cycle"}
          </button>
        </div>
      )}

      <div className="flex gap-3 mb-6">
        <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
          className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50">
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50">
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="escalated_to_applause">Escalated</option>
        </select>
      </div>

      <div className="bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-8">
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500">No test cycles found.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map(c => {
              let stepCount = 0;
              try { stepCount = JSON.parse(c.stepsJson).length; } catch {}
              return (
                <Link key={c.id} href={`/dashboard/test-cycles/${c.id}`}
                  className="flex items-center justify-between bg-gray-700/30 rounded-xl px-5 py-4 hover:bg-gray-700/50 transition-colors block">
                  <div className="flex-1">
                    <p className="font-medium text-white">{c.title}</p>
                    <p className="text-sm text-gray-400">{c.project.name} · {stepCount} steps · {new Date(c.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${priorityColors[c.priority] || priorityColors.normal}`}>{c.priority}</span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${statusColors[c.status] || statusColors.open}`}>{c.status.replace(/_/g, " ")}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
