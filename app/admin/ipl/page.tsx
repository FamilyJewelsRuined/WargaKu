import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminIplView } from "@/components/admin-ipl-view";

export const metadata = {
  title: "Laporan IPL & Penagihan · WargaKu",
};

export default async function AdminIplPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  const [payments, configs, totalActiveUnits] = await Promise.all([
    prisma.iplPayment.findMany({
      orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
      include: {
        household: { select: { unitNumber: true, address: true } },
        paidBy: { select: { name: true } },
      },
    }),
    prisma.iplConfig.findMany({
      orderBy: { effectiveFrom: "desc" },
      include: {
        createdBy: { select: { name: true } },
      },
    }),
    prisma.householdUnit.count({
      where: { isActive: true },
    }),
  ]);

  const activeConfig = configs[0] ?? null;

  return (
    <AdminIplView
      initialPayments={payments}
      activeConfig={activeConfig}
      configs={configs}
      totalActiveUnits={totalActiveUnits}
    />
  );
}
