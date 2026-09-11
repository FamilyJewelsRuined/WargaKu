"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, PhoneCall } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PanicButtonClientProps {
  userName: string;
  userAddress: string;
  userId: string;
}

export function PanicButtonClient({
  userName,
  userAddress,
}: PanicButtonClientProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handlePanic = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/panic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Gagal mengirim alert");

      setSent(true);
      toast.error(`🚨 Alert darurat terkirim! Semua warga diberitahu.`, {
        duration: 8000,
      });

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

  return (
    <>
      {/* Main Panic Button */}
      <div className="flex flex-col items-center py-8 gap-6">
        <div className="relative">
          {/* Outer pulse rings */}
          <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping-slow scale-125" />
          <div className="absolute inset-0 rounded-full bg-red-500/10 animate-ping-slow scale-150 delay-300" />

          <button
            onClick={() => setOpen(true)}
            className="relative w-48 h-48 rounded-full gradient-danger glow-red glow-red-pulse flex flex-col items-center justify-center gap-3 transition-all duration-200 active:scale-95 hover:scale-105 shadow-2xl"
          >
            <AlertTriangle className="w-16 h-16 text-white" strokeWidth={2.5} />
            <span className="text-white font-bold text-xl tracking-widest">
              DARURAT
            </span>
          </button>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Tekan tombol jika membutuhkan bantuan segera
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Notifikasi akan dikirim ke semua warga komplek
          </p>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-red-900/50 max-w-sm">
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
    </>
  );
}
