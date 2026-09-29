import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  Megaphone,
  AlertTriangle,
  Wallet,
  Camera,
  CalendarDays,
  MapPin,
  Clock,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { id as idLocale } from "date-fns/locale";

async function getDashboardData(userId: string) {
  const [recentEvents, upcomingEvents, activeAlerts] = await Promise.all([
    prisma.communityEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { author: { select: { name: true } } },
    }),
    prisma.communityEvent.findMany({
      where: {
        category: "KEGIATAN",
        eventDate: { gt: new Date() }, // hanya event yang belum lewat
      },
      orderBy: { eventDate: "asc" },   // urutan: paling dekat duluan
      take: 3,
      include: { author: { select: { name: true } } },
    }),
    prisma.panicAlert.findMany({
      where: { isResolved: false },
      orderBy: { triggeredAt: "desc" },
      take: 5,
      include: { user: { select: { name: true, address: true } } },
    }),
  ]);

  return { recentEvents, upcomingEvents, activeAlerts };
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat Pagi";
  if (hour < 15) return "Selamat Siang";
  if (hour < 18) return "Selamat Sore";
  return "Selamat Malam";
}

/* ── Service card definitions ───────────────────────────────────── */
const services = [
  {
    href: "/dashboard/event",
    label: "Informasi\nEvent Warga",
    desc: "Lihat dan bagikan informasi kegiatan warga",
    iconBg: "#dbeafe",
    iconColor: "#2563eb",
    arrowBg: "#eff6ff",
    arrowColor: "#2563eb",
    Icon: Megaphone,
  },
  {
    href: "/dashboard/panic",
    label: "Panic Button",
    desc: "Laporkan keadaan darurat dengan cepat",
    iconBg: "#fee2e2",
    iconColor: "#dc2626",
    arrowBg: "#fff1f2",
    arrowColor: "#dc2626",
    Icon: AlertTriangle,
  },
  {
    href: "/dashboard/ipl",
    label: "Bayar Iuran",
    desc: "Kelola dan bayar iuran warga dengan mudah",
    iconBg: "#dcfce7",
    iconColor: "#16a34a",
    arrowBg: "#f0fdf4",
    arrowColor: "#16a34a",
    Icon: Wallet,
  },
  {
    href: "/dashboard/cctv",
    label: "Live CCTV",
    desc: "Pantau keamanan lingkungan secara real-time",
    iconBg: "#ede9fe",
    iconColor: "#7c3aed",
    arrowBg: "#f5f3ff",
    arrowColor: "#7c3aed",
    Icon: Camera,
  },
];

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { recentEvents, upcomingEvents, activeAlerts } =
    await getDashboardData(session.user.id);

  const greeting = getGreeting();
  const userName = session.user.name ?? "Warga";
  // Display name: use role-aware label for the greeting
  const displayName =
    session.user.role === "ADMIN"
      ? "Bapak/Ibu RT 03"
      : userName.split(" ").slice(0, 2).join(" ");

  return (
    <>
      <style>{`
        /* ── Dashboard page light styles ── */
        .dp-root {
          background: #f5f8fc;
          min-height: 100%;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          -webkit-font-smoothing: antialiased;
          color: #0f172a;
          animation: dpFadeUp 0.4s ease-out both;
        }
        @keyframes dpFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Hero header ── */
        .dp-hero {
          background: linear-gradient(160deg, #dbeafe 0%, #eff6ff 60%, #f5f8fc 100%);
          padding: 20px 20px 0;
          position: relative;
          overflow: hidden;
        }
        .dp-hero-inner {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
        }
        .dp-hero-text { flex: 1; padding-bottom: 20px; }
        .dp-hero-greeting {
          font-size: 22px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.25;
          margin: 0 0 6px;
        }
        .dp-hero-sub {
          font-size: 13px;
          color: #64748b;
          line-height: 1.5;
          margin: 0;
        }
        .dp-hero-img {
          width: 150px;
          flex-shrink: 0;
          align-self: flex-end;
        }
        .dp-hero-img img {
          width: 100%;
          height: auto;
          display: block;
        }

        /* ── Panic banner ── */
        .dp-panic-banner {
          margin: 14px 16px 0;
          background: #fef2f2;
          border: 1.5px solid #fecaca;
          border-radius: 14px;
          padding: 12px 16px;
          display: flex; align-items: flex-start; gap: 12px;
        }
        .dp-panic-icon {
          width: 38px; height: 38px;
          border-radius: 10px;
          background: #dc2626;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          animation: panicPulse 1.5s ease-in-out infinite;
        }
        @keyframes panicPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.5); }
          50% { box-shadow: 0 0 0 8px rgba(220,38,38,0); }
        }
        .dp-panic-title { font-weight: 700; color: #dc2626; font-size: 13.5px; }
        .dp-panic-body { font-size: 12.5px; color: #64748b; margin-top: 2px; line-height: 1.4; }
        .dp-panic-link { font-size: 12px; color: #dc2626; font-weight: 600; text-decoration: none; margin-top: 4px; display: inline-block; }
        /* multi-alert list */
        .dp-panic-list { list-style: none; margin: 6px 0 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
        .dp-panic-list-item { font-size: 12.5px; color: #374151; display: flex; align-items: flex-start; gap: 6px; line-height: 1.4; }
        .dp-panic-list-item::before { content: "•"; color: #dc2626; font-weight: 700; flex-shrink: 0; }

        /* ── Section header ── */
        .dp-section {
          padding: 22px 20px 0;
        }
        .dp-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }
        .dp-section-title {
          font-size: 17px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          display: flex; align-items: center; gap: 8px;
        }
        .dp-section-link {
          font-size: 12.5px;
          font-weight: 600;
          color: #2563eb;
          text-decoration: none;
          display: flex; align-items: center; gap: 2px;
        }
        .dp-section-link:hover { opacity: 0.8; }

        /* ── Service grid ── */
        .dp-services-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .dp-service-card {
          background: #ffffff;
          border: 1.5px solid #e8eef6;
          border-radius: 18px;
          padding: 16px;
          text-decoration: none;
          color: inherit;
          display: block;
          position: relative;
          transition: transform 0.18s, box-shadow 0.18s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .dp-service-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.08);
        }
        .dp-service-card:active { transform: translateY(0); }
        .dp-service-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 14px;
        }
        .dp-service-icon {
          width: 46px; height: 46px;
          border-radius: 13px;
          display: flex; align-items: center; justify-content: center;
        }
        .dp-service-arrow {
          width: 28px; height: 28px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
        }
        .dp-service-label {
          font-size: 13.5px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.3;
          margin: 0 0 5px;
          white-space: pre-line;
        }
        .dp-service-desc {
          font-size: 11.5px;
          color: #64748b;
          line-height: 1.45;
          margin: 0;
        }

        /* ── Announcement carousel ── */
        .dp-announce-card {
          background: #ffffff;
          border: 1.5px solid #e8eef6;
          border-radius: 18px;
          padding: 16px 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          text-decoration: none;
          color: inherit;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          transition: transform 0.15s;
        }
        .dp-announce-card:hover { transform: translateY(-1px); }
        .dp-announce-icon-wrap {
          width: 50px; height: 50px;
          border-radius: 14px;
          background: #dbeafe;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .dp-announce-title {
          font-size: 13.5px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 4px;
        }
        .dp-announce-body {
          font-size: 12px;
          color: #64748b;
          margin: 0;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .dp-announce-dots {
          display: flex; gap: 5px;
          justify-content: center;
          margin-top: 10px;
        }
        .dp-announce-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #e2e8f0;
        }
        .dp-announce-dot.active {
          background: #2563eb;
          width: 18px;
          border-radius: 4px;
        }

        /* ── Event list ── */
        .dp-event-card {
          background: #ffffff;
          border: 1.5px solid #e8eef6;
          border-radius: 18px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 14px;
          text-decoration: none;
          color: inherit;
          box-shadow: 0 2px 6px rgba(0,0,0,0.04);
          transition: transform 0.15s;
        }
        .dp-event-card:hover { transform: translateY(-1px); }
        .dp-event-icon {
          width: 46px; height: 46px;
          border-radius: 13px;
          background: #dcfce7;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .dp-event-title {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 3px;
        }
        .dp-event-author {
          font-size: 11.5px;
          color: #64748b;
          margin: 0 0 6px;
        }
        .dp-event-meta {
          display: flex; flex-direction: column; gap: 2px;
        }
        .dp-event-meta-row {
          display: flex; align-items: center; gap: 5px;
          font-size: 11.5px; color: #475569;
        }
        .dp-event-badge {
          margin-left: auto;
          flex-shrink: 0;
          background: #dcfce7;
          color: #16a34a;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 20px;
          white-space: nowrap;
        }

        /* ── Empty state ── */
        .dp-empty {
          background: #fff;
          border: 1.5px solid #e8eef6;
          border-radius: 18px;
          padding: 32px 16px;
          text-align: center;
          color: #94a3b8;
          font-size: 13px;
        }
        .dp-bottom-pad { height: 24px; }
      `}</style>

      <div className="dp-root">
        {/* ── Hero ── */}
        <div className="dp-hero">
          <div className="dp-hero-inner">
            <div className="dp-hero-text">
              <h1 className="dp-hero-greeting">
                {greeting},<br />{displayName}
              </h1>
              <p className="dp-hero-sub">
                Semoga hari ini penuh dengan<br />hal-hal baik untuk kita semua.
              </p>
            </div>
            <div className="dp-hero-img">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/33.png" alt="Lingkungan warga" />
            </div>
          </div>
        </div>

        {/* ── Panic Banner (conditional) ── */}
        {activeAlerts.length > 0 && (
          <div className="dp-panic-banner">
            <div className="dp-panic-icon">
              <AlertTriangle size={18} color="white" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {activeAlerts.length === 1 ? (
                // ── Single alert: tampilan seperti sebelumnya
                <>
                  <p className="dp-panic-title">⚠️ Alert Darurat Aktif!</p>
                  <p className="dp-panic-body">
                    {activeAlerts[0].user.name} membutuhkan bantuan di{" "}
                    <strong>{activeAlerts[0].user.address}</strong>
                  </p>
                  <Link href="/dashboard/panic" className="dp-panic-link">
                    Lihat detail →
                  </Link>
                </>
              ) : (
                // ── Multiple alerts: tampilan daftar
                <>
                  <p className="dp-panic-title">⚠️ {activeAlerts.length} Alert Darurat Aktif!</p>
                  <ul className="dp-panic-list">
                    {activeAlerts.map((alert) => (
                      <li key={alert.id} className="dp-panic-list-item">
                        <span>
                          <strong>{alert.user.name}</strong> — {alert.user.address}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/dashboard/panic" className="dp-panic-link">
                    Lihat semua detail →
                  </Link>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Layanan Utama ── */}
        <div className="dp-section">
          <div className="dp-section-header">
            <h2 className="dp-section-title">Layanan Utama</h2>
            <Link href="/dashboard/event" className="dp-section-link">
              Lihat Semua <ChevronRight size={14} />
            </Link>
          </div>
          <div className="dp-services-grid">
            {services.map((svc) => {
              const Icon = svc.Icon;
              return (
                <Link key={svc.href} href={svc.href} className="dp-service-card">
                  <div className="dp-service-card-top">
                    <div
                      className="dp-service-icon"
                      style={{ background: svc.iconBg }}
                    >
                      <Icon size={22} color={svc.iconColor} strokeWidth={2} />
                    </div>
                    <div
                      className="dp-service-arrow"
                      style={{ background: svc.arrowBg }}
                    >
                      <ChevronRight size={14} color={svc.arrowColor} strokeWidth={2.5} />
                    </div>
                  </div>
                  <p className="dp-service-label">{svc.label}</p>
                  <p className="dp-service-desc">{svc.desc}</p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Pengumuman Terbaru ── */}
        <div className="dp-section">
          <div className="dp-section-header">
            <h2 className="dp-section-title">
              Pengumuman Terbaru
            </h2>
          </div>
          {recentEvents.length === 0 ? (
            <div className="dp-empty">Belum ada pengumuman</div>
          ) : (
            <>
              <Link href="/dashboard/event" className="dp-announce-card">
                <div className="dp-announce-icon-wrap">
                  <Megaphone size={24} color="#2563eb" strokeWidth={2} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="dp-announce-title">{recentEvents[0].title}</p>
                  <p className="dp-announce-body">
                    {recentEvents[0].content}
                  </p>
                </div>
                <ChevronRight size={18} color="#94a3b8" style={{ flexShrink: 0 }} />
              </Link>
              {/* Dots indicator */}
              <div className="dp-announce-dots">
                {recentEvents.map((_, i) => (
                  <div
                    key={i}
                    className={`dp-announce-dot${i === 0 ? " active" : ""}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Event Mendatang ── */}
        <div className="dp-section">
          <div className="dp-section-header">
            <h2 className="dp-section-title">
              <CalendarDays size={20} color="#2563eb" />
              Event Mendatang
            </h2>
            <Link href="/dashboard/event" className="dp-section-link">
              Lihat Semua <ChevronRight size={14} />
            </Link>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="dp-empty">Tidak ada kegiatan mendatang</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {upcomingEvents.map((event) => {
                const daysDiff = event.eventDate
                  ? differenceInDays(new Date(event.eventDate), new Date())
                  : null;
                const badgeText =
                  daysDiff === null ? "Segera"
                  : daysDiff === 0 ? "Hari ini"
                  : daysDiff > 0 ? `${daysDiff} hari lagi`
                  : "Segera";

                return (
                  <Link
                    key={event.id}
                    href="/dashboard/event"
                    className="dp-event-card"
                  >
                    <div className="dp-event-icon">
                      <CalendarDays size={22} color="#16a34a" strokeWidth={2} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="dp-event-title">{event.title}</p>
                      <p className="dp-event-author">{event.author.name}</p>
                      <div className="dp-event-meta">
                        <div className="dp-event-meta-row">
                          <Clock size={11} color="#94a3b8" />
                          <span>
                            {format(new Date(event.createdAt), "EEEE, HH:mm 'WIB'", {
                              locale: idLocale,
                            })}
                          </span>
                        </div>
                        <div className="dp-event-meta-row">
                          <MapPin size={11} color="#94a3b8" />
                          <span>Taman Utama Komplek</span>
                        </div>
                      </div>
                    </div>
                    <span className="dp-event-badge">{badgeText}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="dp-bottom-pad" />
      </div>
    </>
  );
}
