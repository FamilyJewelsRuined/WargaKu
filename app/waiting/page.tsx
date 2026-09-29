"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Clock,
  Home,
  LogOut,
  RefreshCw,
  ShieldAlert,
  CheckCircle2,
  MapPin,
  Mail,
  User,
  Phone,
} from "lucide-react";

export default function WaitingPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [rejected, setRejected] = useState(false);

  const checkStatus = async (showToast = false) => {
    try {
      setChecking(true);
      const res = await fetch("/api/user/status");
      const data = await res.json();

      if (res.status === 404 || data.status === "REJECTED") {
        setRejected(true);
        if (showToast) toast.error("Pendaftaran Anda tidak disetujui oleh pengurus RT.");
        return;
      }

      if (data.status === "ACTIVE") {
        toast.success("Selamat! Akun Anda telah disetujui oleh pengurus RT 🎉");
        await update(); // refresh NextAuth session
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 1200);
      } else if (showToast) {
        toast.info("Status masih dalam proses verifikasi.");
      }
    } catch {
      if (showToast) toast.error("Gagal memeriksa status.");
    } finally {
      setChecking(false);
    }
  };

  // Polling otomatis setiap 6 detik
  useEffect(() => {
    const interval = setInterval(() => {
      checkStatus(false);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <style>{`
        .waiting-root {
          min-height: 100svh;
          background: linear-gradient(180deg, #deeaf8 0%, #eef4fb 40%, #f5f9ff 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 16px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: #1a2a3a;
          -webkit-font-smoothing: antialiased;
        }

        .waiting-card {
          width: 100%;
          max-width: 520px;
          background: #ffffff;
          border-radius: 28px;
          box-shadow: 0 16px 48px -12px rgba(15, 34, 58, 0.1), 0 0 1px 1px rgba(15, 34, 58, 0.05);
          padding: 40px 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 24px;
        }

        @media (max-width: 480px) {
          .waiting-card {
            padding: 32px 20px;
            border-radius: 22px;
          }
        }

        .waiting-icon-pulse {
          position: relative;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .waiting-icon-pulse::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: #fef3c7;
          animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          opacity: 0.75;
        }

        @keyframes ping {
          75%, 100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }

        .waiting-icon-inner {
          position: relative;
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: #f59e0b;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px -4px rgba(245, 158, 11, 0.4);
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 700;
          background: #fffbeb;
          color: #b45309;
          border: 1px solid #fde68a;
        }

        .info-panel {
          width: 100%;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 20px;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .info-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-size: 13.5px;
        }

        .info-row-icon {
          color: #64748b;
          margin-top: 2px;
          flex-shrink: 0;
        }

        .info-row-label {
          color: #64748b;
          font-size: 12px;
          font-weight: 500;
          margin: 0;
        }

        .info-row-val {
          color: #0f172a;
          font-weight: 600;
          margin: 0;
          word-break: break-word;
        }

        .btn-action-row {
          display: flex;
          width: 100%;
          gap: 12px;
        }

        .btn-refresh {
          flex: 1;
          height: 44px;
          border-radius: 12px;
          background: #2563eb;
          color: #ffffff;
          border: none;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-refresh:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .btn-logout {
          height: 44px;
          padding: 0 16px;
          border-radius: 12px;
          background: #ffffff;
          color: #dc2626;
          border: 1px solid #fecaca;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-logout:hover {
          background: #fef2f2;
        }
      `}</style>

      <main className="waiting-root">
        <div className="waiting-card">
          {/* Animated Icon */}
          <div className="waiting-icon-pulse">
            <div className="waiting-icon-inner" style={{ background: rejected ? "#dc2626" : "#f59e0b" }}>
              {rejected ? <ShieldAlert size={36} /> : <Clock size={36} />}
            </div>
          </div>

          <div>
            <div className="mb-3">
              <span
                className="status-badge"
                style={{
                  background: rejected ? "#fef2f2" : "#fffbeb",
                  color: rejected ? "#991b1b" : "#b45309",
                  borderColor: rejected ? "#fecaca" : "#fde68a",
                }}
              >
                {rejected ? (
                  <>
                    <ShieldAlert size={14} />
                    Pendaftaran Ditolak
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    Menunggu Verifikasi Admin RT
                  </>
                )}
              </span>
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
              {rejected ? "Pendaftaran Tidak Disetujui" : "Menunggu Persetujuan RT"}
            </h1>
            <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
              {rejected
                ? "Mohon maaf, permohonan pendaftaran akun Anda belum dapat disetujui oleh pengurus RT. Silakan hubungi pengurus RT langsung untuk konfirmasi."
                : "Akun Anda telah berhasil dibuat dan saat ini sedang ditinjau oleh pengurus RT untuk verifikasi data serta penetapan nomor unit hunian."}
            </p>
          </div>

          {/* User registration details */}
          <div className="info-panel">
            <div className="info-row">
              <User size={18} className="info-row-icon" />
              <div>
                <p className="info-row-label">Nama Pemohon</p>
                <p className="info-row-val">{session?.user?.name || "—"}</p>
              </div>
            </div>

            <div className="info-row">
              <Mail size={18} className="info-row-icon" />
              <div>
                <p className="info-row-label">Email Terdaftar</p>
                <p className="info-row-val">{session?.user?.email || "—"}</p>
              </div>
            </div>

            {session?.user?.phone && (
              <div className="info-row">
                <Phone size={18} className="info-row-icon" />
                <div>
                  <p className="info-row-label">No. WhatsApp / HP</p>
                  <p className="info-row-val">{session.user.phone}</p>
                </div>
              </div>
            )}

            {session?.user?.address && (
              <div className="info-row">
                <MapPin size={18} className="info-row-icon" />
                <div>
                  <p className="info-row-label">Alamat / Lokasi Rumah</p>
                  <p className="info-row-val">{session.user.address}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="btn-action-row">
            {!rejected && (
              <button
                id="btn-check-status"
                type="button"
                onClick={() => checkStatus(true)}
                disabled={checking}
                className="btn-refresh"
              >
                <RefreshCw size={16} className={checking ? "animate-spin" : ""} />
                {checking ? "Memeriksa..." : "Periksa Status"}
              </button>
            )}

            <button
              id="btn-logout-waiting"
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className={`btn-logout ${rejected ? "w-full" : ""}`}
            >
              <LogOut size={16} />
              Keluar
            </button>
          </div>

          {!rejected && (
            <p className="text-xs text-slate-400">
              Sistem akan otomatis mengalihkan Anda begitu verifikasi disetujui pengurus RT.
            </p>
          )}
        </div>
      </main>
    </>
  );
}
