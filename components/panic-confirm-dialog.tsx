"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AlertTriangle, Loader2, PhoneCall } from "lucide-react";
import { toast } from "sonner";
import { playAlertSound } from "@/lib/alert-sound";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PanicDialogContextValue {
  /** Buka dialog konfirmasi alert darurat dari halaman mana pun. */
  openPanicDialog: () => void;
}

const PanicDialogContext = createContext<PanicDialogContextValue | null>(null);

export function usePanicDialog(): PanicDialogContextValue {
  const ctx = useContext(PanicDialogContext);
  if (!ctx) {
    throw new Error("usePanicDialog harus dipakai di dalam <PanicDialogProvider>");
  }
  return ctx;
}

/**
 * Menyediakan satu dialog konfirmasi darurat untuk seluruh dashboard.
 * Dialog dirender sekali di sini; tombol di menu bawah, kartu Beranda,
 * dan halaman Darurat hanya memanggil `openPanicDialog()`.
 */
export function PanicDialogProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const userName = session?.user?.name ?? "Warga";
  const userAddress = session?.user?.address || "Alamat tidak diketahui";

  const openPanicDialog = useCallback(() => {
    setSent(false);
    setOpen(true);
  }, []);

  const handlePanic = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/panic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Gagal mengirim alert");

      setSent(true);
      playAlertSound();
      toast.error(`🚨 Alert darurat terkirim! Semua warga diberitahu.`, {
        duration: 8000,
      });
      // Segarkan banner Beranda dan riwayat di halaman Darurat
      router.refresh();

      setTimeout(() => {
        setOpen(false);
        setSent(false);
      }, 3000);
    } catch {
      toast.error("Gagal mengirim alert. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(() => ({ openPanicDialog }), [openPanicDialog]);

  return (
    <PanicDialogContext.Provider value={value}>
      {children}

      <Dialog open={open} onOpenChange={setOpen}>
        {/* Fokus awal di "Batal" agar menekan Enter tanpa sengaja tidak mengirim alert */}
        <DialogContent
          className="bg-card border-red-900/50 max-w-sm"
          initialFocus={cancelRef}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Konfirmasi Alert Darurat
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Apakah Anda yakin ingin mengirim alert darurat?
            </DialogDescription>
          </DialogHeader>

          {sent ? (
            <div className="flex flex-col items-center py-6 gap-3">
              <div className="w-16 h-16 rounded-full bg-red-950 flex items-center justify-center glow-red">
                <PhoneCall className="w-8 h-8 text-red-400" />
              </div>
              <p className="font-bold text-red-400 text-lg">Alert Terkirim!</p>
              <p className="text-sm text-muted-foreground text-center">
                Semua warga telah diberitahu. Bantuan sedang dalam perjalanan.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-red-950/50 border border-red-900/50 rounded-xl p-4 space-y-2">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm space-y-1">
                    <p className="font-semibold text-foreground">
                      Notifikasi akan dikirim ke seluruh warga komplek!
                    </p>
                    <p className="text-muted-foreground">
                      Nama: <span className="text-foreground">{userName}</span>
                    </p>
                    <p className="text-muted-foreground">
                      Lokasi: <span className="text-foreground">{userAddress}</span>
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                ⚠️ Hanya gunakan tombol ini dalam keadaan darurat yang sesungguhnya.
                Penyalahgunaan dapat dikenakan sanksi dari RT.
              </p>

              <DialogFooter className="flex gap-2">
                <Button
                  ref={cancelRef}
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="flex-1 border-border"
                  disabled={loading}
                >
                  Batal
                </Button>
                <Button
                  onClick={handlePanic}
                  className="flex-1 gradient-danger text-white font-bold"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 mr-2" />
                  )}
                  {loading ? "Mengirim..." : "YA, KIRIM DARURAT"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PanicDialogContext.Provider>
  );
}
