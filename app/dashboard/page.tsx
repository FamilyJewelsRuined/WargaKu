import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  CreditCard,
  Camera,
  AlertTriangle,
  CalendarDays,
  Home,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

async function getDashboardData(userId: string) {
  const [iplSummary, recentEvents, lastPanic] = await Promise.all([
    prisma.iplPayment.findMany({
      where: { userId },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: 3,
    }),
    prisma.communityEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { author: { select: { name: true } } },
    }),
    prisma.panicAlert.findFirst({
      where: { isResolved: false },
      include: { user: { select: { name: true, address: true } } },
    }),
  ]);

  const unpaidCount = iplSummary.filter((p) => p.status !== "PAID").length;

  return { iplSummary, recentEvents, lastPanic, unpaidCount };
}

const categoryConfig = {
  DUKA_CITA: { label: "Duka Cita", emoji: "🕌", class: "cat-duka" },
  PENGUMUMAN: { label: "Pengumuman", emoji: "📣", class: "cat-pengumuman" },
  KEGIATAN: { label: "Kegiatan", emoji: "🎉", class: "cat-kegiatan" },
  LAINNYA: { label: "Lainnya", emoji: "📋", class: "cat-lainnya" },
};

const statusConfig = {
  PAID: { label: "Lunas", icon: CheckCircle2, class: "status-paid" },
  UNPAID: { label: "Belum Bayar", icon: Clock, class: "status-unpaid" },
  OVERDUE: { label: "Terlambat", icon: AlertCircle, class: "status-overdue" },
};

const monthNames = [
  "", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { iplSummary, recentEvents, lastPanic, unpaidCount } =
    await getDashboardData(session.user.id);

  const quickActions = [
    {
      href: "/dashboard/ipl",
      label: "Bayar IPL",
      icon: CreditCard,
      color: "from-green-600 to-emerald-700",
      badge: unpaidCount > 0 ? unpaidCount : null,
    },
    {
      href: "/dashboard/cctv",
      label: "Live CCTV",
      icon: Camera,
      color: "from-blue-600 to-cyan-700",
      badge: null,
    },
    {
      href: "/dashboard/panic",
      label: "Darurat",
      icon: AlertTriangle,
      color: "from-red-600 to-rose-700",
      badge: null,
    },
    {
      href: "/dashboard/event",
      label: "Event Warga",
      icon: CalendarDays,
      color: "from-purple-600 to-violet-700",
      badge: null,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="animate-float-up">
        <div className="flex items-center gap-3 mb-1">
          <Home className="w-5 h-5 text-primary" />
          <span className="text-sm text-muted-foreground">Beranda</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Halo, {session.user.name?.split(" ")[0]}! 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {session.user.address ?? "Selamat datang di WargaKu"} ·{" "}
          {format(new Date(), "EEEE, dd MMMM yyyy", { locale: idLocale })}
        </p>
      </div>

      {/* Active Panic Alert Banner */}
      {lastPanic && (
        <div className="surface border-red-800/50 bg-red-950/30 p-4 rounded-xl flex items-start gap-3 animate-float-up">
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center flex-shrink-0 glow-red-pulse">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-red-400">⚠️ Alert Darurat Aktif!</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {lastPanic.user.name} membutuhkan bantuan di{" "}
              <span className="text-foreground font-medium">
                {lastPanic.user.address}
              </span>
            </p>
            <Link
              href="/dashboard/panic"
              className="text-xs text-red-400 underline mt-1 inline-block"
            >
              Lihat detail →
            </Link>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Menu Utama
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="relative surface p-5 flex flex-col items-start gap-3 hover-lift group overflow-hidden"
              >
                {/* Gradient background on hover */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                />
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">
                    {action.label}
                  </p>
                </div>
                {action.badge !== null && (
                  <span className="absolute top-3 right-3 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {action.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* IPL Summary */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Status IPL Terbaru
          </h2>
          <Link
            href="/dashboard/ipl"
            className="text-xs text-primary hover:underline"
          >
            Lihat Semua →
          </Link>
        </div>
        <div className="surface divide-y divide-border overflow-hidden">
          {iplSummary.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Belum ada data IPL
            </div>
          ) : (
            iplSummary.map((payment) => {
              const cfg = statusConfig[payment.status];
              const StatusIcon = cfg.icon;
              return (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-950 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">
                        {monthNames[payment.month]} {payment.year}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Rp {payment.amount.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.class}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Recent Events */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Pengumuman Terbaru
          </h2>
          <Link
            href="/dashboard/event"
            className="text-xs text-primary hover:underline"
          >
            Lihat Semua →
          </Link>
        </div>
        <div className="space-y-2">
          {recentEvents.map((event) => {
            const cat = categoryConfig[event.category];
            return (
              <Link
                href="/dashboard/event"
                key={event.id}
                className="surface p-4 flex items-start gap-3 hover-lift block"
              >
                <span className="text-2xl flex-shrink-0 mt-0.5">{cat.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">
                    {event.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {event.author.name} ·{" "}
                    {format(new Date(event.createdAt), "dd MMM", {
                      locale: idLocale,
                    })}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${cat.class}`}
                >
                  {cat.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
