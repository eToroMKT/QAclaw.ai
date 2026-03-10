"use client";
import { signOut } from "next-auth/react";
import Image from "next/image";

export default function TopBar({ user }: { user: any }) {
  const roleBadge: Record<string, string> = {
    tester: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "agent-owner": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    admin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  };

  return (
    <header className="h-16 border-b border-gray-700/50 bg-gray-900/60 backdrop-blur-xl flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${roleBadge[user.role] || roleBadge.tester}`}>
          {user.role}
        </span>
        {user.image && (
          <Image src={user.image} alt="avatar" width={32} height={32} className="rounded-full" />
        )}
        <span className="text-sm text-gray-300">{user.name}</span>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-sm text-gray-400 hover:text-white transition"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
