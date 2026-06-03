import { prisma } from "@/lib/db/prisma";
import DashboardClient from "./DashboardClient";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData?.user) {
    redirect("/login");
  }

  // Server-side data fetching directly from PostgreSQL
  // Using Promise.all for parallel highly optimized fetching
  const [
    dbUser,
    patients,
    appointments,
    financialRecords,
    inventory
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { authId: authData.user.id }
    }),
    prisma.patient.findMany({
      orderBy: { createdAt: 'desc' }
    }),
    prisma.appointment.findMany({
      orderBy: { date: 'asc' }
    }),
    prisma.financialRecord.findMany({
      orderBy: { date: 'desc' }
    }),
    prisma.inventoryItem.findMany({
      orderBy: { name: 'asc' }
    })
  ]);

  return (
    <DashboardClient 
      currentUser={dbUser}
      patients={patients}
      appointments={appointments}
      financialRecords={financialRecords}
      inventory={inventory}
    />
  );
}
