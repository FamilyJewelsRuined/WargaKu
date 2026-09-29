"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreditCard, Loader2, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function IplPaymentButton({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ipl/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pay" }),
      });

      if (!res.ok) throw new Error("Gagal memproses pembayaran");

      setDone(true);
      toast.success("Pembayaran berhasil! Terima kasih 🎉");
      setTimeout(() => {
        setOpen(false);
        setDone(false);
        router.refresh();
      }, 1500);
    } catch {
      toast.error("Gagal memproses pembayaran. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            size="sm"
            className="gradient-primary text-white text-xs font-semibold px-4 flex-shrink-0"
          >
            Bayar
          </Button>
        }
      />
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Konfirmasi Pembayaran IPL
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Pembayaran akan dicatat secara digital. Nomor resi akan
            digenerate otomatis sebagai bukti pembayaran.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center py-4 gap-3">
            <div className="w-16 h-16 rounded-full bg-green-950 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <p className="font-semibold text-green-400">Pembayaran Berhasil!</p>
          </div>
        ) : (
          <>
            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Jenis</span>
                <span className="font-medium">Iuran Pengangkutan Sampah</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Metode</span>
                <span className="font-medium">Transfer Virtual (Mock)</span>
              </div>
              <div className="flex justify-between text-sm font-semibold pt-2 border-t border-border">
                <span>Total</span>
                <span className="text-primary">Rp 30.000</span>
              </div>
            </div>

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
                onClick={handlePay}
                className="flex-1 gradient-primary text-white"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CreditCard className="w-4 h-4 mr-2" />
                )}
                {loading ? "Memproses..." : "Bayar Sekarang"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
