import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  // Get all projects that have screenshots
  const projects = await prisma.project.findMany({
    where: { screenshots: { some: {} } },
    include: {
      screenshots: {
        orderBy: { runDate: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });

  // Also get projects without screenshots but with test cycles
  const allProjects = await prisma.project.findMany({
    include: {
      _count: { select: { screenshots: true, testCycles: true } },
      screenshots: {
        orderBy: { runDate: "desc" },
        take: 1,
        select: { runId: true, runDate: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">
          🧪 Automated Test Results
        </h1>
        <p className="text-gray-400 text-lg">
          Visual gallery — see exactly what Playwright sees during E2E test runs
        </p>
      </div>

      {allProjects.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-5xl mb-4">📭</p>
          <p className="text-xl">No test results yet</p>
          <p className="mt-2">Run Playwright tests and upload screenshots via the API to see them here.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {allProjects.map((project) => {
            // Calculate stats from screenshots
            const hasScreenshots = project._count.screenshots > 0;
            const latestRun = project.screenshots[0];

            return (
              <Link
                key={project.id}
                href={`/agents/${project.slug}`}
                className="group block bg-gray-900/60 border border-gray-800 hover:border-blue-500/50 rounded-2xl p-6 transition-all hover:shadow-lg hover:shadow-blue-500/5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold group-hover:text-blue-400 transition">
                      {project.name}
                    </h2>
                    {project.targetUrl && (
                      <p className="text-sm text-gray-500 mt-1 truncate max-w-[250px]">
                        {project.targetUrl}
                      </p>
                    )}
                  </div>
                  <span className="text-2xl opacity-50 group-hover:opacity-100 transition">→</span>
                </div>

                {project.description && (
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">{project.description}</p>
                )}

                <div className="flex items-center gap-4 text-sm">
                  {hasScreenshots ? (
                    <>
                      <span className="text-blue-400">📸 {project._count.screenshots} screenshots</span>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-500">
                        {latestRun?.runDate ? new Date(latestRun.runDate).toLocaleDateString() : "—"}
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-600">
                      {project._count.testCycles} test cycles · No screenshots yet
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
