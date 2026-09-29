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
  ChevronRight,
  Megaphone,
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
      sub: "Warga terdaftar",
      iconBg: "linear-gradient(135deg, #2563eb, #1d4ed8)",
      iconShadow: "rgba(37,99,235,0.3)",
      icon: Users,
      borderColor: "#dbeafe",
      badge: null as number | null,
    },
    {
      label: "IPL Lunas",
      value: stats.totalPaid,
      sub: "Pembayaran berhasil",
      iconBg: "linear-gradient(135deg, #16a34a, #15803d)",
      iconShadow: "rgba(22,163,74,0.3)",
      icon: CheckCircle2,
      borderColor: "#dcfce7",
      badge: null as number | null,
    },
    {
      label: "IPL Belum Bayar",
      value: stats.totalUnpaid + stats.totalOverdue,
      sub: `${stats.totalOverdue} terlambat`,
      iconBg: "linear-gradient(135deg, #d97706, #b45309)",
      iconShadow: "rgba(217,119,6,0.3)",
      icon: Clock,
      borderColor: "#fef3c7",
      badge: stats.totalOverdue > 0 ? stats.totalOverdue : null as number | null,
    },
    {
      label: "Alert Aktif",
      value: stats.activeAlerts,
      sub: stats.activeAlerts > 0 ? "Butuh perhatian!" : "Komplek aman",
      iconBg: "linear-gradient(135deg, #dc2626, #b91c1c)",
      iconShadow: "rgba(220,38,38,0.3)",
      icon: AlertTriangle,
      borderColor: stats.activeAlerts > 0 ? "#fecaca" : "#fee2e2",
      badge: null as number | null,
    },
    {
      label: "Total Pendapatan",
      value: `Rp ${(stats.totalRevenue / 1000).toFixed(0)}k`,
      sub: "IPL terkumpul",
      iconBg: "linear-gradient(135deg, #7c3aed, #6d28d9)",
      iconShadow: "rgba(124,58,237,0.3)",
      icon: TrendingUp,
      borderColor: "#ede9fe",
      badge: null as number | null,
    },
    {
      label: "Pengumuman",
      value: stats.totalEvents,
      sub: "Event dibuat",
      iconBg: "linear-gradient(135deg, #0891b2, #0e7490)",
      iconShadow: "rgba(8,145,178,0.3)",
      icon: Megaphone,
      borderColor: "#cffafe",
      badge: null as number | null,
    },
  ];

  const adminMenus = [
    {
      href: "/admin/warga",
      label: "Manajemen Warga",
      desc: "Lihat dan kelola daftar warga komplek",
      accentColor: "#2563eb",
      accentBg: "#eff6ff",
      icon: Users,
      badge: undefined as number | undefined,
    },
    {
      href: "/admin/ipl",
      label: "Laporan IPL",
      desc: "Pantau status pembayaran semua warga",
      accentColor: "#16a34a",
      accentBg: "#f0fdf4",
      icon: CreditCard,
      badge: undefined as number | undefined,
    },
    {
      href: "/admin/alerts",
      label: "Panic Alerts",
      desc: "Kelola dan resolusi alert darurat",
      accentColor: "#dc2626",
      accentBg: "#fff1f2",
      icon: AlertTriangle,
      badge: stats.activeAlerts > 0 ? stats.activeAlerts : undefined,
    },
  ];

  return (
    <>
      <style>{`
        .admin-page { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; }
        .admin-stat-card {
          background: #ffffff;
          border-radius: 18px;
          padding: 18px 16px;
          position: relative;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          transition: transform 0.18s, box-shadow 0.18s;
          border-width: 1.5px;
          border-style: solid;
        }
        .admin-stat-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.08); }
        .admin-menu-card {
          background: #ffffff;
          border: 1.5px solid #e8eef6;
          border-radius: 18px;
          padding: 20px;
          display: flex;
          align-items: flex-start;
          gap: 16px;
          text-decoration: none;
          color: inherit;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          transition: transform 0.18s, box-shadow 0.18s;
        }
        .admin-menu-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
        .admin-section-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #94a3b8;
          margin: 0 0 14px;
        }
        @media (min-width: 768px) {
          .admin-stats-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .admin-menus-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>

      <div className="admin-page" style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {/* ── Header ── */}
        <div style={{ paddingBottom: 20, borderBottom: "1.5px solid #e8eef6" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Shield size={15} color="#d97706" strokeWidth={2.5} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#92400e", letterSpacing: "0.03em" }}>
              Panel Admin · WargaKu
            </span>
          </div>
          <h1 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.4px" }}>
            Dashboard Admin
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
            Selamat datang, {session.user.name} — Komplek WargaKu
          </p>
        </div>

        {/* ── Stats Grid ── */}
        <div>
          <p className="admin-section-label">Ringkasan Statistik</p>
          <div
            className="admin-stats-grid"
            style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}
          >
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="admin-stat-card"
                  style={{ borderColor: stat.borderColor }}
                >
                  {stat.badge !== null && (
                    <span style={{
                      position: "absolute", top: 10, right: 10,
                      background: "#dc2626", color: "#fff",
                      fontSize: 10, fontWeight: 700,
                      padding: "2px 7px", borderRadius: 20,
                    }}>{stat.badge}</span>
                  )}
                  <div style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: stat.iconBg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: `0 3px 10px ${stat.iconShadow}`,
                    marginBottom: 14,
                  }}>
                    <Icon size={20} color="white" strokeWidth={2} />
                  </div>
                  <p style={{ margin: "0 0 2px", fontSize: 26, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>
                    {stat.value}
                  </p>
                  <p style={{ margin: "4px 0 2px", fontSize: 13, fontWeight: 600, color: "#334155" }}>
                    {stat.label}
                  </p>
                  <p style={{ margin: 0, fontSize: 11.5, color: "#94a3b8" }}>{stat.sub}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Admin Menus ── */}
        <div>
          <p className="admin-section-label">Kelola Komplek</p>
          <div
            className="admin-menus-grid"
            style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}
          >
            {adminMenus.map((menu) => {
              const Icon = menu.icon;
              return (
                <Link key={menu.href} href={menu.href} className="admin-menu-card">
                  <div style={{
                    width: 48, height: 48,
                    borderRadius: 14,
                    background: menu.accentBg,
                    border: `1.5px solid ${menu.accentColor}22`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Icon size={22} color={menu.accentColor} strokeWidth={2} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 14.5, color: "#0f172a" }}>
                        {menu.label}
                      </p>
                      {menu.badge && (
                        <span style={{
                          background: "#dc2626", color: "#fff",
                          fontSize: 10, fontWeight: 700,
                          padding: "2px 8px", borderRadius: 20,
                        }}>{menu.badge} aktif</span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: 12.5, color: "#64748b", lineHeight: 1.4 }}>
                      {menu.desc}
                    </p>
                  </div>
                  <ChevronRight size={18} color="#cbd5e1" style={{ flexShrink: 0, marginTop: 2 }} />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
