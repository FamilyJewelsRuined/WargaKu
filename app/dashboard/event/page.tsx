import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CalendarDays, Plus, Megaphone } from "lucide-react";
import Link from "next/link";
import { EventCard } from "@/components/event-card";

const categoryLabels = {
  DUKA_CITA: "Duka Cita",
  PENGUMUMAN: "Pengumuman",
  KEGIATAN: "Kegiatan",
  LAINNYA: "Lainnya",
};

export default async function EventPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { category } = await searchParams;

  const events = await prisma.communityEvent.findMany({
    where: {
      archivedAt: null, // hanya tampilkan event yang belum diarsipkan
      ...(category ? { category: category as keyof typeof categoryLabels } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true, houseNumber: true } } },
  });

  const categories = Object.entries(categoryLabels);

  return (
    <>
      <style>{`
        .events-page-wrap {
          max-width: 680px;
          margin: 0 auto;
          padding: 8px 12px 60px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
          color: #1e293b;
        }

        /* Header */
        .events-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .events-header-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #2563eb;
          margin-bottom: 4px;
        }
        .events-page-title {
          font-size: 24px;
          font-weight: 800;
          color: #1e293b;
          margin: 0 0 4px;
          letter-spacing: -0.4px;
        }
        .events-page-subtitle {
          font-size: 13.5px;
          color: #64748b;
          margin: 0;
        }
        .btn-create-event {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background: #2563eb;
          color: #ffffff;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
          transition: all 0.15s ease;
          flex-shrink: 0;
        }
        .btn-create-event:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(37, 99, 235, 0.42);
        }

        /* Filter Chips */
        .events-filter-scroll {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 6px;
          margin-bottom: 20px;
          scrollbar-width: none;
        }
        .events-filter-scroll::-webkit-scrollbar {
          display: none;
        }
        .filter-chip {
          display: inline-flex;
          align-items: center;
          padding: 8px 16px;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          white-space: nowrap;
          transition: all 0.15s ease;
          border: 1.5px solid #e2e8f0;
          background: #ffffff;
          color: #475569;
        }
        .filter-chip:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }
        .filter-chip.active {
          background: #2563eb;
          border-color: #2563eb;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
        }

        /* Empty Card */
        .events-empty-card {
          background: #ffffff;
          border: 1px solid #e8eef6;
          border-radius: 20px;
          padding: 48px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
        }
        .empty-icon-wrap {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #eff6ff;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
        }
        .empty-title {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 6px;
        }
        .empty-desc {
          font-size: 13.5px;
          color: #64748b;
          margin: 0;
        }

        /* Events List */
        .events-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
      `}</style>

      <div className="events-page-wrap">
        {/* Header */}
        <div className="events-header">
          <div>
            <div className="events-header-badge">
              <Megaphone size={16} />
              <span>Komunitas Warga</span>
            </div>
            <h1 className="events-page-title">Info Event & Pengumuman</h1>
            <p className="events-page-subtitle">
              Kegiatan komplek dan pengumuman terbaru
            </p>
          </div>
          <Link href="/dashboard/event/new" className="btn-create-event">
            <Plus size={16} strokeWidth={2.5} />
            <span>Buat Event</span>
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="events-filter-scroll">
          <Link
            href="/dashboard/event"
            className={`filter-chip ${!category ? "active" : ""}`}
          >
            Semua
          </Link>
          {categories.map(([key, label]) => (
            <Link
              key={key}
              href={`/dashboard/event?category=${key}`}
              className={`filter-chip ${category === key ? "active" : ""}`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Events Feed */}
        {events.length === 0 ? (
          <div className="events-empty-card">
            <div className="empty-icon-wrap">
              <CalendarDays size={28} />
            </div>
            <h3 className="empty-title">Belum ada pengumuman</h3>
            <p className="empty-desc">
              Jadilah yang pertama membagikan info atau kegiatan warga!
            </p>
          </div>
        ) : (
          <div className="events-list">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                currentUserId={session.user.id}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
