"use client";

import { AlertTriangle, ChevronRight } from "lucide-react";
import { usePanicDialog } from "@/components/panic-confirm-dialog";

interface PanicServiceCardProps {
  label: string;
  desc: string;
  iconBg: string;
  iconColor: string;
  arrowBg: string;
  arrowColor: string;
}

/**
 * Kartu "Panic Button" di Beranda. Tampilannya sama dengan kartu layanan lain
 * (kelas .dp-service-* didefinisikan di dashboard/page.tsx), tetapi membuka
 * popup konfirmasi, bukan berpindah halaman.
 */
export function PanicServiceCard({
  label,
  desc,
  iconBg,
  iconColor,
  arrowBg,
  arrowColor,
}: PanicServiceCardProps) {
  const { openPanicDialog } = usePanicDialog();

  return (
    <button
      type="button"
      onClick={openPanicDialog}
      className="dp-service-card"
      style={{ textAlign: "left", width: "100%", cursor: "pointer" }}
      aria-label="Panic Button — kirim peringatan darurat"
    >
      <div className="dp-service-card-top">
        <div className="dp-service-icon" style={{ background: iconBg }}>
          <AlertTriangle size={22} color={iconColor} strokeWidth={2} />
        </div>
        <div className="dp-service-arrow" style={{ background: arrowBg }}>
          <ChevronRight size={14} color={arrowColor} strokeWidth={2.5} />
        </div>
      </div>
      <p className="dp-service-label">{label}</p>
      <p className="dp-service-desc">{desc}</p>
    </button>
  );
}
