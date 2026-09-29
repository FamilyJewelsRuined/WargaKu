import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { IplClientView } from "@/components/ipl-client-view";

export default async function IplPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Ambil user beserta householdId
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { householdId: true, address: true, status: true },
  });

  // User belum di-assign ke unit — tampilkan pesan
  if (!user?.householdId) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        padding: "32px 20px",
        textAlign: "center",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "#64748b",
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "#f1f5f9", display: "flex",
          alignItems: "center", justifyContent: "center",
          fontSize: 28, marginBottom: 16,
        }}>
          🏠
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>
          Unit Hunian Belum Ditentukan
        </h2>
        <p style={{ fontSize: 14, maxWidth: 300, lineHeight: 1.6, margin: 0 }}>
          Akun Anda belum di-assign ke unit hunian oleh admin.
          Hubungi admin RT untuk informasi lebih lanjut.
        </p>
      </div>
    );
  }

  const now = new Date();
  const payments = await prisma.iplPayment.findMany({
    where: { householdId: user.householdId },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  const serializablePayments = payments.map((p) => ({
    ...p,
    // Computed OVERDUE: jika UNPAID dan sudah lewat dueDate
    status: (p.status === "UNPAID" && p.dueDate && p.dueDate < now
      ? "OVERDUE"
      : p.status) as "PAID" | "UNPAID" | "OVERDUE",
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    paymentDate: p.paymentDate ? p.paymentDate.toISOString() : null,
    dueDate: p.dueDate ? p.dueDate.toISOString() : null,
  }));

  return (
    <IplClientView
      initialPayments={serializablePayments}
      userAddress={user.address}
    />
  );
}
