import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AlertTriangle, CheckCircle2, Shield } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { ResolveAlertButton } from "@/components/resolve-alert-button";

export default async function AdminAlertsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  const alerts = await prisma.panicAlert.findMany({
    orderBy: [{ isResolved: "asc" }, { triggeredAt: "desc" }],
    include: {
      user: { select: { name: true, address: true, houseNumber: true, phone: true } },
    },
  });

  const activeCount = alerts.filter((a) => !a.isResolved).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <span className="text-sm text-muted-foreground">Admin · Keamanan</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Panic Alerts</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {activeCount > 0 ? (
            <span className="text-red-400 font-medium">{activeCount} alert aktif membutuhkan perhatian</span>
          ) : (
            "Semua alert sudah ditangani"
          )}
        </p>
      </div>

      {/* Alert List */}
      {alerts.length === 0 ? (
        <div className="surface p-12 text-center">
          <Shield className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-foreground font-medium">Komplek Aman</p>
          <p className="text-muted-foreground text-sm mt-1">Belum pernah ada alert darurat</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`surface p-4 flex items-start gap-4 ${!alert.isResolved ? "border-red-800/50 bg-red-950/20" : ""}`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${alert.isResolved ? "bg-green-950" : "bg-red-950"}`}
              >
                {alert.isResolved ? (
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-foreground">{alert.user.name}</p>
                  {!alert.isResolved && (
                    <span className="text-xs text-red-400 bg-red-950 border border-red-800/50 px-2 py-0.5 rounded-full animate-pulse">
                      ● AKTIF
                    </span>
                  )}
                </div>

                <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                  <p>📍 {alert.user.address} {alert.user.houseNumber ? `(${alert.user.houseNumber})` : ""}</p>
                  <p>📞 {alert.user.phone ?? "—"}</p>
                  <p>
                    🕒 Dipicu:{" "}
                    {format(new Date(alert.triggeredAt), "EEEE, dd MMM yyyy · HH:mm", { locale: idLocale })}
                  </p>
                  {alert.resolvedAt && (
                    <p>
                      ✅ Diselesaikan:{" "}
                      {format(new Date(alert.resolvedAt), "dd MMM yyyy · HH:mm", { locale: idLocale })}
                    </p>
                  )}
                  {alert.note && (
                    <p className="italic text-foreground/60 mt-1">"{alert.note}"</p>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0">
                {alert.isResolved ? (
                  <span className="text-xs status-paid px-3 py-1.5 rounded-full border">
                    Teratasi
                  </span>
                ) : (
                  <ResolveAlertButton alertId={alert.id} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
