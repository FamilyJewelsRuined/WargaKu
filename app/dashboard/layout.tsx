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
  User,
  Menu,
  X,
  Bell,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { PushNotificationInit } from "@/components/push-init";

const navItems = [
  { href: "/dashboard", label: "Beranda", icon: Home },
  { href: "/dashboard/ipl", label: "Bayar IPL", icon: CreditCard },
  { href: "/dashboard/cctv", label: "Live CCTV", icon: Camera },
  { href: "/dashboard/panic", label: "Darurat", icon: AlertTriangle },
  { href: "/dashboard/event", label: "Event", icon: CalendarDays },
];

function NavLink({
  item,
  onClick,
}: {
  item: (typeof navItems)[0];
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
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
        isActive
          ? "bg-primary/10 text-primary border border-primary/20"
          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
      )}
    >
      <Icon
        className={cn(
          "w-5 h-5 flex-shrink-0 transition-colors",
          isActive ? "text-primary" : "group-hover:text-foreground"
        )}
      />
      <span className="font-medium text-sm">{item.label}</span>
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
    <div className="flex flex-col h-full gradient-sidebar">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 glow-green">
            <Home className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">WargaKu</h1>
            <p className="text-xs text-muted-foreground">Komplek Digital</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} onClick={onClose} />
        ))}

        {/* Admin link */}
        {user?.role === "ADMIN" && (
          <>
            <div className="pt-4 pb-2">
              <p className="text-xs text-muted-foreground font-medium px-4 uppercase tracking-wider">
                Admin
              </p>
            </div>
            <Link
              href="/admin"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-yellow-400 hover:bg-yellow-500/10 transition-all duration-200 group"
            >
              <Shield className="w-5 h-5 text-yellow-500" />
              <span className="font-medium text-sm">Panel Admin</span>
            </Link>
          </>
        )}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 p-3 rounded-xl glass">
          <Avatar className="w-9 h-9 border-2 border-primary/30">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() ?? "W"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {user?.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.houseNumber ?? user?.role}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border pb-safe md:hidden">
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const isPanic = item.href === "/dashboard/panic";

          if (isPanic) {
            return (
              <Link key={item.href} href={item.href} className="relative">
                <div
                  className={cn(
                    "w-14 h-14 -mt-6 rounded-full flex items-center justify-center shadow-lg transition-all duration-200",
                    isActive
                      ? "gradient-danger glow-red"
                      : "bg-red-600 hover:bg-red-500"
                  )}
                >
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <span className="block text-center text-[10px] text-red-400 mt-1 font-medium">
                  Darurat
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "nav-item",
                isActive && "active"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function TopBar() {
  const { data: session } = useSession();
  const user = session?.user;
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border md:hidden">
      <div className="flex items-center justify-between px-4 h-14">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
              <Menu className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 border-border bg-background">
            <Sidebar onClose={() => setOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
            <Home className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-foreground">WargaKu</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1">
              <Avatar className="w-8 h-8 border border-primary/30">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() ?? "W"}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card border-border">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {user?.name}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-[260px] z-40 hidden md:block border-r border-border">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <div className="md:ml-[260px] flex flex-col min-h-screen">
        {/* Mobile TopBar */}
        <TopBar />

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* PWA Push Notification Init */}
      <PushNotificationInit />
    </div>
  );
}
