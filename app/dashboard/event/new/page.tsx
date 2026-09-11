"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarDays, ArrowLeft, Send, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const categories = [
  { value: "PENGUMUMAN", label: "📣 Pengumuman" },
  { value: "KEGIATAN", label: "🎉 Kegiatan / Acara" },
  { value: "DUKA_CITA", label: "🕌 Duka Cita" },
  { value: "LAINNYA", label: "📋 Lainnya" },
];

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "PENGUMUMAN",
    eventDate: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Judul dan isi pengumuman wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          eventDate: form.eventDate || null,
        }),
      });

      if (!res.ok) throw new Error("Gagal membuat pengumuman");

      toast.success("Pengumuman berhasil dibuat! 📢");
      router.push("/dashboard/event");
      router.refresh();
    } catch {
      toast.error("Gagal membuat pengumuman. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="animate-float-up">
        <Link
          href="/dashboard/event"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Event
        </Link>
        <div className="flex items-center gap-3 mb-1">
          <CalendarDays className="w-5 h-5 text-primary" />
          <span className="text-sm text-muted-foreground">Buat Pengumuman</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Pengumuman Baru</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Bagikan informasi penting kepada seluruh warga komplek
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="surface p-6 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="category">Kategori</Label>
          <Select
            value={form.category}
            onValueChange={(v) => setForm({ ...form, category: v })}
          >
            <SelectTrigger id="category" className="bg-muted/50 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Judul Pengumuman</Label>
          <Input
            id="title"
            placeholder="Contoh: Kerja Bakti Minggu Ini"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="bg-muted/50 border-border"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Isi Pengumuman</Label>
          <Textarea
            id="content"
            placeholder="Tulis detail pengumuman di sini..."
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="bg-muted/50 border-border min-h-[140px] resize-none"
            required
          />
          <p className="text-xs text-muted-foreground">
            {form.content.length} karakter
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="eventDate">
            Tanggal Acara{" "}
            <span className="text-muted-foreground">(opsional)</span>
          </Label>
          <Input
            id="eventDate"
            type="datetime-local"
            value={form.eventDate}
            onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
            className="bg-muted/50 border-border"
          />
        </div>

        <Button
          type="submit"
          className="w-full gradient-primary text-white font-semibold h-11 glow-green"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          {loading ? "Mengirim..." : "Kirim Pengumuman"}
        </Button>
      </form>
    </div>
  );
}
