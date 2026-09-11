"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Trash2,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  MapPin,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

const categoryConfig: Record<
  string,
  { label: string; emoji: string; class: string }
> = {
  DUKA_CITA: { label: "Duka Cita", emoji: "🕌", class: "cat-duka" },
  PENGUMUMAN: { label: "Pengumuman", emoji: "📣", class: "cat-pengumuman" },
  KEGIATAN: { label: "Kegiatan", emoji: "🎉", class: "cat-kegiatan" },
  LAINNYA: { label: "Lainnya", emoji: "📋", class: "cat-lainnya" },
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
  const cat = categoryConfig[event.category] ?? categoryConfig.LAINNYA;
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
    <div className="surface hover-lift transition-all duration-200">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <span className="text-3xl flex-shrink-0">{cat.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-foreground text-sm leading-snug">
                {event.title}
              </h3>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${cat.class}`}
              >
                {cat.label}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-xs text-muted-foreground">
                {event.author.name}
                {event.author.houseNumber && (
                  <span> · {event.author.houseNumber}</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(event.createdAt), "dd MMM yyyy", {
                  locale: idLocale,
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Event date */}
        {event.eventDate && (
          <div className="flex items-center gap-1.5 mb-3 text-xs text-primary">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>
              {format(new Date(event.eventDate), "EEEE, dd MMMM yyyy", {
                locale: idLocale,
              })}
            </span>
          </div>
        )}

        {/* Content Preview */}
        <p
          className={`text-sm text-muted-foreground whitespace-pre-line leading-relaxed ${
            !expanded ? "line-clamp-3" : ""
          }`}
        >
          {event.content}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                Sembunyikan
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                Selengkapnya
              </>
            )}
          </button>

          {isOwner && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deleting ? "Menghapus..." : "Hapus"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
