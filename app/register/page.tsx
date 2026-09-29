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
  User,
  Phone,
  MapPin,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password || !address.trim()) {
      toast.error("Mohon lengkapi semua kolom wajib");
      return;
    }

    if (password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          address: address.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal melakukan pendaftaran");
      }

      toast.success("Pendaftaran berhasil! Mengalihkan ke sistem...");

      // Otomatis login dan arahkan ke /waiting
      const loginRes = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (loginRes?.error) {
        toast.info("Akun terdaftar. Silakan masuk secara manual.");
        router.push("/login");
      } else {
        router.push("/waiting");
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat pendaftaran";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .register-root {
          min-height: 100svh;
          background: linear-gradient(180deg, #deeaf8 0%, #eef4fb 40%, #f5f9ff 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 40px 16px;
          overflow-y: auto;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: #1a2a3a;
          -webkit-font-smoothing: antialiased;
        }

        .register-card {
          width: 100%;
          max-width: 480px;
          background: #ffffff;
          border-radius: 24px;
          box-shadow: 0 10px 40px -10px rgba(15, 34, 58, 0.08), 0 0 1px 1px rgba(15, 34, 58, 0.04);
          padding: 36px 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          margin-top: 10px;
          margin-bottom: 24px;
        }

        @media (max-width: 480px) {
          .register-card {
            padding: 28px 20px;
            border-radius: 20px;
          }
        }

        .brand-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 12px;
        }

        .brand-icon-box {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          box-shadow: 0 8px 16px -4px rgba(37, 99, 235, 0.35);
        }

        .brand-title {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.025em;
          margin: 0;
        }

        .brand-desc {
          font-size: 14px;
          color: #64748b;
          margin: 0;
          line-height: 1.5;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-label {
          font-size: 13px;
          font-weight: 600;
          color: #334155;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          color: #94a3b8;
          pointer-events: none;
        }

        .text-input {
          width: 100%;
          height: 44px;
          padding: 0 14px 0 42px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          font-size: 14px;
          color: #0f172a;
          transition: all 0.15s ease;
          outline: none;
        }

        .text-input:focus {
          border-color: #3b82f6;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        }

        .toggle-password {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 4px;
        }

        .toggle-password:hover {
          color: #475569;
        }

        .notice-box {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          gap: 10px;
          align-items: flex-start;
          font-size: 12.5px;
          color: #166534;
          line-height: 1.45;
        }

        .btn-submit {
          height: 46px;
          border-radius: 12px;
          background: #2563eb;
          color: #ffffff;
          border: none;
          font-size: 15px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
        }

        .btn-submit:hover:not(:disabled) {
          background: #1d4ed8;
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
        }

        .btn-submit:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .footer-text {
          text-align: center;
          font-size: 13.5px;
          color: #64748b;
          margin: 0;
        }

        .footer-link {
          color: #2563eb;
          font-weight: 600;
          text-decoration: none;
          margin-left: 5px;
        }

        .footer-link:hover {
          text-decoration: underline;
        }
      `}</style>

      <main className="register-root">
        <div className="register-card">
          <div className="brand-header">
            <div className="brand-icon-box">
              <Home size={26} strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="brand-title">Daftar Akun Warga</h1>
              <p className="brand-desc">
                Bergabung dengan portal digital WargaKu untuk mempermudah layanan RT & IPL
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Nama Lengkap */}
            <div className="form-group">
              <label htmlFor="reg-name" className="form-label">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input
                  id="reg-name"
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-input"
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="reg-email" className="form-label">
                Alamat Email <span className="text-red-500">*</span>
              </label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  id="reg-email"
                  type="email"
                  required
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-input"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Nomor WhatsApp / HP */}
            <div className="form-group">
              <label htmlFor="reg-phone" className="form-label">
                Nomor WhatsApp / HP
              </label>
              <div className="input-wrapper">
                <Phone size={18} className="input-icon" />
                <input
                  id="reg-phone"
                  type="tel"
                  placeholder="Contoh: 08123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="text-input"
                  autoComplete="tel"
                />
              </div>
            </div>

            {/* Alamat / Keterangan Rumah */}
            <div className="form-group">
              <label htmlFor="reg-address" className="form-label">
                Alamat / Blok Rumah <span className="text-red-500">*</span>
              </label>
              <div className="input-wrapper">
                <MapPin size={18} className="input-icon" />
                <input
                  id="reg-address"
                  type="text"
                  required
                  placeholder="Contoh: Jalur 2 No. 1, Blok A"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="text-input"
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="reg-password" className="form-label">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-input"
                  style={{ paddingRight: "40px" }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label="Tampilkan password"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Konfirmasi Password */}
            <div className="form-group">
              <label htmlFor="reg-confirm" className="form-label">
                Konfirmasi Password <span className="text-red-500">*</span>
              </label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="reg-confirm"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Ulangi password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="text-input"
                  style={{ paddingRight: "40px" }}
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Verification info badge */}
            <div className="notice-box">
              <ShieldCheck size={18} className="flex-shrink-0 text-emerald-600 mt-0.5" />
              <span>
                <strong>Penetapan Unit Hunian:</strong> Admin RT akan memverifikasi alamat Anda dan
                menetapkan nomor unit resmi sebelum akun Anda aktif penuh.
              </span>
            </div>

            <button
              id="btn-register"
              type="submit"
              disabled={loading}
              className="btn-submit"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Mendaftarkan...
                </>
              ) : (
                <>
                  Daftar Sekarang
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="footer-text">
            Sudah memiliki akun?
            <Link href="/login" className="footer-link">
              Masuk di sini
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
