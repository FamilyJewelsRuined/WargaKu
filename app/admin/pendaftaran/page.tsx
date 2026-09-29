import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminPendaftaranView } from "@/components/admin-pendaftaran-view";

export const metadata = {
  title: "Verifikasi Pendaftaran Warga · WargaKu",
};

export default async function AdminPendaftaranPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [pendingUsers, units] = await Promise.all([
    prisma.user.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        createdAt: true,
      },
    }),
    prisma.householdUnit.findMany({
      where: { isActive: true },
      orderBy: { unitNumber: "asc" },
      select: {
        id: true,
        unitNumber: true,
        address: true,
        _count: {
          select: { members: true },
        },
      },
    }),
  ]);

  return <AdminPendaftaranView initialUsers={pendingUsers} units={units} />;
}
