import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminRekeningView } from "@/components/admin-rekening-view";

export default async function AdminRekeningPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const accounts = await prisma.paymentAccount.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    include: {
      createdBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return <AdminRekeningView initialAccounts={accounts} />;
}
