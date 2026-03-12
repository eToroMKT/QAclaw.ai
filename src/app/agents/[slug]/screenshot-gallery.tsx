"use client";

import { useState } from "react";

type Screenshot = {
  id: string;
  testName: string;
  status: string;
  category: string;
  description: string;
  filePath: string;
};

export function ScreenshotGallery({
  screenshots,
  defaultExpanded = true,
}: {
  screenshots: Screenshot[];
  defaultExpanded?: boolean;
}) {
  const [filter, setFilter] = useState<"all" | "pass" | "fail">("all");
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const filtered = screenshots.filter((s) => {
    if (filter === "all") return true;
    return s.status === filter;
  });

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="text-gray-400 hover:text-white text-sm transition"
      >
        Show {screenshots.length} screenshots ▾
      </button>
    );
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(["all", "pass", "fail"] as const).map((f) => {
          const count =
            f === "all"
              ? screenshots.length
              : screenshots.filter((s) => s.status === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                filter === f
                  ? f === "fail"
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : f === "pass"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "bg-gray-800/50 text-gray-500 border border-transparent hover:border-gray-700"
              }`}
            >
              {f === "all" ? "All" : f === "pass" ? "✓ Passed" : "✗ Failed"} ({count})
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((ss) => (
          <div
            key={ss.id}
            className={`rounded-xl overflow-hidden border transition hover:shadow-lg ${
              ss.status === "fail"
                ? "border-red-500/30 hover:border-red-500/60 hover:shadow-red-500/5"
                : "border-emerald-500/20 hover:border-emerald-500/50 hover:shadow-emerald-500/5"
            } bg-gray-900/40`}
          >
            {/* Screenshot image */}
            <div
              className="cursor-pointer relative group"
              onClick={() => setLightbox(ss.filePath)}
            >
              <img
                src={ss.filePath.startsWith("http") || ss.filePath.startsWith("/") ? ss.filePath : `/screenshots/${ss.filePath}`}
                alt={ss.testName}
                className="w-full h-48 object-cover object-top"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 transition text-white text-sm bg-black/60 px-3 py-1 rounded-lg">
                  🔍 Enlarge
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    ss.status === "fail"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-emerald-500/20 text-emerald-400"
                  }`}
                >
                  {ss.status === "fail" ? "✗ FAIL" : "✓ PASS"}
                </span>
                {ss.category && (
                  <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                    {ss.category}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-medium text-white mb-1 line-clamp-2">{ss.testName}</h3>
              {ss.description && (
                <p className="text-xs text-gray-500 line-clamp-2">{ss.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-600 py-8">No {filter} screenshots in this run.</p>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox.startsWith("http") || lightbox.startsWith("/") ? lightbox : `/screenshots/${lightbox}`}
            alt="Screenshot enlarged"
            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
          />
          <button className="absolute top-6 right-6 text-white/60 hover:text-white text-3xl">✕</button>
        </div>
      )}
    </div>
  );
}
