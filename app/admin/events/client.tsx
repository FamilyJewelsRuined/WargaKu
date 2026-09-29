"use client";

import { useState, useTransition } from "react";
import { Archive, Trash2, RotateCcw, RefreshCw, CalendarDays, PackageOpen } from "lucide-react";
import { toast } from "sonner";

type Event = {
  id: string;
  title: string;
  category: string;
  eventDate: string | null;
  archivedAt: string | null;
  createdAt: string;
  author: { name: string };
};

const categoryLabels: Record<string, string> = {
  DUKA_CITA: "Duka Cita",
  PENGUMUMAN: "Pengumuman",
  KEGIATAN: "Kegiatan",
  LAINNYA: "Lainnya",
};

const categoryColors: Record<string, { bg: string; color: string }> = {
  DUKA_CITA: { bg: "#fce7f3", color: "#be185d" },
  PENGUMUMAN: { bg: "#dbeafe", color: "#1d4ed8" },
  KEGIATAN:   { bg: "#dcfce7", color: "#15803d" },
  LAINNYA:    { bg: "#f1f5f9", color: "#475569" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export function AdminEventsClient({ initialEvents }: { initialEvents: Event[] }) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [tab, setTab] = useState<"active" | "archived">("active");
  const [isPending, startTransition] = useTransition();

  const activeEvents   = events.filter((e) => !e.archivedAt);
  const archivedEvents = events.filter((e) => !!e.archivedAt);

  async function handleArchive(id: string) {
    const res = await fetch(`/api/admin/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "archive" }),
    });
    if (res.ok) {
      setEvents((prev) =>
        prev.map((e) => e.id === id ? { ...e, archivedAt: new Date().toISOString() } : e)
      );
      toast.success("Event diarsipkan.");
    } else {
      toast.error("Gagal mengarsipkan event.");
    }
  }

  async function handleUnarchive(id: string) {
    const res = await fetch(`/api/admin/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "unarchive" }),
    });
    if (res.ok) {
      setEvents((prev) =>
        prev.map((e) => e.id === id ? { ...e, archivedAt: null } : e)
      );
      toast.success("Event dipulihkan ke aktif.");
    } else {
      toast.error("Gagal memulihkan event.");
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Hapus permanen "${title}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    const res = await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
    if (res.ok) {
      setEvents((prev) => prev.filter((e) => e.id !== id));
      toast.success("Event dihapus permanen.");
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Gagal menghapus event.");
    }
  }

  async function handleBatch(action: "archive-old" | "purge-old") {
    const confirmMsg = action === "archive-old"
      ? "Arsipkan semua event aktif yang sudah lewat > 30 hari?"
      : "Hapus permanen semua arsip yang sudah > 60 hari? Tindakan ini tidak dapat dibatalkan.";
    if (!confirm(confirmMsg)) return;

    startTransition(async () => {
      const res = await fetch("/api/admin/events/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        // Refresh list dari server
        window.location.reload();
      } else {
        toast.error(data.error ?? "Gagal menjalankan operasi batch.");
      }
    });
  }

  const displayedEvents = tab === "active" ? activeEvents : archivedEvents;

  return (
    <>
      <style>{`
        .ae-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
        .ae-title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 4px; letter-spacing: -0.3px; }
        .ae-subtitle { font-size: 13.5px; color: #64748b; margin: 0; }
        .ae-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .ae-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 10px; font-size: 13px; font-weight: 600; border: 1.5px solid; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
        .ae-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .ae-btn-outline { background: #fff; color: #475569; border-color: #e2e8f0; }
        .ae-btn-outline:hover:not(:disabled) { background: #f8fafc; border-color: #cbd5e1; }
        .ae-btn-danger { background: #fff; color: #dc2626; border-color: #fecaca; }
        .ae-btn-danger:hover:not(:disabled) { background: #fef2f2; }
        /* Tabs */
        .ae-tabs { display: flex; gap: 4px; border-bottom: 1.5px solid #e2e8f0; margin-bottom: 20px; }
        .ae-tab { padding: 10px 16px; font-size: 13.5px; font-weight: 600; color: #64748b; border: none; background: none; cursor: pointer; border-bottom: 2.5px solid transparent; margin-bottom: -1.5px; transition: all 0.15s; white-space: nowrap; }
        .ae-tab.active { color: #2563eb; border-bottom-color: #2563eb; }
        .ae-tab-count { display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 20px; padding: 0 6px; border-radius: 10px; font-size: 11px; font-weight: 700; margin-left: 6px; }
        /* Table */
        .ae-table-wrap { background: #fff; border: 1.5px solid #e8eef6; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        .ae-table { width: 100%; border-collapse: collapse; }
        .ae-table th { padding: 12px 16px; text-align: left; font-size: 11.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; background: #f8fafc; border-bottom: 1px solid #e8eef6; }
        .ae-table td { padding: 14px 16px; font-size: 13px; color: #1e293b; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .ae-table tr:last-child td { border-bottom: none; }
        .ae-table tr:hover td { background: #f8fafc; }
        .ae-cat-badge { display: inline-flex; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; white-space: nowrap; }
        .ae-row-actions { display: flex; gap: 6px; }
        .ae-icon-btn { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; border: 1.5px solid; cursor: pointer; transition: all 0.15s; background: #fff; }
        .ae-icon-btn-archive { color: #d97706; border-color: #fed7aa; }
        .ae-icon-btn-archive:hover { background: #fff7ed; }
        .ae-icon-btn-unarchive { color: #16a34a; border-color: #bbf7d0; }
        .ae-icon-btn-unarchive:hover { background: #f0fdf4; }
        .ae-icon-btn-delete { color: #dc2626; border-color: #fecaca; }
        .ae-icon-btn-delete:hover { background: #fef2f2; }
        /* Empty */
        .ae-empty { padding: 48px 24px; text-align: center; color: #94a3b8; }
        .ae-empty-icon { width: 56px; height: 56px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; }
        .ae-empty-title { font-size: 15px; font-weight: 700; color: #475569; margin: 0 0 4px; }
        .ae-empty-desc { font-size: 13px; color: #94a3b8; margin: 0; }
      `}</style>

      {/* Header */}
      <div className="ae-header">
        <div>
          <h1 className="ae-title">Manajemen Event</h1>
          <p className="ae-subtitle">Arsipkan event lama atau hapus permanen arsip yang sudah tidak diperlukan.</p>
        </div>
        <div className="ae-actions">
          <button
            className="ae-btn ae-btn-outline"
            onClick={() => handleBatch("archive-old")}
            disabled={isPending}
          >
            <Archive size={14} />
            Arsipkan Event Lama
          </button>
          <button
            className="ae-btn ae-btn-danger"
            onClick={() => handleBatch("purge-old")}
            disabled={isPending}
          >
            <Trash2 size={14} />
            Bersihkan Arsip Lama
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="ae-tabs">
        <button
          className={`ae-tab ${tab === "active" ? "active" : ""}`}
          onClick={() => setTab("active")}
        >
          Aktif
          <span
            className="ae-tab-count"
            style={{ background: tab === "active" ? "#dbeafe" : "#f1f5f9", color: tab === "active" ? "#1d4ed8" : "#64748b" }}
          >
            {activeEvents.length}
          </span>
        </button>
        <button
          className={`ae-tab ${tab === "archived" ? "active" : ""}`}
          onClick={() => setTab("archived")}
        >
          Arsip
          <span
            className="ae-tab-count"
            style={{ background: tab === "archived" ? "#dbeafe" : "#f1f5f9", color: tab === "archived" ? "#1d4ed8" : "#64748b" }}
          >
            {archivedEvents.length}
          </span>
        </button>
      </div>

      {/* Table */}
      <div className="ae-table-wrap">
        {displayedEvents.length === 0 ? (
          <div className="ae-empty">
            <div className="ae-empty-icon">
              <PackageOpen size={24} color="#94a3b8" />
            </div>
            <p className="ae-empty-title">
              {tab === "active" ? "Tidak ada event aktif" : "Tidak ada event di arsip"}
            </p>
            <p className="ae-empty-desc">
              {tab === "active"
                ? "Semua event mungkin sudah diarsipkan."
                : "Belum ada event yang diarsipkan."}
            </p>
          </div>
        ) : (
          <table className="ae-table">
            <thead>
              <tr>
                <th>Judul</th>
                <th>Kategori</th>
                <th>Tanggal Acara</th>
                <th>{tab === "active" ? "Dibuat" : "Diarsipkan"}</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {displayedEvents.map((event) => {
                const cat = categoryColors[event.category] ?? { bg: "#f1f5f9", color: "#475569" };
                return (
                  <tr key={event.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "#0f172a", marginBottom: 2 }}>
                        {event.title}
                      </div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>{event.author.name}</div>
                    </td>
                    <td>
                      <span className="ae-cat-badge" style={{ background: cat.bg, color: cat.color }}>
                        {categoryLabels[event.category] ?? event.category}
                      </span>
                    </td>
                    <td style={{ color: event.eventDate ? "#1e293b" : "#cbd5e1" }}>
                      {event.eventDate ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <CalendarDays size={13} color="#94a3b8" />
                          {formatDate(event.eventDate)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={{ color: "#64748b" }}>
                      {tab === "active"
                        ? formatDate(event.createdAt)
                        : event.archivedAt
                          ? formatDate(event.archivedAt)
                          : "—"}
                    </td>
                    <td>
                      <div className="ae-row-actions">
                        {tab === "active" ? (
                          <button
                            className="ae-icon-btn ae-icon-btn-archive"
                            title="Arsipkan"
                            onClick={() => handleArchive(event.id)}
                          >
                            <Archive size={14} />
                          </button>
                        ) : (
                          <>
                            <button
                              className="ae-icon-btn ae-icon-btn-unarchive"
                              title="Pulihkan"
                              onClick={() => handleUnarchive(event.id)}
                            >
                              <RotateCcw size={14} />
                            </button>
                            <button
                              className="ae-icon-btn ae-icon-btn-delete"
                              title="Hapus Permanen"
                              onClick={() => handleDelete(event.id, event.title)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
