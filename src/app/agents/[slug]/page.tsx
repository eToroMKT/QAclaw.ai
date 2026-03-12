import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ScreenshotGallery } from "./screenshot-gallery";

export const dynamic = "force-dynamic";

export default async function AgentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;

  const project = await prisma.project.findUnique({
    where: { slug },
    include: {
      screenshots: {
        orderBy: { runDate: "desc" },
      },
      testCycles: {
        orderBy: { id: "desc" },
        take: 5,
        select: { id: true, title: true, status: true, priority: true },
      },
    },
  });

  if (!project) notFound();

  // Group screenshots by runId
  const runMap = new Map<string, typeof project.screenshots>();
  for (const ss of project.screenshots) {
    const key = ss.runId || "ungrouped";
    if (!runMap.has(key)) runMap.set(key, []);
    runMap.get(key)!.push(ss);
  }

  const runs = Array.from(runMap.entries()).map(([runId, screenshots]) => {
    const passed = screenshots.filter((s) => s.status === "pass").length;
    const failed = screenshots.filter((s) => s.status === "fail").length;
    const latestDate = screenshots.reduce((d, s) => (s.runDate > d ? s.runDate : d), screenshots[0].runDate);
    return { runId, screenshots, passed, failed, total: screenshots.length, date: latestDate };
  });

  runs.sort((a, b) => b.date.getTime() - a.date.getTime());

  const totalPassed = project.screenshots.filter((s) => s.status === "pass").length;
  const totalFailed = project.screenshots.filter((s) => s.status === "fail").length;

  return (
    <div>
      <Link href="/agents" className="text-gray-400 hover:text-white text-sm mb-4 inline-block">
        ← All Projects
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">{project.name}</h1>
        {project.targetUrl && (
          <a
            href={project.targetUrl}
            target="_blank"
            rel="noopener"
            className="text-blue-400 hover:underline text-sm"
          >
            {project.targetUrl} ↗
          </a>
        )}
        {project.description && <p className="text-gray-400 mt-2">{project.description}</p>}
      </div>

      {/* Summary */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl px-5 py-3 text-center min-w-[120px]">
          <div className="text-2xl font-bold text-amber-400">{project.screenshots.length}</div>
          <div className="text-xs text-gray-500 mt-1">Total Screenshots</div>
        </div>
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl px-5 py-3 text-center min-w-[120px]">
          <div className="text-2xl font-bold text-emerald-400">{totalPassed}</div>
          <div className="text-xs text-gray-500 mt-1">Passed</div>
        </div>
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl px-5 py-3 text-center min-w-[120px]">
          <div className="text-2xl font-bold text-red-400">{totalFailed}</div>
          <div className="text-xs text-gray-500 mt-1">Failed</div>
        </div>
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl px-5 py-3 text-center min-w-[120px]">
          <div className="text-2xl font-bold text-blue-400">{runs.length}</div>
          <div className="text-xs text-gray-500 mt-1">Test Runs</div>
        </div>
      </div>

      {/* Runs */}
      {runs.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">📷</p>
          <p className="text-lg">No test screenshots yet</p>
          <p className="mt-2 text-sm">
            Upload screenshots via <code className="bg-gray-800 px-2 py-0.5 rounded">POST /api/v1/test-screenshots</code>
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {runs.map((run, i) => (
            <div key={run.runId} className="border border-gray-800 rounded-2xl overflow-hidden">
              <div className="bg-gray-900/80 px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-gray-800">
                <div>
                  <h2 className="font-semibold text-lg">
                    {run.runId === "ungrouped" ? "Test Run" : `Run: ${run.runId}`}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {run.date.toLocaleDateString()} {run.date.toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="bg-emerald-500/15 text-emerald-400 px-3 py-1 rounded-full font-medium">
                    ✓ {run.passed} passed
                  </span>
                  {run.failed > 0 && (
                    <span className="bg-red-500/15 text-red-400 px-3 py-1 rounded-full font-medium">
                      ✗ {run.failed} failed
                    </span>
                  )}
                </div>
              </div>
              <div className="p-6">
                <ScreenshotGallery
                  screenshots={run.screenshots.map((s) => ({
                    id: s.id,
                    testName: s.testName,
                    status: s.status,
                    category: "",
                    description: "",
                    filePath: s.imageUrl,
                  }))}
                  defaultExpanded={i === 0}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
