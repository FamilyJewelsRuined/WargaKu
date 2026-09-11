"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Home,
  Mail,
  Lock,
  LogIn,
  Shield,
  Truck,
  User,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const demoAccounts = [
  {
    label: "Admin / Ketua RT",
    email: "admin@wargaku.demo",
    password: "admin123",
    icon: Shield,
    color: "text-yellow-400",
    bg: "hover:bg-yellow-500/10 border-yellow-500/20",
  },
  {
    label: "Petugas Sampah",
    email: "petugas@wargaku.demo",
    password: "petugas123",
    icon: Truck,
    color: "text-blue-400",
    bg: "hover:bg-blue-500/10 border-blue-500/20",
  },
  {
    label: "Warga (Budi)",
    email: "budi@wargaku.demo",
    password: "warga123",
    icon: User,
    color: "text-green-400",
    bg: "hover:bg-green-500/10 border-green-500/20",
  },
  {
    label: "Warga (Siti)",
    email: "siti@wargaku.demo",
    password: "warga123",
    icon: User,
    color: "text-purple-400",
    bg: "hover:bg-purple-500/10 border-purple-500/20",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent, demoEmail?: string, demoPass?: string) => {
    e.preventDefault();
    const loginEmail = demoEmail ?? email;
    const loginPass = demoPass ?? password;
    if (!loginEmail || !loginPass) return;

    const key = demoEmail ?? "manual";
    if (demoEmail) setLoadingDemo(key);
    else setLoading(true);

    try {
      const res = await signIn("credentials", {
        email: loginEmail,
        password: loginPass,
        redirect: false,
      });

      if (res?.error) {
        toast.error("Email atau password salah");
      } else {
        toast.success("Login berhasil! Selamat datang 👋");
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast.error("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
      setLoadingDemo(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-green-900/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-float-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-primary mb-4 glow-green shadow-2xl">
            <Home className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">WargaKu</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Aplikasi Manajemen Warga Komplek
          </p>
        </div>

        {/* Login Form */}
        <div className="surface p-6 mb-4">
          <h2 className="text-lg font-semibold mb-4">Masuk ke Akun Anda</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-muted/50 border-border"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-muted/50 border-border"
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full gradient-primary text-white font-semibold h-11 glow-green"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <LogIn className="w-4 h-4 mr-2" />
              )}
              {loading ? "Masuk..." : "Masuk"}
            </Button>
          </form>
        </div>

        {/* Demo Accounts */}
        <div className="surface p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground font-medium px-2">
              AKUN DEMO
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <p className="text-xs text-muted-foreground mb-3 text-center">
            Klik untuk login langsung tanpa mengetik
          </p>
          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map((acc) => {
              const Icon = acc.icon;
              const isLoading = loadingDemo === acc.email;
              return (
                <button
                  key={acc.email}
                  onClick={(e) => handleLogin(e, acc.email, acc.password)}
                  disabled={!!loadingDemo || loading}
                  className={`flex items-center gap-2 p-3 rounded-xl border bg-transparent transition-all duration-200 text-left ${acc.bg} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isLoading ? (
                    <Loader2 className={`w-4 h-4 animate-spin ${acc.color} flex-shrink-0`} />
                  ) : (
                    <Icon className={`w-4 h-4 ${acc.color} flex-shrink-0`} />
                  )}
                  <span className="text-xs text-foreground/80 font-medium leading-tight">
                    {acc.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2025 WargaKu · Manajemen Komplek Digital
        </p>
      </div>
    </div>
  );
}
