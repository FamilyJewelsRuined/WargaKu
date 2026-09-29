import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Shield, Home, LayoutDashboard, Users, CreditCard, AlertTriangle } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  const navItems = [
    { href: "/admin",        label: "Dashboard",   icon: LayoutDashboard },
    { href: "/admin/warga",  label: "Warga",        icon: Users },
    { href: "/admin/ipl",    label: "Laporan IPL",  icon: CreditCard },
    { href: "/admin/alerts", label: "Panic Alerts", icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#f5f7fa" }}>
      {/* ── Admin Topbar ── */}
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "#ffffff",
        borderBottom: "1.5px solid #f0e6d0",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        height: 56,
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Amber badge */}
          <div style={{
            width: 36, height: 36,
            borderRadius: 10,
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(245,158,11,0.35)",
            flexShrink: 0,
          }}>
            <Shield size={18} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: "#0f172a", letterSpacing: "-0.2px" }}>
              Panel Admin
            </p>
            <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>
              WargaKu — {session.user.name}
            </p>
          </div>
        </div>
        <Link
          href="/dashboard"
          style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 12.5, fontWeight: 600, color: "#64748b",
            textDecoration: "none",
            padding: "7px 13px",
            borderRadius: 10,
            border: "1.5px solid #e2e8f0",
            background: "#f8fafc",
            transition: "all 0.15s",
          }}
        >
          <Home size={14} />
          Kembali ke App
        </Link>
      </header>

      {/* ── Admin Nav Tabs ── */}
      <nav style={{
        background: "#ffffff",
        borderBottom: "1px solid #e8eef6",
        padding: "0 20px",
        display: "flex",
        gap: 4,
        overflowX: "auto",
      }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 14px",
                fontSize: 13,
                fontWeight: 600,
                color: "#64748b",
                textDecoration: "none",
                borderBottom: "2.5px solid transparent",
                whiteSpace: "nowrap",
                transition: "color 0.15s, border-color 0.15s",
                flexShrink: 0,
              }}
            >
              <Icon size={14} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* ── Content ── */}
      <main style={{ maxWidth: 1040, margin: "0 auto", padding: "28px 20px 60px" }}>
        {children}
      </main>
    </div>
  );
}
