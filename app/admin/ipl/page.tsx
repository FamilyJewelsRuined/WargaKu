import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CreditCard, CheckCircle2, Clock, AlertCircle, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

const statusConfig = {
  PAID: { label: "Lunas", icon: CheckCircle2, class: "status-paid" },
  UNPAID: { label: "Belum Bayar", icon: Clock, class: "status-unpaid" },
  OVERDUE: { label: "Terlambat", icon: AlertCircle, class: "status-overdue" },
};

export default async function AdminIplPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  const payments = await prisma.iplPayment.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
    include: {
      user: { select: { name: true, houseNumber: true, address: true } },
    },
  });

  const totalPaid = payments.filter((p) => p.status === "PAID").length;
  const totalUnpaid = payments.filter((p) => p.status === "UNPAID").length;
  const totalOverdue = payments.filter((p) => p.status === "OVERDUE").length;
  const totalRevenue = payments
    .filter((p) => p.status === "PAID")
    .reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <CreditCard className="w-5 h-5 text-primary" />
          <span className="text-sm text-muted-foreground">Admin · IPL</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Laporan IPL</h1>
        <p className="text-muted-foreground text-sm mt-1">Rekapitulasi iuran pengangkutan sampah semua warga</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Lunas", value: totalPaid, class: "text-green-400", bg: "bg-green-950" },
          { label: "Belum Bayar", value: totalUnpaid, class: "text-yellow-400", bg: "bg-yellow-950" },
          { label: "Terlambat", value: totalOverdue, class: "text-red-400", bg: "bg-red-950" },
          { label: "Total Pendapatan", value: `Rp ${totalRevenue.toLocaleString("id-ID")}`, class: "text-primary", bg: "bg-primary/10" },
        ].map((s) => (
          <div key={s.label} className={`surface p-4 text-center`}>
            <p className={`text-2xl font-bold ${s.class}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Payments Table */}
      <div className="surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 font-semibold text-muted-foreground">Warga</th>
                <th className="text-left p-4 font-semibold text-muted-foreground">Periode</th>
                <th className="text-left p-4 font-semibold text-muted-foreground">Jumlah</th>
                <th className="text-left p-4 font-semibold text-muted-foreground">Status</th>
                <th className="text-left p-4 font-semibold text-muted-foreground hidden md:table-cell">Tanggal Bayar</th>
                <th className="text-left p-4 font-semibold text-muted-foreground hidden lg:table-cell">No. Resi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payments.map((p) => {
                const cfg = statusConfig[p.status];
                const StatusIcon = cfg.icon;
                return (
                  <tr key={p.id} className="hover:bg-white/2 transition-colors">
                    <td className="p-4">
                      <p className="font-medium text-foreground">{p.user.name}</p>
                      <p className="text-xs text-muted-foreground">{p.user.houseNumber ?? p.user.address}</p>
                    </td>
                    <td className="p-4 text-foreground font-medium">
                      {monthNames[p.month]} {p.year}
                    </td>
                    <td className="p-4 text-foreground">
                      Rp {p.amount.toLocaleString("id-ID")}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.class}`}>
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="p-4 hidden md:table-cell text-xs text-muted-foreground">
                      {p.paymentDate
                        ? format(new Date(p.paymentDate), "dd MMM yyyy", { locale: idLocale })
                        : "—"}
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <code className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                        {p.receiptNumber ?? "—"}
                      </code>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
