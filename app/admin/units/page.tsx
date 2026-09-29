import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminUnitsView } from "@/components/admin-units-view";

export const metadata = {
  title: "Kelola Unit Hunian · WargaKu",
};

export default async function AdminUnitsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const units = await prisma.householdUnit.findMany({
    orderBy: { unitNumber: "asc" },
    include: {
      _count: {
        select: {
          members: true,
          payments: true,
        },
      },
      members: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });

  return <AdminUnitsView initialUnits={units} />;
}
