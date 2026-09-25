"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Trash2,
  ChevronDown,
  ChevronUp,
  CalendarDays,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

const categoryStyles: Record<
  string,
  { label: string; emoji: string; bg: string; border: string; text: string }
> = {
  DUKA_CITA: {
    label: "Duka Cita",
    emoji: "🕌",
    bg: "#faf5ff",
    border: "#e9d5ff",
    text: "#7e22ce",
  },
  PENGUMUMAN: {
    label: "Pengumuman",
    emoji: "📣",
    bg: "#eff6ff",
    border: "#bfdbfe",
    text: "#1d4ed8",
  },
  KEGIATAN: {
    label: "Kegiatan",
    emoji: "🎉",
    bg: "#f0fdf4",
    border: "#bbf7d0",
    text: "#15803d",
  },
  LAINNYA: {
    label: "Lainnya",
    emoji: "📋",
    bg: "#f8fafc",
    border: "#e2e8f0",
    text: "#475569",
  },
};

interface EventCardProps {
  event: {
    id: string;
    title: string;
    content: string;
    category: string;
    eventDate: Date | null;
    createdAt: Date;
    author: { name: string; houseNumber: string | null };
    authorId: string;
  };
  currentUserId: string;
}

export function EventCard({ event, currentUserId }: EventCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const cat = categoryStyles[event.category] ?? categoryStyles.LAINNYA;
  const isOwner = event.authorId === currentUserId;

  const handleDelete = async () => {
    if (!confirm("Hapus pengumuman ini?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/events/${event.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Pengumuman dihapus");
      router.refresh();
    } catch {
      toast.error("Gagal menghapus pengumuman");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <style>{`
        .event-card {
          background: #ffffff;
          border: 1px solid #e8eef6;
          border-radius: 18px;
          padding: 18px 20px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          color: #1e293b;
        }
        .event-card:hover {
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.04);
        }
        .event-header {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 12px;
        }
        .event-emoji {
          font-size: 28px;
          line-height: 1;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .event-main-meta {
          flex: 1;
          min-width: 0;
        }
        .event-title-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 4px;
        }
        .event-title {
          font-size: 15px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
          line-height: 1.35;
        }
        .event-cat-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 9999px;
          flex-shrink: 0;
        }
        .event-sub-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #64748b;
        }
        .event-date-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: #eff6ff;
          border: 1px solid #dbeafe;
          border-radius: 8px;
          color: #2563eb;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 10px;
        }
        .event-content {
          font-size: 13.5px;
          color: #334155;
          line-height: 1.6;
          white-space: pre-line;
          margin: 0;
        }
        .event-content.clamped {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .event-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #f1f5f9;
        }
        .btn-expand {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12.5px;
          font-weight: 600;
          color: #2563eb;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
        }
        .btn-expand:hover {
          text-decoration: underline;
        }
        .btn-delete {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #94a3b8;
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.15s;
          padding: 0;
        }
        .btn-delete:hover {
          color: #ef4444;
        }
      `}</style>

      <div className="event-card">
        {/* Header */}
        <div className="event-header">
          <span className="event-emoji">{cat.emoji}</span>
          <div className="event-main-meta">
            <div className="event-title-row">
              <h3 className="event-title">{event.title}</h3>
              <span
                className="event-cat-badge"
                style={{
                  background: cat.bg,
                  border: `1px solid ${cat.border}`,
                  color: cat.text,
                }}
              >
                {cat.label}
              </span>
            </div>
            <div className="event-sub-meta">
              <span>
                {event.author.name}
                {event.author.houseNumber && ` · No. ${event.author.houseNumber}`}
              </span>
              <span>&bull;</span>
              <span>
                {format(new Date(event.createdAt), "dd MMM yyyy", {
                  locale: idLocale,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Event Date if exists */}
        {event.eventDate && (
          <div className="event-date-pill">
            <CalendarDays size={14} />
            <span>
              {format(new Date(event.eventDate), "EEEE, dd MMMM yyyy", {
                locale: idLocale,
              })}
            </span>
          </div>
        )}

        {/* Content */}
        <p className={`event-content ${!expanded ? "clamped" : ""}`}>
          {event.content}
        </p>

        {/* Footer actions */}
        <div className="event-footer">
          <button
            onClick={() => setExpanded(!expanded)}
            className="btn-expand"
          >
            {expanded ? (
              <>
                <ChevronUp size={14} />
                <span>Sembunyikan</span>
              </>
            ) : (
              <>
                <ChevronDown size={14} />
                <span>Selengkapnya</span>
              </>
            )}
          </button>

          {isOwner && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="btn-delete"
            >
              <Trash2 size={14} />
              <span>{deleting ? "Menghapus..." : "Hapus"}</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
