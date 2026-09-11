import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { IplPaymentButton } from "@/components/ipl-payment-button";

const monthNames = [
  "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const statusConfig = {
  PAID: { label: "Lunas", icon: CheckCircle2, class: "status-paid" },
  UNPAID: { label: "Belum Bayar", icon: Clock, class: "status-unpaid" },
  OVERDUE: { label: "Terlambat", icon: AlertCircle, class: "status-overdue" },
};

export default async function IplPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const payments = await prisma.iplPayment.findMany({
    where: { userId: session.user.id },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  const unpaid = payments.filter((p) => p.status !== "PAID");
  const paid = payments.filter((p) => p.status === "PAID");
  const totalPaid = paid.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="animate-float-up">
        <div className="flex items-center gap-3 mb-1">
          <CreditCard className="w-5 h-5 text-primary" />
          <span className="text-sm text-muted-foreground">IPL / Iuran Sampah</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Bayar IPL</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Iuran Pengangkutan Sampah · {session.user.address}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="surface p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{unpaid.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Belum Bayar</p>
        </div>
        <div className="surface p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{paid.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Sudah Lunas</p>
        </div>
        <div className="surface p-4 text-center">
          <p className="text-lg font-bold text-primary">
            {(totalPaid / 1000).toFixed(0)}k
          </p>
          <p className="text-xs text-muted-foreground mt-1">Total Bayar</p>
        </div>
      </div>

      {/* Unpaid first */}
      {unpaid.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Perlu Dibayar ({unpaid.length})
          </h2>
          <div className="space-y-2">
            {unpaid.map((payment) => {
              const cfg = statusConfig[payment.status];
              const StatusIcon = cfg.icon;
              return (
                <div
                  key={payment.id}
                  className="surface p-4 flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-yellow-950 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">
                      {monthNames[payment.month]} {payment.year}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Rp {payment.amount.toLocaleString("id-ID")}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border mt-1 ${cfg.class}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>
                  <IplPaymentButton paymentId={payment.id} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* History */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Riwayat Pembayaran
        </h2>
        {paid.length === 0 ? (
          <div className="surface p-8 text-center text-muted-foreground text-sm">
            Belum ada riwayat pembayaran
          </div>
        ) : (
          <div className="surface divide-y divide-border overflow-hidden">
            {paid.map((payment) => (
              <div key={payment.id} className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-green-950 flex items-center justify-center flex-shrink-0">
                  <Receipt className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-foreground">
                    {monthNames[payment.month]} {payment.year}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {payment.receiptNumber} ·{" "}
                    {payment.paymentDate
                      ? format(new Date(payment.paymentDate), "dd MMM yyyy", {
                          locale: idLocale,
                        })
                      : "-"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-400">
                    Rp {payment.amount.toLocaleString("id-ID")}
                  </p>
                  <span className="text-xs status-paid px-2 py-0.5 rounded-full border">
                    Lunas
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
