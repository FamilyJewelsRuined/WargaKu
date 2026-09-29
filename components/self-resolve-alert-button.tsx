"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle2,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SelfResolveAlertButtonProps {
  alertId: string;
}

export function SelfResolveAlertButton({ alertId }: SelfResolveAlertButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");

  const handleResolve = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/panic/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note.trim() || "Situasi sudah aman." }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Gagal menyelesaikan alert");
      }

      toast.success("Situasi berhasil ditandai aman ✅");
      setOpen(false);
      setNote("");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyelesaikan alert";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 whitespace-nowrap"
      >
        <ShieldCheck className="w-3.5 h-3.5" />
        Tandai Aman
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white border border-[#e8eef6] text-slate-800 max-w-sm rounded-2xl p-6 shadow-2xl">
          <DialogHeader className="items-center text-center sm:text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 mb-2">
              <CheckCircle2 className="w-7 h-7" strokeWidth={2.5} />
            </div>
            <DialogTitle className="text-slate-900 text-lg font-bold">
              Konfirmasi Situasi Aman
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs mt-1 text-center">
              Apakah situasi darurat sudah berhasil ditangani? Tambahkan catatan singkat jika perlu.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-2">
            <div>
              <label
                htmlFor={`resolve-note-${alertId}`}
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Catatan Penyelesaian <span className="text-slate-400 font-normal">(opsional)</span>
              </label>
              <textarea
                id={`resolve-note-${alertId}`}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={200}
                placeholder="cth: Situasi sudah aman, tetangga sudah membantu..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-300 transition-all"
                rows={3}
              />
              <p className="text-right text-[11px] text-slate-400 mt-1">
                {note.length}/200
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-200/80 rounded-xl px-3 py-2.5">
              <p className="text-[11px] text-amber-700 leading-relaxed">
                ⚠️ Setelah dikonfirmasi, alert darurat ini akan ditandai sebagai <strong>Teratasi</strong> dan tidak dapat dibatalkan.
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-row gap-2 sm:gap-2 mt-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setNote("");
              }}
              className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
              disabled={loading}
            >
              <X className="w-3.5 h-3.5" />
              Batal
            </button>
            <button
              type="button"
              onClick={handleResolve}
              className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                  <span>Ya, Situasi Aman</span>
                </>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
