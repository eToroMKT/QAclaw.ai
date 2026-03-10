export default function GlassCard({ title, value, subtitle, icon }: { title: string; value: string; subtitle?: string; icon: string }) {
  return (
    <div className="bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-6 hover:border-blue-500/30 transition-all">
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs text-gray-500 uppercase tracking-wider">{title}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}
