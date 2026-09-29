"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import {
  Home,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Shield,
  Truck,
  User,
  Loader2,
} from "lucide-react";

/* ─── Demo accounts (unchanged logic) ─────────────────────────────── */
const demoAccounts = [
  {
    label: "Admin / Ketua RT",
    email: "admin@wargaku.demo",
    password: "admin123",
    icon: Shield,
    color: "#f59e0b",
  },
  {
    label: "Petugas Sampah",
    email: "petugas@wargaku.demo",
    password: "petugas123",
    icon: Truck,
    color: "#3b82f6",
  },
  {
    label: "Warga (Budi)",
    email: "budi@wargaku.demo",
    password: "warga123",
    icon: User,
    color: "#22c55e",
  },
  {
    label: "Warga (Siti)",
    email: "siti@wargaku.demo",
    password: "warga123",
    icon: User,
    color: "#a855f7",
  },
];

/* ─── Google G SVG ──────────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M43.611 20.083H42V20H24v8h11.303C33.973 32.281 29.418 35 24 35c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
      <path d="M6.306 14.691l6.571 4.819C14.655 16.108 19.000 13 24 13c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
      <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.398 0-9.946-3.647-11.548-8.548l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
      <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
    </svg>
  );
}

/* ─── Page Component ─────────────────────────────────────────────── */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(false);

  const handleLogin = async (
    e: React.FormEvent,
    demoEmail?: string,
    demoPass?: string
  ) => {
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
    <>
      <style>{`
        .login-root {
          min-height: 100svh;
          background: linear-gradient(180deg, #deeaf8 0%, #eef4fb 40%, #f5f9ff 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          overflow-y: auto;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: #1a2a3a;
          -webkit-font-smoothing: antialiased;
        }

        /* clouds bg decorations */
        .login-root::before {
          content: '';
          position: fixed;
          top: -60px; left: -80px;
          width: 260px; height: 160px;
          background: radial-gradient(ellipse, rgba(255,255,255,0.85) 60%, transparent 100%);
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
        }
        .login-root::after {
          content: '';
          position: fixed;
          top: 20px; right: -60px;
          width: 200px; height: 120px;
          background: radial-gradient(ellipse, rgba(255,255,255,0.7) 60%, transparent 100%);
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
        }

        .login-inner {
          width: 100%;
          max-width: 420px;
          padding: 36px 24px 40px;
          position: relative;
          z-index: 1;
          animation: loginFadeUp 0.45s ease-out both;
        }

        @keyframes loginFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Logo ── */
        .login-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 4px;
        }
        .login-logo-icon {
          width: 44px; height: 44px;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 16px rgba(37,99,235,0.35);
          flex-shrink: 0;
        }
        .login-logo-text {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: #1e293b;
          line-height: 1;
        }
        .login-logo-text span {
          color: #2563eb;
        }
        .login-subtitle {
          text-align: center;
          font-size: 13.5px;
          color: #64748b;
          line-height: 1.55;
          margin-top: 6px;
          margin-bottom: 20px;
        }

        /* ── Illustration ── */
        .login-illustration {
          width: 100%;
          height: 190px;
          position: relative;
          margin-bottom: 22px;
          border-radius: 20px;
          overflow: hidden;
        }

        /* ── Welcome text ── */
        .login-welcome-title {
          font-size: 22px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 6px;
        }
        .login-welcome-sub {
          font-size: 13.5px;
          color: #64748b;
          margin: 0 0 22px;
          line-height: 1.55;
        }

        /* ── Input field ── */
        .login-field {
          position: relative;
          margin-bottom: 14px;
        }
        .login-field-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
          width: 18px; height: 18px;
        }
        .login-input {
          width: 100%;
          height: 52px;
          padding: 0 48px 0 46px;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 14px;
          font-size: 14.5px;
          color: #1e293b;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: inherit;
        }
        .login-input::placeholder { color: #94a3b8; }
        .login-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }
        .login-eye-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
          color: #94a3b8;
          display: flex; align-items: center;
          transition: color 0.15s;
        }
        .login-eye-btn:hover { color: #2563eb; }

        /* ── Remember / Forgot ── */
        .login-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 22px;
        }
        .login-remember {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 13.5px;
          color: #475569;
          user-select: none;
        }
        .login-checkbox {
          appearance: none;
          -webkit-appearance: none;
          width: 18px; height: 18px;
          border: 2px solid #cbd5e1;
          border-radius: 5px;
          cursor: pointer;
          background: #fff;
          transition: all 0.15s;
          flex-shrink: 0;
          position: relative;
        }
        .login-checkbox:checked {
          background: #2563eb;
          border-color: #2563eb;
        }
        .login-checkbox:checked::after {
          content: '';
          position: absolute;
          left: 3px; top: 0px;
          width: 6px; height: 10px;
          border: 2px solid white;
          border-top: none;
          border-left: none;
          transform: rotate(45deg);
        }
        .login-forgot {
          font-size: 13.5px;
          font-weight: 600;
          color: #2563eb;
          text-decoration: none;
          transition: opacity 0.15s;
        }
        .login-forgot:hover { opacity: 0.75; }

        /* ── Primary button ── */
        .login-btn-primary {
          width: 100%;
          height: 52px;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #ffffff;
          border: none;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 6px 20px rgba(37,99,235,0.38);
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          font-family: inherit;
          margin-bottom: 20px;
        }
        .login-btn-primary:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(37,99,235,0.45);
        }
        .login-btn-primary:active:not(:disabled) { transform: translateY(0); }
        .login-btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }

        /* ── Divider ── */
        .login-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          color: #94a3b8;
          font-size: 13px;
        }
        .login-divider::before,
        .login-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e2e8f0;
        }

        /* ── Google button ── */
        .login-btn-google {
          width: 100%;
          height: 52px;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 16px;
          font-size: 14.5px;
          font-weight: 600;
          color: #1e293b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
          font-family: inherit;
          margin-bottom: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .login-btn-google:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          box-shadow: 0 4px 14px rgba(0,0,0,0.1);
        }

        /* ── Footer link ── */
        .login-footer {
          text-align: center;
          font-size: 13.5px;
          color: #64748b;
        }
        .login-footer a {
          color: #2563eb;
          font-weight: 700;
          text-decoration: none;
          margin-left: 4px;
        }
        .login-footer a:hover { text-decoration: underline; }

        /* ── Demo section ── */
        .login-demo-toggle {
          text-align: center;
          margin-top: 20px;
        }
        .login-demo-toggle button {
          background: none;
          border: none;
          font-size: 12px;
          color: #94a3b8;
          cursor: pointer;
          font-family: inherit;
          padding: 4px 8px;
          border-radius: 6px;
          transition: color 0.15s, background 0.15s;
        }
        .login-demo-toggle button:hover {
          color: #475569;
          background: rgba(0,0,0,0.05);
        }

        .login-demo-panel {
          margin-top: 16px;
          background: rgba(255,255,255,0.7);
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 16px;
          backdrop-filter: blur(8px);
        }
        .login-demo-label {
          text-align: center;
          font-size: 11.5px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 10px;
        }
        .login-demo-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .login-demo-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          cursor: pointer;
          font-family: inherit;
          font-size: 12px;
          color: #334155;
          font-weight: 500;
          transition: all 0.15s;
          text-align: left;
        }
        .login-demo-btn:hover:not(:disabled) {
          border-color: #2563eb;
          background: #eff6ff;
          color: #1e40af;
        }
        .login-demo-btn:disabled { opacity: 0.55; cursor: not-allowed; }
      `}</style>

      <div className="login-root">
        <div className="login-inner">
          {/* ── Logo ── */}
          <div className="login-logo">
            <div className="login-logo-icon">
              <Home size={22} color="white" strokeWidth={2.5} />
            </div>
            <div className="login-logo-text">
              Warga<span>Ku</span>
            </div>
          </div>
          <p className="login-subtitle">
            Aplikasi Komunitas Warga<br />untuk Lingkungan yang Lebih Baik
          </p>

          {/* ── Illustration ── */}
          <div className="login-illustration">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/11.png"
              alt="Komunitas warga"
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
            />
          </div>

          {/* ── Welcome ── */}
          <h1 className="login-welcome-title">Selamat Datang Kembali!</h1>
          <p className="login-welcome-sub">
            Masuk ke akun Anda untuk mengakses<br />semua layanan warga.
          </p>

          {/* ── Form ── */}
          <form onSubmit={handleLogin} noValidate>
            {/* Email */}
            <div className="login-field">
              <Mail className="login-field-icon" />
              <input
                id="login-email"
                type="email"
                className="login-input"
                placeholder="Email atau Nomor HP"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="login-field">
              <Lock className="login-field-icon" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                className="login-input"
                placeholder="Kata Sandi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-eye-btn"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Remember + Forgot */}
            <div className="login-meta">
              <label className="login-remember">
                <input
                  type="checkbox"
                  className="login-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  id="login-remember"
                />
                Ingat saya
              </label>
              <a href="#" className="login-forgot">
                Lupa kata sandi?
              </a>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              className="login-btn-primary"
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <ArrowRight size={18} />
              )}
              {loading ? "Masuk..." : "Masuk"}
            </button>
          </form>

          {/* ── Divider ── */}
          <div className="login-divider">atau</div>

          {/* ── Google ── */}
          <button
            id="login-google"
            type="button"
            className="login-btn-google"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          >
            <GoogleIcon />
            Masuk dengan Google
          </button>

          {/* ── Register link ── */}
          <p className="login-footer">
            Belum punya akun?
            <Link href="/register">Daftar sekarang</Link>
          </p>

          {/* ── Demo Accounts (collapsible) ── */}
          <div className="login-demo-toggle">
            <button
              type="button"
              onClick={() => setShowDemo((v) => !v)}
              aria-expanded={showDemo}
            >
              {showDemo ? "▲ Tutup akun demo" : "▾ Akun demo tersedia"}
            </button>
          </div>

          {showDemo && (
            <div className="login-demo-panel">
              <p className="login-demo-label">Klik untuk login langsung</p>
              <div className="login-demo-grid">
                {demoAccounts.map((acc) => {
                  const Icon = acc.icon;
                  const isLoading = loadingDemo === acc.email;
                  return (
                    <button
                      key={acc.email}
                      type="button"
                      className="login-demo-btn"
                      onClick={(e) => handleLogin(e, acc.email, acc.password)}
                      disabled={!!loadingDemo || loading}
                    >
                      {isLoading ? (
                        <Loader2
                          size={15}
                          className="animate-spin"
                          style={{ color: acc.color, flexShrink: 0 }}
                        />
                      ) : (
                        <Icon
                          size={15}
                          style={{ color: acc.color, flexShrink: 0 }}
                        />
                      )}
                      {acc.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
