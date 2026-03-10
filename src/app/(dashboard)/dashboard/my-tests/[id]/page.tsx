"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Step { instruction: string; expectedResult: string; }
interface StepResult { passed: boolean | null; notes: string; }
interface Execution {
  id: string; status: string; cycleId: string; resultsJson: string;
  cycle: { id: string; title: string; targetUrl: string; stepsJson: string; deviceReqs: string; project: { name: string; }; };
}

export default function TestExecutionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [exec, setExec] = useState<Execution | null>(null);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<StepResult[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showBugForm, setShowBugForm] = useState(false);
  const [bugTitle, setBugTitle] = useState("");
  const [bugSeverity, setBugSeverity] = useState("minor");
  const [bugSteps, setBugSteps] = useState("");
  const [bugExpected, setBugExpected] = useState("");
  const [bugActual, setBugActual] = useState("");
  const [bugMsg, setBugMsg] = useState("");

  useEffect(() => {
    fetch(`/api/my-tests/${id}`)
      .then(r => r.json())
      .then(d => {
        setExec(d);
        let steps: Step[] = []; try { steps = JSON.parse(d.cycle.stepsJson); } catch {}
        let existing: StepResult[] = []; try { existing = JSON.parse(d.resultsJson); } catch {}
        setResults(existing.length === steps.length ? existing : steps.map(() => ({ passed: null, notes: "" })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (!exec) return <div className="text-red-400">Not found</div>;

  let steps: Step[] = []; try { steps = JSON.parse(exec.cycle.stepsJson); } catch {}
  let devices: string[] = []; try { devices = JSON.parse(exec.cycle.deviceReqs); } catch {}

  function updateResult(i: number, field: keyof StepResult, val: any) {
    const r = [...results]; (r[i] as any)[field] = val; setResults(r);
  }

  async function submitResults() {
    setSubmitting(true);
    const res = await fetch(`/api/my-tests/${id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ results }),
    });
    if (res.ok) router.push("/dashboard/my-tests");
    setSubmitting(false);
  }

  async function submitBug() {
    const res = await fetch("/api/bugs/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cycleId: exec!.cycleId, title: bugTitle, severity: bugSeverity,
        stepsToReproduce: bugSteps, expectedResult: bugExpected, actualResult: bugActual,
      }),
    });
    if (res.ok) {
      setBugMsg("Bug submitted!"); setShowBugForm(false);
      setBugTitle(""); setBugSteps(""); setBugExpected(""); setBugActual("");
    } else {
      setBugMsg("Failed to submit bug");
    }
  }

  return (
    <div className="max-w-4xl">
      <Link href="/dashboard/my-tests" className="text-sm text-gray-400 hover:text-blue-400 mb-4 inline-block">← Back to My Tests</Link>
      <h1 className="text-3xl font-bold mb-2">{exec.cycle.title}</h1>
      <p className="text-gray-400 mb-6">{exec.cycle.project.name} · <a href={exec.cycle.targetUrl} target="_blank" className="text-blue-400 hover:underline">{exec.cycle.targetUrl}</a></p>

      {devices.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {devices.map(d => <span key={d} className="text-xs bg-gray-700/50 text-gray-300 px-3 py-1 rounded-full">{d}</span>)}
        </div>
      )}

      <div className="bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Test Steps</h2>
        <div className="space-y-4">
          {steps.map((s, i) => (
            <div key={i} className="bg-gray-700/30 rounded-xl p-4">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-blue-400 font-bold text-sm">{i + 1}</span>
                <div className="flex-1">
                  <p className="text-white text-sm">{s.instruction}</p>
                  {s.expectedResult && <p className="text-gray-400 text-xs mt-1">Expected: {s.expectedResult}</p>}
                </div>
              </div>
              {exec.status !== "submitted" && (
                <div className="flex items-center gap-3 ml-6">
                  <button onClick={() => updateResult(i, "passed", true)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${results[i]?.passed === true ? "bg-blue-500/30 text-blue-400" : "bg-gray-700/50 text-gray-500 hover:text-blue-400"}`}>
                    ✓ Pass
                  </button>
                  <button onClick={() => updateResult(i, "passed", false)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${results[i]?.passed === false ? "bg-red-500/30 text-red-400" : "bg-gray-700/50 text-gray-500 hover:text-red-400"}`}>
                    ✕ Fail
                  </button>
                  <input value={results[i]?.notes || ""} onChange={e => updateResult(i, "notes", e.target.value)} placeholder="Notes..."
                    className="flex-1 bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-1 text-white text-xs focus:outline-none focus:border-blue-500/50" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {bugMsg && <div className="mb-4 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-blue-400 text-sm">{bugMsg}</div>}

      {exec.status !== "submitted" && (
        <div className="flex gap-3 mb-6">
          <button onClick={submitResults} disabled={submitting}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-400 hover:to-blue-500 transition-all disabled:opacity-50">
            {submitting ? "Submitting..." : "Submit Results"}
          </button>
          <button onClick={() => setShowBugForm(!showBugForm)}
            className="px-6 py-3 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-600 transition-all">
            🐛 Submit Bug
          </button>
        </div>
      )}

      {showBugForm && (
        <div className="bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Report a Bug</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={bugTitle} onChange={e => setBugTitle(e.target.value)} placeholder="Bug title *"
                className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500/50" />
              <select value={bugSeverity} onChange={e => setBugSeverity(e.target.value)}
                className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500/50">
                <option value="cosmetic">Cosmetic</option>
                <option value="minor">Minor</option>
                <option value="major">Major</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <textarea value={bugSteps} onChange={e => setBugSteps(e.target.value)} placeholder="Steps to reproduce" rows={3}
              className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500/50" />
            <textarea value={bugExpected} onChange={e => setBugExpected(e.target.value)} placeholder="Expected result" rows={2}
              className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500/50" />
            <textarea value={bugActual} onChange={e => setBugActual(e.target.value)} placeholder="Actual result" rows={2}
              className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500/50" />
            <div className="mb-3">
              <label className="text-sm text-gray-400 block mb-1">Screenshot (optional)</label>
              <input type="file" accept="image/*" className="text-sm text-gray-400" />
            </div>
            <button onClick={submitBug} className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-400 hover:to-blue-500 transition-all">
              Submit Bug Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
