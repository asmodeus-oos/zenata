import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 selection:bg-blue-100 selection:text-blue-900" id="clinic-master-viewport">
      <Sidebar user={data.user} />
      <main className="flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar bg-slate-50/50">
        {children}
      </main>
    </div>
  );
}
