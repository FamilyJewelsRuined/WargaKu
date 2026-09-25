"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  Maximize2,
  MapPin,
  ChevronRight,
  Wifi,
  ShieldCheck,
  X,
  Clock,
} from "lucide-react";

interface CameraItem {
  id: string;
  name: string;
  location: string;
  youtubeUrl: string;
  isActive: boolean;
  order: number;
}

interface CctvClientViewProps {
  cameras: CameraItem[];
}

export function CctvClientView({ cameras }: CctvClientViewProps) {
  const [fullscreenCamera, setFullscreenCamera] = useState<CameraItem | null>(null);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <style>{`
        /* ── Base Container (Mobile first) ── */
        .cctv-page-wrap {
          width: 100%;
          max-width: 520px;
          margin: 0 auto;
          padding: 8px 16px 60px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
          color: #1e293b;
        }

        /* ── Desktop Adaptations ── */
        @media (min-width: 900px) {
          .cctv-page-wrap {
            max-width: 1060px;
            margin: 0;
            padding: 24px 32px 50px;
          }
          .btn-cctv-back {
            display: none !important;
          }
          .cctv-header {
            margin-bottom: 24px;
            padding-bottom: 18px;
            border-bottom: 1px solid #e8eef6;
          }
          .cctv-illustration-wrap {
            width: 180px;
            height: 90px;
          }
          .cctv-page-title {
            font-size: 26px;
          }
          .cctv-grid {
            gap: 22px !important;
          }
          .cctv-card-name {
            font-size: 15px !important;
          }
          .cctv-card-loc {
            font-size: 12.5px !important;
          }
        }

        /* ── Header ── */
        .cctv-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 18px;
          gap: 12px;
        }
        .cctv-header-left {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
        }
        .cctv-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .btn-cctv-back {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1e3a8a;
          text-decoration: none;
          transition: opacity 0.15s;
        }
        .btn-cctv-back:hover {
          opacity: 0.75;
        }
        .cctv-title-icon {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          background: #1e3a8a;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .cctv-page-title {
          font-size: 24px;
          font-weight: 800;
          color: #1e3a8a;
          letter-spacing: -0.4px;
          margin: 0;
          line-height: 1.2;
        }
        .cctv-page-subtitle {
          font-size: 13.5px;
          color: #64748b;
          margin: 2px 0 0 0;
          line-height: 1.45;
        }

        /* Header Illustration */
        .cctv-illustration-wrap {
          position: relative;
          width: 140px;
          height: 75px;
          flex-shrink: 0;
        }
        .cctv-illustration-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: bottom right;
        }

        /* ── Status Banner ── */
        .cctv-status-card {
          background: #ffffff;
          border: 1px solid #e8eef6;
          border-radius: 16px;
          padding: 13px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
          margin-bottom: 20px;
        }
        .cctv-status-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .cctv-status-dot-wrap {
          position: relative;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cctv-status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
        }
        .cctv-status-pulse {
          position: absolute;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: rgba(34, 197, 94, 0.25);
          animation: cctvPulse 2s infinite ease-in-out;
        }
        @keyframes cctvPulse {
          0%, 100% { transform: scale(0.8); opacity: 0.6; }
          50% { transform: scale(1.3); opacity: 0; }
        }
        .cctv-status-title {
          font-size: 14px;
          font-weight: 700;
          color: #16a34a;
          margin: 0;
          line-height: 1.25;
        }
        .cctv-status-sub {
          font-size: 12px;
          color: #64748b;
          margin: 1px 0 0 0;
        }
        .cctv-wifi-icon {
          color: #16a34a;
        }

        /* ── Camera Grid (2 columns on both mobile & desktop) ── */
        .cctv-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
        .cctv-card {
          background: #ffffff;
          border: 1px solid #e8eef6;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
          display: flex;
          flex-direction: column;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .cctv-card:hover {
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.05);
        }

        /* Video / Player Container */
        .cctv-video-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          background: #0f172a;
          overflow: hidden;
        }
        .cctv-iframe {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: none;
        }
        .cctv-live-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          z-index: 10;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: #ef4444;
          color: #ffffff;
          font-size: 9.5px;
          font-weight: 800;
          padding: 2.5px 8px;
          border-radius: 9999px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
          letter-spacing: 0.04em;
          pointer-events: none;
        }
        .cctv-live-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #ffffff;
          animation: liveBlink 1.2s infinite ease-in-out;
        }
        @keyframes liveBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .btn-cctv-expand {
          position: absolute;
          top: 8px;
          right: 8px;
          z-index: 10;
          width: 28px;
          height: 28px;
          border-radius: 7px;
          background: rgba(15, 23, 42, 0.7);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s ease, transform 0.15s ease;
          backdrop-filter: blur(4px);
        }
        .btn-cctv-expand:hover {
          background: rgba(15, 23, 42, 0.95);
          transform: scale(1.05);
        }

        /* Bottom Meta Row */
        .cctv-card-meta {
          padding: 12px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          background: #ffffff;
        }
        .cctv-card-meta-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          flex: 1;
        }
        .cctv-pin-badge {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #eff6ff;
          border: 1px solid #dbeafe;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .cctv-card-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .cctv-card-name {
          font-size: 13.5px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .cctv-card-loc {
          font-size: 11px;
          color: #64748b;
          margin: 1px 0 0 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .cctv-chevron {
          color: #cbd5e1;
          flex-shrink: 0;
        }

        /* ── Bottom Service Card ── */
        .cctv-info-card {
          background: #ffffff;
          border: 1px solid #e8eef6;
          border-radius: 16px;
          padding: 16px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
        }
        .cctv-info-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .cctv-shield-badge {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #eff6ff;
          border: 1px solid #dbeafe;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .cctv-info-title {
          font-size: 14.5px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }
        .cctv-info-sub {
          font-size: 12px;
          color: #64748b;
          margin: 2px 0 0 0;
          line-height: 1.4;
        }

        /* ── Fullscreen Modal ── */
        .cctv-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 60;
          background: rgba(15, 23, 42, 0.88);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: modalFadeIn 0.2s ease-out both;
        }
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .cctv-modal-box {
          width: 100%;
          max-width: 900px;
          background: #0f172a;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
        }
        .cctv-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          background: #1e293b;
          color: #ffffff;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .cctv-modal-title-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .cctv-modal-name {
          font-size: 16px;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }
        .cctv-modal-loc {
          font-size: 12px;
          color: #94a3b8;
          margin: 0;
        }
        .cctv-modal-clock {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          font-family: monospace;
          color: #60a5fa;
          background: rgba(96, 165, 250, 0.12);
          padding: 3px 10px;
          border-radius: 6px;
          border: 1px solid rgba(96, 165, 250, 0.25);
        }
        .btn-modal-close {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #ffffff;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-modal-close:hover {
          background: rgba(255, 255, 255, 0.25);
        }
        .cctv-modal-body {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          background: #000000;
        }
      `}</style>

      <div className="cctv-page-wrap">
        {/* Header */}
        <div className="cctv-header">
          <div className="cctv-header-left">
            <div className="cctv-title-row">
              <Link href="/dashboard" className="btn-cctv-back" aria-label="Kembali ke Beranda">
                <ArrowLeft size={22} />
              </Link>
              <div className="cctv-title-icon">
                <Camera size={18} />
              </div>
              <h1 className="cctv-page-title">Live CCTV</h1>
            </div>
            <p className="cctv-page-subtitle">
              Pantau keamanan lingkungan secara real-time.
            </p>
          </div>

          {/* CCTV Illustration */}
          <div className="cctv-illustration-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/cctv-illus.png" alt="CCTV Keamanan" className="cctv-illustration-img" />
          </div>
        </div>

        {/* Status Card */}
        <div className="cctv-status-card">
          <div className="cctv-status-left">
            <div className="cctv-status-dot-wrap">
              <div className="cctv-status-pulse" />
              <div className="cctv-status-dot" />
            </div>
            <div>
              <p className="cctv-status-title">Semua Kamera Online</p>
              <p className="cctv-status-sub">{cameras.length} dari {cameras.length} kamera aktif</p>
            </div>
          </div>
          <Wifi size={20} className="cctv-wifi-icon" />
        </div>

        {/* Camera Grid (2x2) */}
        <div className="cctv-grid">
          {cameras.map((camera) => (
            <div key={camera.id} className="cctv-card">
              {/* Video Player */}
              <div className="cctv-video-wrap">
                <iframe
                  src={camera.youtubeUrl}
                  title={camera.name}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="cctv-iframe"
                />
                <div className="cctv-live-badge">
                  <div className="cctv-live-dot" />
                  <span>LIVE</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFullscreenCamera(camera)}
                  className="btn-cctv-expand"
                  title="Perbesar Kamera"
                  aria-label={`Perbesar kamera ${camera.name}`}
                >
                  <Maximize2 size={14} />
                </button>
              </div>

              {/* Card Meta */}
              <div
                className="cctv-card-meta"
                onClick={() => setFullscreenCamera(camera)}
                style={{ cursor: "pointer" }}
              >
                <div className="cctv-card-meta-left">
                  <div className="cctv-pin-badge">
                    <MapPin size={16} />
                  </div>
                  <div className="cctv-card-text">
                    <span className="cctv-card-name">{camera.name}</span>
                    <span className="cctv-card-loc">{camera.location}</span>
                  </div>
                </div>
                <ChevronRight size={16} className="cctv-chevron" />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Service Card */}
        <div className="cctv-info-card">
          <div className="cctv-info-left">
            <div className="cctv-shield-badge">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="cctv-info-title">Layanan CCTV</p>
              <p className="cctv-info-sub">
                Hanya dapat diakses oleh warga yang sudah terdaftar dan terverifikasi.
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="cctv-chevron" />
        </div>
      </div>

      {/* Fullscreen / Enlarged Modal */}
      {fullscreenCamera && (
        <div className="cctv-modal-overlay" onClick={() => setFullscreenCamera(null)}>
          <div className="cctv-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="cctv-modal-header">
              <div className="cctv-modal-title-group">
                <div className="cctv-live-badge" style={{ position: "static" }}>
                  <div className="cctv-live-dot" />
                  <span>LIVE</span>
                </div>
                <div>
                  <h3 className="cctv-modal-name">{fullscreenCamera.name}</h3>
                  <p className="cctv-modal-loc">{fullscreenCamera.location}</p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                {currentTime && (
                  <div className="cctv-modal-clock">
                    <Clock size={13} />
                    <span>{currentTime}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setFullscreenCamera(null)}
                  className="btn-modal-close"
                  aria-label="Tutup"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="cctv-modal-body">
              <iframe
                src={fullscreenCamera.youtubeUrl}
                title={fullscreenCamera.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
