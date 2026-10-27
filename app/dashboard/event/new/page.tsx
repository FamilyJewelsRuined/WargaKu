"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  FileText,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Map as MapIcon,
  LayoutGrid,
  Paperclip,
  UploadCloud,
  Send,
  Loader2,
  Check,
  X,
  ImageIcon,
} from "lucide-react";

type DBCategory = "DUKA_CITA" | "PENGUMUMAN" | "KEGIATAN" | "LAINNYA";

const categoryChips: { value: DBCategory; label: string; emoji: string }[] = [
  { value: "DUKA_CITA",  label: "Duka Cita",  emoji: "🕯️" },
  { value: "PENGUMUMAN", label: "Pengumuman", emoji: "📢" },
  { value: "KEGIATAN",   label: "Kegiatan",   emoji: "🏃" },
  { value: "LAINNYA",    label: "Lainnya",    emoji: "📌" },
];

export default function NewEventPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<DBCategory>("PENGUMUMAN");
  const [uploadedFiles, setUploadedFiles] = useState<
    { url: string; name: string }[]
  >([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (uploadedFiles.length + files.length > 5) {
      toast.error("Maksimal 5 foto per pengumuman");
      e.target.value = "";
      return;
    }

    setIsUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Gagal mengunggah foto");
        }
        const { url } = await res.json();
        setUploadedFiles((prev) => [...prev, { url, name: file.name }]);
      }
      toast.success(
        files.length === 1 ? "Foto berhasil diunggah!" : `${files.length} foto berhasil diunggah!`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal mengunggah foto";
      toast.error(msg);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Judul event wajib diisi");
      return;
    }
    if (!description.trim()) {
      toast.error("Deskripsi event wajib diisi");
      return;
    }
    if (description.length > 500) {
      toast.error("Deskripsi maksimal 500 karakter");
      return;
    }

    if (selectedCategory === "KEGIATAN") {
      if (!date || !time) {
        toast.error("Tanggal & waktu kegiatan wajib diisi");
        return;
      }
      if (!location.trim()) {
        toast.error("Lokasi kegiatan wajib diisi");
        return;
      }
    }

    // Build eventDate if specified
    let eventDate: string | null = null;
    if (date) {
      try {
        const parsed = time ? new Date(`${date}T${time}`) : new Date(`${date}T00:00:00`);
        if (!isNaN(parsed.getTime())) {
          eventDate = parsed.toISOString();
        }
      } catch {
        eventDate = null;
      }
    }

    const category = selectedCategory;

    setLoading(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: description.trim(),
          category,
          eventDate,
          location: location.trim() || null,
          attachments: uploadedFiles.map((f) => f.url),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        let errorMsg = "Gagal membuat pengumuman";
        if (typeof data.error === "string") {
          errorMsg = data.error;
        } else if (data.error && typeof data.error === "object") {
          const fieldErrs = data.error.fieldErrors
            ? Object.values(data.error.fieldErrors).flat()
            : [];
          errorMsg = fieldErrs.join(", ") || data.message || JSON.stringify(data.error);
        }
        throw new Error(errorMsg);
      }

      toast.success("Pengumuman berhasil dibuat! 📢");
      router.push("/dashboard/event");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal membuat pengumuman. Coba lagi.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .tambah-event-container {
          max-width: 580px;
          margin: 0 auto;
          padding: 8px 12px 60px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
          color: #1e293b;
        }

        /* Header Bar */
        .tambah-event-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 24px;
          gap: 16px;
        }
        .header-left {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }
        .btn-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #1e3a8a;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          transition: opacity 0.15s;
          margin-bottom: 4px;
        }
        .btn-back:hover {
          opacity: 0.75;
        }
        .page-title {
          font-size: 24px;
          font-weight: 800;
          color: #1e293b;
          margin: 0;
          letter-spacing: -0.4px;
        }
        .page-subtitle {
          font-size: 13.5px;
          color: #64748b;
          margin: 0;
          line-height: 1.45;
        }
        .header-megaphone {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: #eff6ff;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
        }
        .header-megaphone img {
          width: 80%;
          height: 80%;
          object-fit: contain;
        }

        /* Form styling */
        .form-card {
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #e8eef6;
          padding: 24px 20px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.02);
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        /* Field Item */
        .field-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .field-label-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .field-icon-wrap {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: #eff6ff;
          border: 1px solid #dbeafe;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .field-label {
          font-size: 14.5px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }
        .required-star {
          color: #ef4444;
          margin-left: 2px;
        }
        .field-sublabel {
          font-size: 12px;
          color: #64748b;
          margin: -4px 0 0 44px;
        }

        /* Inputs */
        .field-input {
          width: 100%;
          height: 48px;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          padding: 0 16px;
          font-size: 14px;
          color: #1e293b;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: inherit;
        }
        .field-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        .field-input::placeholder {
          color: #94a3b8;
        }

        /* Textarea */
        .textarea-wrap {
          position: relative;
        }
        .field-textarea {
          width: 100%;
          min-height: 120px;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px 16px 28px;
          font-size: 14px;
          color: #1e293b;
          outline: none;
          resize: vertical;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: inherit;
          line-height: 1.5;
        }
        .field-textarea:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        .field-textarea::placeholder {
          color: #94a3b8;
        }
        .char-counter {
          position: absolute;
          bottom: 8px;
          right: 12px;
          font-size: 11.5px;
          color: #94a3b8;
          font-weight: 500;
        }

        /* Split Date & Time Row */
        .datetime-card {
          display: flex;
          align-items: center;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          transition: border-color 0.2s;
        }
        .datetime-card:focus-within {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        .datetime-item {
          flex: 1;
          display: flex;
          align-items: center;
          padding: 0 14px;
          gap: 8px;
          height: 48px;
        }
        .datetime-icon {
          color: #64748b;
          flex-shrink: 0;
        }
        .datetime-input {
          border: none;
          background: transparent;
          outline: none;
          font-size: 13.5px;
          color: #1e293b;
          width: 100%;
          font-family: inherit;
        }
        .datetime-divider {
          width: 1.5px;
          height: 28px;
          background: #e2e8f0;
        }

        /* Location with right icon */
        .location-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .location-input-wrap .field-input {
          padding-right: 42px;
        }
        .location-map-icon {
          position: absolute;
          right: 14px;
          color: #64748b;
          pointer-events: none;
        }

        /* Category Chips Grid */
        .category-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        @media (max-width: 480px) {
          .category-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .category-chip {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 12px;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          border: 1.5px solid #e2e8f0;
          background: #ffffff;
          color: #334155;
          text-align: center;
        }
        .category-chip:hover {
          border-color: #cbd5e1;
          background: #f8fafc;
        }
        .category-chip.active {
          background: #eff6ff;
          border-color: #3b82f6;
          color: #2563eb;
        }

        /* Upload Dropzone */
        .upload-dropzone {
          border: 1.5px dashed #cbd5e1;
          border-radius: 14px;
          background: #fafcff;
          padding: 22px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          text-align: center;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }
        .upload-dropzone:hover:not(.uploading) {
          background: #f0f7ff;
          border-color: #3b82f6;
        }
        .upload-dropzone.uploading {
          cursor: not-allowed;
          opacity: 0.7;
        }
        .upload-icon {
          color: #64748b;
          margin-bottom: 2px;
        }
        .upload-title {
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          margin: 0;
        }
        .upload-hint {
          font-size: 11px;
          color: #94a3b8;
          margin: 0;
        }

        /* Photo Preview Grid */
        .photo-preview-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 10px;
        }
        @media (max-width: 400px) {
          .photo-preview-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .preview-item {
          position: relative;
          aspect-ratio: 1;
          border-radius: 10px;
          overflow: hidden;
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
        }
        .preview-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .preview-remove-btn {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: rgba(15, 23, 42, 0.7);
          color: #ffffff;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
          padding: 0;
        }
        .preview-remove-btn:hover {
          background: #ef4444;
        }
        .upload-count-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11.5px;
          font-weight: 600;
          color: #64748b;
          margin-top: 6px;
        }

        /* Submit Button */
        .btn-submit {
          width: 100%;
          height: 52px;
          background: #2563eb;
          color: #ffffff;
          border: none;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.35);
          transition: all 0.2s ease;
          font-family: inherit;
        }
        .btn-submit:hover:not(:disabled) {
          background: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.42);
        }
        .btn-submit:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }
      `}</style>

      <div className="tambah-event-container">
        {/* Header */}
        <div className="tambah-event-header">
          <div className="header-left">
            <Link href="/dashboard/event" className="btn-back">
              <ArrowLeft size={18} />
              <span>Kembali</span>
            </Link>
            <h1 className="page-title">Tambah Event</h1>
            <p className="page-subtitle">
              Bagikan informasi penting untuk warga komplek kita.
            </p>
          </div>
          <div className="header-megaphone">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/55.png" alt="Megaphone" />
          </div>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="form-card">
          {/* Judul Event */}
          <div className="field-group">
            <div className="field-label-row">
              <div className="field-icon-wrap">
                <FileText size={18} />
              </div>
              <label htmlFor="eventTitle" className="field-label">
                Judul Event / Pengumuman <span className="required-star">*</span>
              </label>
            </div>
            <input
              id="eventTitle"
              type="text"
              className="field-input"
              placeholder="Contoh: Kerja Bakti & Fogging Nyamuk"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Deskripsi */}
          <div className="field-group">
            <div className="field-label-row">
              <div className="field-icon-wrap">
                <FileText size={18} />
              </div>
              <label htmlFor="eventDesc" className="field-label">
                Deskripsi / Isi Pengumuman <span className="required-star">*</span>
              </label>
            </div>
            <div className="textarea-wrap">
              <textarea
                id="eventDesc"
                className="field-textarea"
                placeholder="Tulis detail kegiatan, siapa saja yang diundang, atau informasi penting lainnya..."
                value={description}
                maxLength={500}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
              <span className="char-counter">{description.length}/500</span>
            </div>
          </div>

          {/* Tanggal & Waktu */}
          <div className="field-group">
            <div className="field-label-row">
              <div className="field-icon-wrap">
                <CalendarIcon size={18} />
              </div>
              <label className="field-label">
                Tanggal & Waktu {selectedCategory === "KEGIATAN" && <span className="required-star">*</span>}
              </label>
            </div>
            <div className="datetime-card">
              <div className="datetime-item">
                <CalendarIcon size={16} className="datetime-icon" />
                <input
                  type="date"
                  className="datetime-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required={selectedCategory === "KEGIATAN"}
                />
              </div>
              <div className="datetime-divider" />
              <div className="datetime-item">
                <Clock size={16} className="datetime-icon" />
                <input
                  type="time"
                  className="datetime-input"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required={selectedCategory === "KEGIATAN"}
                />
              </div>
            </div>
          </div>

          {/* Lokasi */}
          <div className="field-group">
            <div className="field-label-row">
              <div className="field-icon-wrap">
                <MapPin size={18} />
              </div>
              <label htmlFor="eventLocation" className="field-label">
                Lokasi {selectedCategory === "KEGIATAN" && <span className="required-star">*</span>}
              </label>
            </div>
            <div className="location-input-wrap">
              <input
                id="eventLocation"
                type="text"
                className="field-input"
                placeholder={selectedCategory === "KEGIATAN" ? "Contoh: Taman Utama Komplek" : "Opsional (contoh: Masjid Al-Ikhlas)"}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required={selectedCategory === "KEGIATAN"}
              />
              <MapIcon size={18} className="location-map-icon" />
            </div>
          </div>

          {/* Kategori */}
          <div className="field-group">
            <div className="field-label-row">
              <div className="field-icon-wrap">
                <LayoutGrid size={18} />
              </div>
              <label className="field-label">
                Kategori <span className="required-star">*</span>
              </label>
            </div>
            <div className="category-grid">
              {categoryChips.map((cat) => {
                const isActive = selectedCategory === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    className={`category-chip ${isActive ? "active" : ""}`}
                    onClick={() => setSelectedCategory(cat.value)}
                  >
                    <span>{cat.emoji} {cat.label}</span>
                    {isActive && <Check size={14} strokeWidth={2.5} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lampiran */}
          <div className="field-group">
            <div className="field-label-row">
              <div className="field-icon-wrap">
                <Paperclip size={18} />
              </div>
              <label className="field-label">Lampiran (Opsional)</label>
            </div>
            <p className="field-sublabel">
              Bisa tambah foto pendukung. Maks. 5 foto, 10MB per foto.
            </p>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              style={{ display: "none" }}
              onChange={handleFileChange}
              disabled={isUploading || uploadedFiles.length >= 5}
            />

            {/* Dropzone — hanya tampil jika belum 5 foto */}
            {uploadedFiles.length < 5 && (
              <div
                className={`upload-dropzone ${isUploading ? "uploading" : ""}`}
                onClick={() => !isUploading && fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <Loader2 size={28} className="upload-icon animate-spin" />
                ) : (
                  <UploadCloud size={28} className="upload-icon" />
                )}
                <p className="upload-title">
                  {isUploading ? "Mengunggah foto..." : "Ketuk untuk mengunggah foto"}
                </p>
                <p className="upload-hint">
                  {isUploading
                    ? "Harap tunggu"
                    : `JPG, PNG, WebP, GIF · Sisa ${5 - uploadedFiles.length} slot`}
                </p>
              </div>
            )}

            {/* Preview foto yang sudah diupload */}
            {uploadedFiles.length > 0 && (
              <>
                <div className="photo-preview-grid">
                  {uploadedFiles.map((f, i) => (
                    <div key={i} className="preview-item">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={f.url} alt={f.name} />
                      <button
                        type="button"
                        className="preview-remove-btn"
                        onClick={() => handleRemoveFile(i)}
                        title="Hapus foto"
                      >
                        <X size={12} strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                </div>
                <span className="upload-count-badge">
                  <ImageIcon size={12} />
                  {uploadedFiles.length} foto terlampir
                  {uploadedFiles.length >= 5 && " (maksimal tercapai)"}
                </span>
              </>
            )}
          </div>

          {/* Submit */}
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
            <span>{loading ? "Mengirim..." : "Kirim Pengumuman"}</span>
          </button>
        </form>
      </div>
    </>
  );
}
