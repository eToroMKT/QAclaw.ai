import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const user = {
    name: session.user?.name,
    image: session.user?.image,
    role: (session.user as any)?.role || "tester",
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={user.role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar user={user} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
