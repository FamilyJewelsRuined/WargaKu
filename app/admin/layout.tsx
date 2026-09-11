import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Shield, Home, ArrowLeft } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Topbar */}
      <header className="sticky top-0 z-40 bg-yellow-950/30 backdrop-blur-xl border-b border-yellow-900/30">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-yellow-500" />
            </div>
            <div>
              <span className="font-bold text-foreground text-sm">Panel Admin</span>
              <p className="text-xs text-muted-foreground">WargaKu</p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
          >
            <Home className="w-3.5 h-3.5" />
            Kembali ke App
          </Link>
        </div>
      </header>

      {/* Admin Nav */}
      <nav className="border-b border-border bg-card/50">
        <div className="max-w-5xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {[
            { href: "/admin", label: "Dashboard" },
            { href: "/admin/warga", label: "Warga" },
            { href: "/admin/ipl", label: "Laporan IPL" },
            { href: "/admin/alerts", label: "Panic Alerts" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex-shrink-0 px-4 py-3 text-sm text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-primary transition-all"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-5xl mx-auto p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
