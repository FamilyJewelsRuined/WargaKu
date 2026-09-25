import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { IplClientView } from "@/components/ipl-client-view";

export default async function IplPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const payments = await prisma.iplPayment.findMany({
    where: { userId: session.user.id },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  // Map to serializable format if needed
  const serializablePayments = payments.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    paymentDate: p.paymentDate ? p.paymentDate.toISOString() : null,
  }));

  return (
    <IplClientView
      initialPayments={serializablePayments}
      userAddress={session.user.address}
    />
  );
}
