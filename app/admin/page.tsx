import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  Shield,
  Users,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import Link from "next/link";

async function getAdminStats() {
  const [
    totalUsers,
    totalPaid,
    totalUnpaid,
    totalOverdue,
    activeAlerts,
    totalEvents,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "WARGA" } }),
    prisma.iplPayment.count({ where: { status: "PAID" } }),
    prisma.iplPayment.count({ where: { status: "UNPAID" } }),
    prisma.iplPayment.count({ where: { status: "OVERDUE" } }),
    prisma.panicAlert.count({ where: { isResolved: false } }),
    prisma.communityEvent.count(),
  ]);

  const totalRevenue = await prisma.iplPayment.aggregate({
    _sum: { amount: true },
    where: { status: "PAID" },
  });

  return {
    totalUsers,
    totalPaid,
    totalUnpaid,
    totalOverdue,
    activeAlerts,
    totalEvents,
    totalRevenue: totalRevenue._sum.amount ?? 0,
  };
}

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const stats = await getAdminStats();

  const statCards = [
    {
      label: "Total Warga",
      value: stats.totalUsers,
      icon: Users,
      color: "from-blue-600 to-cyan-700",
      sub: "Warga terdaftar",
    },
    {
      label: "IPL Lunas",
      value: stats.totalPaid,
      icon: CheckCircle2,
      color: "from-green-600 to-emerald-700",
      sub: "Pembayaran berhasil",
    },
    {
      label: "IPL Belum Bayar",
      value: stats.totalUnpaid + stats.totalOverdue,
      icon: Clock,
      color: "from-yellow-600 to-orange-700",
      sub: `${stats.totalOverdue} terlambat`,
    },
    {
      label: "Alert Aktif",
      value: stats.activeAlerts,
      icon: AlertTriangle,
      color: "from-red-600 to-rose-700",
      sub: "Butuh perhatian",
    },
    {
      label: "Total Pendapatan",
      value: `Rp ${(stats.totalRevenue / 1000).toFixed(0)}k`,
      icon: TrendingUp,
      color: "from-purple-600 to-violet-700",
      sub: "IPL terkumpul",
    },
    {
      label: "Pengumuman",
      value: stats.totalEvents,
      icon: CreditCard,
      color: "from-indigo-600 to-blue-700",
      sub: "Event dibuat",
    },
  ];

  const adminMenus = [
    {
      href: "/admin/warga",
      label: "Manajemen Warga",
      icon: Users,
      desc: "Lihat dan kelola daftar warga komplek",
      color: "from-blue-600 to-cyan-700",
    },
    {
      href: "/admin/ipl",
      label: "Laporan IPL",
      icon: CreditCard,
      desc: "Pantau status pembayaran semua warga",
      color: "from-green-600 to-emerald-700",
    },
    {
      href: "/admin/alerts",
      label: "Panic Alerts",
      icon: AlertTriangle,
      desc: "Kelola dan resolusi alert darurat",
      color: "from-red-600 to-rose-700",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="animate-float-up">
        <div className="flex items-center gap-3 mb-1">
          <Shield className="w-5 h-5 text-yellow-500" />
          <span className="text-sm text-muted-foreground">Panel Admin</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Dashboard Admin
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Selamat datang, {session.user.name} · Komplek WargaKu
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="surface p-4 hover-lift">
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm font-medium text-foreground/80 mt-0.5">
                {stat.label}
              </p>
              <p className="text-xs text-muted-foreground">{stat.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Admin Menus */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Kelola Komplek
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {adminMenus.map((menu) => {
            const Icon = menu.icon;
            return (
              <Link
                key={menu.href}
                href={menu.href}
                className="surface p-5 flex flex-col gap-3 hover-lift group overflow-hidden relative"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${menu.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                />
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${menu.color} flex items-center justify-center`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{menu.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {menu.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
