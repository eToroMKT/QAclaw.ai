import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

const statusColors: Record<string, string> = {
  open: "bg-blue-500/20 text-blue-400",
  running: "bg-yellow-500/20 text-yellow-400",
  completed: "bg-blue-500/20 text-blue-400",
  draft: "bg-gray-500/20 text-gray-400",
  escalated_to_applause: "bg-purple-500/20 text-purple-400",
};

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const project = await prisma.project.findUnique({
    where: { slug: (await params).slug },
    include: {
      testCycles: {
        include: { _count: { select: { bugReports: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!project) notFound();

  return (
    <div>
      <div className="mb-8">
        <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm mb-2 inline-block">← Back to Dashboard</Link>
        <h1 className="text-3xl font-bold">{project.name}</h1>
        <a href={project.targetUrl} target="_blank" rel="noopener" className="text-blue-400 hover:underline text-sm">
          {project.targetUrl}
        </a>
        <p className="text-gray-400 mt-2">{project.description}</p>
      </div>

      <div className="flex gap-4 mb-8">
        <Link href="/dashboard/test-cycles"
          className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-400 hover:to-blue-500 transition-all text-sm">
          + New Test Cycle
        </Link>
        <button className="px-5 py-2.5 bg-purple-600/80 hover:bg-purple-500 text-white font-medium rounded-lg transition-all text-sm"
          title="Escalate to Testers crowd testers when AI can't resolve">
          🚀 Escalate to Testers
        </button>
      </div>

      <h2 className="text-xl font-semibold mb-4">Test Cycles</h2>
      <div className="space-y-4">
        {project.testCycles.map((cycle) => (
          <div key={cycle.id} className="bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">{cycle.title}</h3>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[cycle.status] || statusColors.open}`}>
                  {cycle.status}
                </span>
                <span className={`px-2 py-1 rounded text-xs ${cycle.priority === "critical" ? "bg-red-500/20 text-red-400" : cycle.priority === "high" ? "bg-orange-500/20 text-orange-400" : "bg-gray-500/20 text-gray-400"}`}>
                  {cycle.priority}
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-400 mb-3">
              🐛 {cycle._count.bugReports} bugs · Target: <a href={cycle.targetUrl} target="_blank" className="text-blue-400 hover:underline">{cycle.targetUrl}</a>
            </div>
            <details className="text-sm">
              <summary className="cursor-pointer text-gray-500 hover:text-gray-300">View test steps</summary>
              <ol className="mt-2 space-y-1 text-gray-400 list-decimal list-inside">
                {JSON.parse(cycle.stepsJson || "[]").map((step: any, i: number) => (
                  <li key={i}>{typeof step === "string" ? step : step.instruction || step.step}</li>
                ))}
              </ol>
            </details>
          </div>
        ))}
      </div>

      {project.testCycles.length === 0 && (
        <p className="text-gray-500 text-center py-8">No test cycles yet. Create one to get started.</p>
      )}
    </div>
  );
}
