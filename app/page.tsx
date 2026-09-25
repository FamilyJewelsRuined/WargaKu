"use client";

import Link from "next/link";
import { Home, ArrowRight, UserPlus, LogIn } from "lucide-react";

export default function LandingPage() {
  return (
    <>
      <style>{`
        .landing-viewport {
          min-height: 100vh;
          min-height: 100dvh;
          background: linear-gradient(180deg, #f0f7ff 0%, #ffffff 40%, #f0f6ff 85%, #e1effe 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 40px 24px 28px;
          position: relative;
          overflow-x: hidden;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
          color: #1e293b;
        }

        /* Subtle clouds / gradient spots in background */
        .landing-bg-cloud-1 {
          position: absolute;
          width: 320px;
          height: 160px;
          background: rgba(219, 234, 254, 0.45);
          filter: blur(40px);
          border-radius: 100px;
          top: 60px;
          left: -80px;
          pointer-events: none;
        }
        .landing-bg-cloud-2 {
          position: absolute;
          width: 280px;
          height: 140px;
          background: rgba(191, 219, 254, 0.4);
          filter: blur(40px);
          border-radius: 100px;
          top: 100px;
          right: -60px;
          pointer-events: none;
        }

        .landing-container {
          width: 100%;
          max-width: 420px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 2;
          animation: landingFadeIn 0.5s ease-out both;
        }

        @keyframes landingFadeIn {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Top Brand Header */
        .landing-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 24px;
          text-align: center;
        }
        .landing-brand {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 8px;
        }
        .landing-brand-icon {
          width: 38px;
          height: 38px;
          background: #1e3a8a;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 12px rgba(30, 58, 138, 0.25);
        }
        .landing-brand-name {
          font-size: 30px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: #1e3a8a;
          line-height: 1;
        }
        .landing-brand-name span {
          color: #2563eb;
        }
        .landing-brand-tagline {
          font-size: 13.5px;
          color: #64748b;
          font-weight: 500;
          margin: 0;
          line-height: 1.4;
        }

        /* Illustration Center */
        .landing-illustration-wrap {
          width: 100%;
          max-width: 360px;
          margin-bottom: 24px;
          position: relative;
          display: flex;
          justify-content: center;
        }
        .landing-illustration-img {
          width: 100%;
          height: auto;
          max-height: 270px;
          object-fit: contain;
          display: block;
        }

        /* Welcome Text */
        .landing-title-group {
          text-align: center;
          margin-bottom: 28px;
          padding: 0 8px;
        }
        .landing-title-main {
          font-size: 28px;
          font-weight: 800;
          color: #1e293b;
          line-height: 1.25;
          letter-spacing: -0.5px;
          margin: 0 0 10px;
        }
        .landing-title-main span {
          color: #2563eb;
        }
        .landing-subtitle-text {
          font-size: 13.5px;
          color: #64748b;
          line-height: 1.6;
          margin: 0;
          padding: 0 4px;
        }

        /* Action Buttons */
        .landing-actions {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 28px;
        }
        .btn-create-account {
          width: 100%;
          height: 52px;
          background: #2563eb;
          color: #ffffff;
          text-decoration: none;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          font-size: 15.5px;
          font-weight: 600;
          box-shadow: 0 8px 24px -4px rgba(37, 99, 235, 0.4);
          transition: all 0.2s ease;
        }
        .btn-create-account:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 10px 28px -4px rgba(37, 99, 235, 0.48);
        }
        .btn-create-account .btn-label-group {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 auto 0 0;
          padding-left: calc(50% - 70px);
        }

        .btn-login {
          width: 100%;
          height: 52px;
          background: #ffffff;
          color: #2563eb;
          text-decoration: none;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          font-size: 15.5px;
          font-weight: 600;
          border: 1.5px solid #2563eb;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
        }
        .btn-login:hover {
          background: #eff6ff;
          border-color: #1d4ed8;
          color: #1d4ed8;
        }
        .btn-login .btn-label-group {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 auto 0 0;
          padding-left: calc(50% - 55px);
        }

        /* Bottom Wave Accent */
        .landing-wave-bottom {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 120px;
          background: radial-gradient(ellipse 120% 80% at 50% 100%, rgba(224, 242, 254, 0.7) 0%, rgba(255, 255, 255, 0) 100%);
          pointer-events: none;
          z-index: 1;
        }

        /* Footer */
        .landing-footer {
          text-align: center;
          font-size: 12px;
          color: #94a3b8;
          font-weight: 500;
          letter-spacing: 0.02em;
          position: relative;
          z-index: 2;
        }
      `}</style>

      <div className="landing-viewport">
        <div className="landing-bg-cloud-1" />
        <div className="landing-bg-cloud-2" />
        <div className="landing-wave-bottom" />

        <div className="landing-container">
          {/* Header */}
          <header className="landing-header">
            <div className="landing-brand">
              <div className="landing-brand-icon">
                <Home size={22} strokeWidth={2.4} />
              </div>
              <div className="landing-brand-name">
                Warga<span>Ku</span>
              </div>
            </div>
            <p className="landing-brand-tagline">
              Bersama membangun lingkungan yang lebih baik
            </p>
          </header>

          {/* Illustration 11.png */}
          <div className="landing-illustration-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/11.png"
              alt="Komunitas WargaKu"
              className="landing-illustration-img"
            />
          </div>

          {/* Welcome Text */}
          <div className="landing-title-group">
            <h1 className="landing-title-main">
              Selamat Datang<br />di <span>WargaKu</span>
            </h1>
            <p className="landing-subtitle-text">
              Aplikasi komunitas warga untuk berbagi informasi, mengikuti kegiatan, dan membangun lingkungan yang lebih harmonis.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="landing-actions">
            <Link href="/login" className="btn-create-account">
              <span className="btn-label-group">
                <UserPlus size={18} />
                <span>Buat Akun</span>
              </span>
              <ArrowRight size={18} />
            </Link>

            <Link href="/login" className="btn-login">
              <span className="btn-label-group">
                <LogIn size={18} />
                <span>Masuk</span>
              </span>
              <ArrowRight size={18} />
            </Link>
          </div>

          {/* Footer Tagline */}
          <footer className="landing-footer">
            WargaKu &bull; Komunitas &bull; Kebersamaan &bull; Masa Depan
          </footer>
        </div>
      </div>
    </>
  );
}
