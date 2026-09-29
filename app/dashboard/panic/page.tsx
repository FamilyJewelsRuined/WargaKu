import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AlertTriangle, Shield, Clock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { PanicButtonClient } from "@/components/panic-button";
import { SelfResolveAlertButton } from "@/components/self-resolve-alert-button";

export default async function PanicPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const alerts = await prisma.panicAlert.findMany({
    where: { userId: session.user.id }, // hanya tampilkan alert milik user sendiri
    orderBy: { triggeredAt: "desc" },
    take: 20,
    include: {
      user: { select: { name: true, address: true, houseNumber: true } },
    },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="animate-float-up">
        <div className="flex items-center gap-3 mb-1">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <span className="text-sm text-muted-foreground">Keamanan</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Tombol Darurat</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Tekan tombol di bawah jika Anda membutuhkan bantuan segera
        </p>
      </div>

      {/* Panic Button */}
      <PanicButtonClient
        userName={session.user.name!}
        userAddress={session.user.address ?? "Alamat tidak diketahui"}
        userId={session.user.id}
      />

      {/* How it works */}
      <div className="surface p-5 space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Cara Kerja
        </h3>
        <div className="space-y-3">
          {[
            { step: "1", text: "Tekan tombol DARURAT merah di atas" },
            { step: "2", text: "Konfirmasi bahwa Anda benar-benar membutuhkan bantuan" },
            { step: "3", text: "Semua warga komplek yang memiliki aplikasi akan menerima notifikasi" },
            { step: "4", text: "Warga terdekat akan segera mendatangi lokasi Anda" },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">
                {item.step}
              </div>
              <p className="text-sm text-muted-foreground pt-0.5">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Alert History */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Riwayat Alert Darurat
        </h2>
        {alerts.length === 0 ? (
          <div className="surface p-8 text-center">
            <Shield className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-foreground font-medium">Komplek Aman</p>
            <p className="text-muted-foreground text-sm mt-1">Belum ada alert darurat</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`surface p-4 flex items-start gap-3 ${
                  !alert.isResolved ? "border-red-800/50 bg-red-950/20" : ""
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    alert.isResolved ? "bg-green-950" : "bg-red-950"
                  }`}
                >
                  {alert.isResolved ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-foreground">
                    {alert.user.name}
                    {!alert.isResolved && (
                      <span className="ml-2 text-xs text-red-400 animate-pulse">
                        ● AKTIF
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {alert.user.address} ·{" "}
                    {format(new Date(alert.triggeredAt), "dd MMM yyyy, HH:mm", {
                      locale: idLocale,
                    })}
                  </p>
                  {alert.note && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      📝 {alert.note}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {alert.isResolved ? (
                    <span className="text-xs status-paid px-2 py-1 rounded-full border">
                      Teratasi
                    </span>
                  ) : (
                    <SelfResolveAlertButton alertId={alert.id} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
