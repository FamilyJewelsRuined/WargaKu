"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Home,
  CreditCard,
  Camera,
  AlertTriangle,
  CalendarDays,
  LogOut,
  Shield,
  MessageSquare,
  Users,
  User,
  Bell,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { PushNotificationInit } from "@/components/push-init";

/* ── Nav items ───────────────────────────────────────────────────── */
const bottomNavItems = [
  { href: "/dashboard", label: "Beranda", icon: Home },
  { href: "/dashboard/event", label: "Pesan", icon: MessageSquare },
  { href: "/dashboard/ipl", label: "Warga", icon: Users },
  { href: "/dashboard/cctv", label: "CCTV", icon: Camera },
  { href: "/dashboard/event", label: "Event", icon: CalendarDays },
  { href: "#profil", label: "Profil", icon: User },
];

const sidebarNavItems = [
  { href: "/dashboard", label: "Beranda", icon: Home },
  { href: "/dashboard/ipl", label: "Bayar IPL", icon: CreditCard },
  { href: "/dashboard/cctv", label: "Live CCTV", icon: Camera },
  { href: "/dashboard/panic", label: "Darurat", icon: AlertTriangle },
  { href: "/dashboard/event", label: "Event", icon: CalendarDays },
];

/* ── Sidebar (White theme — desktop & mobile drawer) ─────────────── */
function SidebarNavLink({
  item,
  onClick,
}: {
  item: (typeof sidebarNavItems)[0];
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive =
    item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 group font-medium text-sm",
        isActive
          ? "bg-blue-50 text-blue-600 font-semibold border border-blue-200/80 shadow-xs"
          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
      )}
    >
      <Icon
        className={cn(
          "w-5 h-5 flex-shrink-0 transition-colors",
          isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-700"
        )}
      />
      <span>{item.label}</span>
      {item.href === "/dashboard/panic" && (
        <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      )}
    </Link>
  );
}

