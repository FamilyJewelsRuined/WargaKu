"use client";

import { AlertTriangle } from "lucide-react";
import { usePanicDialog } from "@/components/panic-confirm-dialog";

/**
 * Tombol DARURAT besar di halaman /dashboard/panic.
 * Dialog konfirmasi dan logika pengiriman ada di PanicDialogProvider
 * (dipasang di layout dashboard) sehingga dipakai bersama dengan menu bawah dan Beranda.
 */
export function PanicButtonClient() {
  const { openPanicDialog } = usePanicDialog();

  return (
    <div className="flex flex-col items-center py-8 gap-6">
      <div className="relative">
        {/* Outer pulse rings */}
        <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping-slow scale-125" />
        <div className="absolute inset-0 rounded-full bg-red-500/10 animate-ping-slow scale-150 delay-300" />

        <button
          onClick={openPanicDialog}
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
  );
}
