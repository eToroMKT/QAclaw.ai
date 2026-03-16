import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import AddProjectButton from "@/components/AddProjectButton";

export default async function DashboardPage() {
  const session = await auth();
  const role = (session?.user as any)?.role || "tester";
  const canManageProjects = role === "agent-owner" || role === "admin";
  const projects = await prisma.project.findMany({
    include: {
      testCycles: { select: { id: true, status: true } },
      _count: { select: { testCycles: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Count bugs across all cycles
  const bugCounts = await prisma.bugReport.groupBy({
    by: ["cycleId"],
    _count: true,
  });

  // Auto-fix stats
  const autoFixJobs = await prisma.autoFixJob.findMany({
    orderBy: { startedAt: "desc" },
    take: 50,
  });
  const activeFixCount = autoFixJobs.filter(j => !["verified", "failed"].includes(j.status)).length;
  const completedFixes = autoFixJobs.filter(j => j.status === "verified");
  const failedFixes = autoFixJobs.filter(j => j.status === "failed");
  const successRate = completedFixes.length + failedFixes.length > 0
    ? Math.round((completedFixes.length / (completedFixes.length + failedFixes.length)) * 100)
    : 0;
  const avgFixTime = completedFixes.length > 0
    ? Math.round(completedFixes.reduce((sum, j) => sum + (j.completedAt ? new Date(j.completedAt).getTime() - new Date(j.startedAt).getTime() : 0), 0) / completedFixes.length / 60000)
    : 0;

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        {session?.user?.image && (
          <Image src={session.user.image} alt="" width={48} height={48} className="rounded-full" />
        )}
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back,{" "}
            <span className="bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">
              {session?.user?.name}
            </span>
          </h1>
          <p className="text-gray-400 text-sm">Your projects and test cycles</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {projects.map((project) => {
          const cycleIds = project.testCycles.map((c) => c.id);
          const bugs = bugCounts.filter((b) => cycleIds.includes(b.cycleId)).reduce((sum, b) => sum + b._count, 0);
          const running = project.testCycles.filter((c) => c.status === "running" || c.status === "open").length;
          const completed = project.testCycles.filter((c) => c.status === "completed").length;

          return (
            <Link key={project.id} href={`/projects/${project.slug}`}
              className="bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-6 hover:border-blue-500/50 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold group-hover:text-blue-400 transition-colors">{project.name}</h2>
                  <span className="text-sm text-blue-400">{project.targetUrl}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${running > 0 ? "bg-yellow-500/20 text-yellow-400" : "bg-blue-500/20 text-blue-400"}`}>
                  {running > 0 ? `${running} active` : "idle"}
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-4">{project.description}</p>
              <div className="flex gap-6 text-sm">
                <span className="text-gray-500">🔄 {project.testCycles.length} cycles</span>
                <span className="text-gray-500">✅ {completed} done</span>
                <span className="text-gray-500">🐛 {bugs} bugs</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Auto-Fix Engine Widget */}
      <div className="bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">🤖 Auto-Fix Engine</h2>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-400">{activeFixCount}</p>
            <p className="text-gray-400 text-sm">Active Fixes</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-400">{successRate}%</p>
            <p className="text-gray-400 text-sm">Success Rate</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-400">{avgFixTime}m</p>
            <p className="text-gray-400 text-sm">Avg Fix Time</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        {canManageProjects && <AddProjectButton />}
        <Link href="/dashboard/test-cycles"
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-400 hover:to-blue-500 transition-all">
          📋 New Test Cycle
        </Link>
        <Link href="/docs"
          className="px-6 py-3 bg-gray-700/50 border border-gray-600/50 text-white font-medium rounded-lg hover:bg-gray-700 transition-all">
          📖 Documentation
        </Link>
      </div>
    </div>
  );
}