function Sidebar({ onClose }: { onClose?: () => void }) {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <div className="flex flex-col h-full bg-white text-slate-800">
      {/* Header */}
      <div className="p-5 border-b border-[#e8eef6]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20">
            <Home className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-slate-900 tracking-tight leading-tight">
              Warga<span className="text-blue-600">Ku</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">Komplek Digital</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto">
        {sidebarNavItems.map((item) => (
          <SidebarNavLink key={item.href} item={item} onClick={onClose} />
        ))}
        {user?.role === "ADMIN" && (
          <>
            <div className="pt-4 pb-1">
              <p className="text-[11px] text-slate-400 font-bold px-3.5 uppercase tracking-wider">
                Admin
              </p>
            </div>
            <Link
              href="/admin"
              onClick={onClose}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-amber-700 hover:bg-amber-50 border border-transparent hover:border-amber-200/70 font-medium text-sm transition-all group"
            >
              <Shield className="w-5 h-5 text-amber-500" />
              <span>Panel Admin</span>
            </Link>
          </>
        )}
      </nav>

      {/* User profile footer */}
      <div className="p-3.5 border-t border-[#e8eef6]">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 text-sm font-bold">
              {user?.name?.charAt(0)?.toUpperCase() ?? "W"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">
              {user?.houseNumber ? `No. ${user.houseNumber}` : user?.role}
            </p>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
            title="Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Bottom Navigation (mobile — light theme) ────────────────────── */
function BottomNav({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <style>{`
        .dash-bottom-nav {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 50;
          background: #ffffff;
          border-top: 1px solid #e8eef6;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.06);
          padding-bottom: max(8px, env(safe-area-inset-bottom));
        }
        .dash-bottom-nav-inner {
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          padding: 8px 0 0;
        }
        .dash-bnav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 4px 6px;
          text-decoration: none;
          color: #94a3b8;
          transition: color 0.15s;
          position: relative;
          min-width: 48px;
        }
        .dash-bnav-item.active {
          color: #2563eb;
        }
        .dash-bnav-item.active::before {
          content: '';
          position: absolute;
          top: -8px; left: 50%; transform: translateX(-50%);
          width: 32px; height: 3px;
          background: #2563eb;
          border-radius: 0 0 3px 3px;
        }
        .dash-bnav-label {
          font-size: 9.5px;
          font-weight: 500;
          font-family: inherit;
        }
      `}</style>
      <nav className="dash-bottom-nav md:hidden">
        <div className="dash-bottom-nav-inner">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href) &&
                  ((item.href === "/dashboard/cctv" && item.label === "CCTV") ||
                   (item.href === "/dashboard/event" && item.label === "Event") ||
                   (item.href !== "/dashboard/event" && item.href !== "/dashboard/cctv"));

            if (item.label === "Profil") {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={onOpenSidebar}
                  className="dash-bnav-item"
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  <Icon size={22} strokeWidth={1.8} />
                  <span className="dash-bnav-label">{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn("dash-bnav-item", isActive && "active")}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="dash-bnav-label">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

/* ── Top Bar (mobile — light theme with hamburger menu) ───────────── */
function TopBar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  return (
    <>
      <style>{`
        .dash-topbar {
          position: sticky;
          top: 0;
          z-index: 40;
          background: #ffffff;
          border-bottom: 1px solid #e8eef6;
          padding: 0 16px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        @media (min-width: 768px) {
          .dash-topbar {
            display: none !important;
          }
        }
        .dash-topbar-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .dash-topbar-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }
        .dash-topbar-logo-icon {
          width: 34px; height: 34px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 8px rgba(37,99,235,0.3);
        }
        .dash-topbar-title {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.3px;
        }
        .dash-topbar-title span { color: #2563eb; }
        .dash-topbar-actions {
          display: flex; align-items: center; gap: 8px;
        }
        .dash-topbar-icon-btn {
          width: 38px; height: 38px;
          border-radius: 10px;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: #475569;
          position: relative;
          transition: background 0.15s, color 0.15s;
        }
        .dash-topbar-icon-btn:hover { background: #e2e8f0; color: #0f172a; }
        .dash-topbar-badge {
          position: absolute;
          top: 6px; right: 6px;
          width: 8px; height: 8px;
          background: #ef4444;
          border-radius: 50%;
          border: 1.5px solid #fff;
        }
      `}</style>
      <header className="dash-topbar md:hidden">
        {/* Left: Hamburger menu + Logo */}
        <div className="dash-topbar-left">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="dash-topbar-icon-btn"
            aria-label="Buka Menu Sidebar"
          >
            <Menu size={20} />
          </button>

          <Link href="/dashboard" className="dash-topbar-logo">
            <div className="dash-topbar-logo-icon">
              <Home size={18} color="white" strokeWidth={2.5} />
            </div>
            <span className="dash-topbar-title">
              Warga<span>Ku</span>
            </span>
          </Link>
        </div>

        {/* Right: Notifications + Profile */}
        <div className="dash-topbar-actions">
          <Link href="/dashboard/event" className="dash-topbar-icon-btn" aria-label="Notifikasi">
            <Bell size={18} />
            <span className="dash-topbar-badge" />
          </Link>

          <button
            type="button"
            onClick={onOpenSidebar}
            className="dash-topbar-icon-btn"
            aria-label="Profil & Menu"
          >
            <User size={18} />
          </button>
        </div>
      </header>
    </>
  );
}

/* ── Layout ──────────────────────────────────────────────────────── */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <style>{`
        /* Light theme override for dashboard shell */
        .dash-shell {
          min-height: 100svh;
          background: #f5f8fc;
        }
        .dash-content {
          padding-bottom: 80px; /* space for bottom nav */
        }
        @media (min-width: 768px) {
          .dash-content {
            margin-left: 260px;
            padding-bottom: 24px;
          }
        }
      `}</style>
      <div className="dash-shell">
        {/* Desktop Sidebar (White) */}
        <aside className="fixed left-0 top-0 bottom-0 w-[260px] z-40 hidden md:block bg-white border-r border-[#e8eef6]">
          <Sidebar />
        </aside>

        {/* Mobile Sidebar Sheet Drawer */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent
            side="left"
            className="w-[280px] p-0 border-r border-[#e8eef6] bg-white text-slate-800"
          >
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="dash-content flex flex-col min-h-screen">
          <TopBar onOpenSidebar={() => setSidebarOpen(true)} />
          <main className="flex-1 p-0 md:p-6">{children}</main>
        </div>

        {/* Mobile Bottom Nav */}
        <BottomNav onOpenSidebar={() => setSidebarOpen(true)} />

        {/* PWA Push */}
        <PushNotificationInit />
      </div>
    </>
  );
}
