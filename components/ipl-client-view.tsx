"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  Home,
  Wallet,
  CreditCard,
  FileText,
  CheckCircle2,
  CalendarDays,
  Calendar,
  Clock,
  ChevronRight,
  Info,
  Landmark,
  Loader2,
  Copy,
  Check,
  ShieldCheck,
  QrCode,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const monthNames = [
  "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const monthShortNames = [
  "", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

interface PaymentItem {
  id: string;
  userId: string;
  amount: number;
  month: number;
  year: number;
  status: "PAID" | "UNPAID" | "OVERDUE";
  paymentDate: string | Date | null;
  receiptNumber: string | null;
  method: string | null;
  note: string | null;
  createdAt: string | Date;
}

interface IplClientViewProps {
  initialPayments: PaymentItem[];
  userAddress?: string | null;
}

export function IplClientView({ initialPayments }: IplClientViewProps) {
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentItem[]>(initialPayments);
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmStatusModalOpen, setConfirmStatusModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showBankInfo, setShowBankInfo] = useState(true);
  const [copiedBank, setCopiedBank] = useState<string | null>(null);

  // QRIS State
  const [qrString, setQrString] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isConfirmingStatus, setIsConfirmingStatus] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Sinkronkan state saat props initialPayments diperbarui dari server (misal via router.refresh)
  useEffect(() => {
    setPayments(initialPayments);
  }, [initialPayments]);

  const unpaid = payments.filter((p) => p.status !== "PAID");
  const paid = payments.filter((p) => p.status === "PAID");
  const totalPaid = paid.reduce((s, p) => s + p.amount, 0);

  // Active bill is the first unpaid bill
  const activeUnpaid = unpaid.length > 0 ? unpaid[unpaid.length - 1] : null;

  // Cleanup polling saat unmount atau modal tertutup
  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  // Update status lokal secara langsung agar UI responsif seketika
  const markPaymentAsPaid = (paymentId: string, updatedData?: Partial<PaymentItem>) => {
    setPayments((prev) =>
      prev.map((p) =>
        p.id === paymentId
          ? {
              ...p,
              status: "PAID" as const,
              paymentDate: updatedData?.paymentDate || new Date().toISOString(),
              receiptNumber:
                updatedData?.receiptNumber ||
                p.receiptNumber ||
                `WK-${p.year}-${String(p.month).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`,
              method: updatedData?.method || p.method || "QRIS",
            }
          : p
      )
    );
  };

  // Fungsi auto refresh data halaman dan server component
  const triggerAutoRefresh = () => {
    router.refresh();
    setTimeout(() => {
      router.refresh();
    }, 600);
  };

  // Countdown timer untuk expired QRIS
  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeRemaining("Kedaluwarsa");
        clearInterval(interval);
      } else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeRemaining(`${m}:${s < 10 ? "0" : ""}${s}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleOpenPayment = (payment: PaymentItem) => {
    stopPolling();
    setSelectedPayment(payment);
    setDone(false);
    setQrString(null);
    setExpiresAt(null);
    setTimeRemaining("");
    setDialogOpen(true);
  };

  const checkStatus = async (paymentId: string) => {
    try {
      const res = await fetch(`/api/ipl/${paymentId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.status === "PAID") {
        stopPolling();
        markPaymentAsPaid(paymentId, data);
        setDone(true);
        toast.success("Pembayaran QRIS berhasil diterima! 🎉");
        setTimeout(() => {
          setDialogOpen(false);
          setDone(false);
          triggerAutoRefresh();
        }, 1200);
      }
    } catch {
      // Abaikan error polling sementara
    }
  };

  const handleGenerateQris = async () => {
    if (!selectedPayment) return;
    setIsGeneratingQr(true);
    stopPolling();

    try {
      const res = await fetch(`/api/ipl/${selectedPayment.id}/qris`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat QRIS");
      }

      setQrString(data.qrString);
      setExpiresAt(data.expiresAt);

      // Mulai polling otomatis setiap 3 detik
      pollingRef.current = setInterval(() => {
        checkStatus(selectedPayment.id);
      }, 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memproses QRIS";
      toast.error(msg);
    } finally {
      setIsGeneratingQr(false);
    }
  };

  // Konfirmasi status dari modal pop up "Saya Sudah Bayar"
  const handleConfirmPaymentStatus = async () => {
    if (!selectedPayment) return;
    setIsConfirmingStatus(true);
    try {
      const res = await fetch(`/api/ipl/${selectedPayment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pay", method: "QRIS" }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Gagal mengonfirmasi status pembayaran");
      }

      const resData = await res.json();
      stopPolling();
      markPaymentAsPaid(selectedPayment.id, resData.payment);
      setConfirmStatusModalOpen(false);
      setDialogOpen(false);
      setDone(false);

      toast.success("Pembayaran berhasil dikonfirmasi! Status telah Lunas 🎉");

      // Auto refresh halaman
      triggerAutoRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memproses konfirmasi status";
      toast.error(msg);
    } finally {
      setIsConfirmingStatus(false);
    }
  };

  // Mock bayar langsung untuk pengujian instan jika dibutuhkan
  const handlePay = async () => {
    if (!selectedPayment) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/ipl/${selectedPayment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pay", method: "MOCK_TRANSFER" }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Gagal memproses pembayaran");
      }

      const resData = await res.json();
      stopPolling();
      markPaymentAsPaid(selectedPayment.id, resData.payment);
      setDone(true);
      toast.success("Pembayaran berhasil! Terima kasih 🎉");
      setTimeout(() => {
        setDialogOpen(false);
        setDone(false);
        triggerAutoRefresh();
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memproses pembayaran";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      stopPolling();
    }
    setDialogOpen(open);
  };

  const copyToClipboard = (text: string, bank: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBank(bank);
    toast.success(`Nomor rekening ${bank} berhasil disalin!`);
    setTimeout(() => setCopiedBank(null), 2000);
  };

  return (
    <>
      <style>{`
        /* ── Base Container (Mobile first) ── */
        .ipl-page-wrap {
          width: 100%;
          max-width: 520px;
          margin: 0 auto;
          padding: 8px 16px 60px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
          color: #1e293b;
        }

        /* ── Desktop Adaptations ── */
        @media (min-width: 900px) {
          .ipl-page-wrap {
            max-width: 1060px;
            margin: 0;
            padding: 24px 32px 50px;
          }
          .btn-ipl-back {
            display: none !important;
          }
          .ipl-top-overview-grid {
            display: grid;
            grid-template-columns: 1.15fr 1fr;
            gap: 20px;
            align-items: stretch;
            margin-bottom: 26px;
          }
          .ipl-active-card {
            margin-bottom: 0 !important;
            height: 100%;
          }
          .ipl-stats-grid {
            margin-bottom: 0 !important;
            height: 100%;
            align-content: stretch;
          }
          .ipl-stat-card {
            justify-content: center;
          }
          .ipl-main-two-columns {
            display: grid;
            grid-template-columns: 1.35fr 1fr;
            gap: 26px;
            align-items: flex-start;
          }
        }

        /* ── Header ── */
        .ipl-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 20px;
          gap: 12px;
        }
        .ipl-header-left {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
        }
        .ipl-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .btn-ipl-back {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1e3a8a;
          text-decoration: none;
          transition: opacity 0.15s;
        }
        .btn-ipl-back:hover {
          opacity: 0.75;
        }
        .ipl-home-icon {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          background: #1e3a8a;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .ipl-page-title {
          font-size: 24px;
          font-weight: 800;
          color: #1e3a8a;
          letter-spacing: -0.4px;
          margin: 0;
          line-height: 1.2;
        }
        .ipl-page-subtitle {
          font-size: 13.5px;
          color: #64748b;
          margin: 2px 0 0 0;
          line-height: 1.45;
        }

        /* Header Illustration with 22.png & Invoice Overlay */
        .ipl-illustration-wrap {
          position: relative;
          width: 135px;
          height: 75px;
          flex-shrink: 0;
        }
        .ipl-illustration-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: bottom right;
        }
        .ipl-invoice-badge {
          position: absolute;
          top: -2px;
          right: 2px;
          display: flex;
          align-items: flex-end;
          pointer-events: none;
        }
        .ipl-invoice-doc {
          width: 38px;
          height: 48px;
          background: #ffffff;
          border: 1.5px solid #bfdbfe;
          border-radius: 6px;
          padding: 5px;
          box-shadow: 0 4px 10px rgba(37, 99, 235, 0.12);
          display: flex;
          flex-direction: column;
          gap: 3.5px;
        }
        .ipl-doc-line {
          height: 2.5px;
          background: #93c5fd;
          border-radius: 2px;
        }
        .ipl-rp-coin {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: #ffffff;
          font-size: 9px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: -8px;
          margin-bottom: -3px;
          box-shadow: 0 2px 6px rgba(37, 99, 235, 0.35);
          border: 1px solid #ffffff;
        }

        /* ── Blue Highlight Active Bill Card ── */
        .ipl-active-card {
          background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
          border-radius: 20px;
          padding: 20px 22px;
          color: #ffffff;
          box-shadow: 0 10px 25px -4px rgba(37, 99, 235, 0.35);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 16px;
        }
        .ipl-active-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .ipl-wallet-icon-wrap {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          flex-shrink: 0;
        }
        .ipl-active-meta {
          display: flex;
          flex-direction: column;
        }
        .ipl-active-label {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.9);
          margin: 0 0 3px;
          font-weight: 500;
        }
        .ipl-active-amount {
          font-size: 26px;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.15;
          margin: 0 0 4px;
        }
        .ipl-active-period {
          font-size: 12.5px;
          color: rgba(255, 255, 255, 0.85);
          margin: 0;
        }
        .btn-bayar-sekarang {
          background: #ffffff;
          color: #2563eb;
          border: none;
          border-radius: 12px;
          padding: 10px 16px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transition: transform 0.15s ease, background 0.15s ease;
          flex-shrink: 0;
          font-family: inherit;
        }
        .btn-bayar-sekarang:hover {
          background: #f8fafc;
          transform: translateY(-1px);
        }

        /* ── 3 Summary Stats Cards ── */
        .ipl-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
        .ipl-stat-card {
          background: #ffffff;
          border: 1px solid #e8eef6;
          border-radius: 16px;
          padding: 14px 8px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
        }
        .ipl-stat-icon-wrap {
          margin-bottom: 2px;
        }
        .ipl-stat-num {
          font-size: 20px;
          font-weight: 800;
          color: #1e293b;
          margin: 0;
          line-height: 1.2;
        }
        .ipl-stat-label {
          font-size: 12px;
          color: #64748b;
          margin: 0;
          font-weight: 500;
        }

        /* ── Section Title ── */
        .ipl-section-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }
        .ipl-section-title {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        /* ── History Items ── */
        .ipl-history-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 26px;
        }
        .ipl-history-card {
          background: #ffffff;
          border: 1px solid #e8eef6;
          border-radius: 16px;
          padding: 16px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .ipl-history-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
        }
        .ipl-history-left {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }
        .ipl-history-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .ipl-history-icon-box.paid {
          background: #ecfdf5;
          border: 1px solid #d1fae5;
          color: #10b981;
        }
        .ipl-history-icon-box.unpaid {
          background: #eff6ff;
          border: 1px solid #dbeafe;
          color: #3b82f6;
        }
        .ipl-history-meta {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }
        .ipl-history-month {
          font-size: 15px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }
        .ipl-history-amount-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ipl-history-amount {
          font-size: 13.5px;
          color: #64748b;
          font-weight: 500;
        }
        .ipl-badge-overdue {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          background: #fee2e2;
          color: #ef4444;
          font-size: 10.5px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 9999px;
        }
        .ipl-badge-unpaid {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          background: #fef3c7;
          color: #d97706;
          font-size: 10.5px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 9999px;
        }
        .ipl-history-code-row {
          font-size: 12px;
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ipl-history-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .ipl-pill-lunas {
          background: #10b981;
          color: #ffffff;
          padding: 5px 14px;
          border-radius: 9999px;
          font-weight: 700;
          font-size: 12px;
        }
        .btn-ipl-pay-item {
          background: #eff6ff;
          color: #2563eb;
          border: 1.5px solid #dbeafe;
          border-radius: 10px;
          padding: 6px 16px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
        }
        .btn-ipl-pay-item:hover {
          background: #2563eb;
          color: #ffffff;
          border-color: #2563eb;
        }
        .ipl-chevron {
          color: #cbd5e1;
        }

        /* ── Informasi Pembayaran & Bank Cards ── */
        .ipl-info-cards {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .ipl-info-card {
          background: #ffffff;
          border: 1px solid #e8eef6;
          border-radius: 16px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
          transition: border-color 0.15s ease;
        }
        .ipl-info-card:hover {
          border-color: #cbd5e1;
        }
        .ipl-info-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .ipl-info-icon-box {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #eff6ff;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .ipl-info-title {
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }
        .ipl-info-sub {
          font-size: 12px;
          color: #64748b;
          margin: 2px 0 0 0;
        }

        /* Bank Virtual Accounts container */
        .ipl-bank-details {
          background: #ffffff;
          border: 1px solid #e8eef6;
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }
        .ipl-bank-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f8fafc;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }
        .ipl-bank-name {
          font-weight: 700;
          font-size: 13px;
          color: #1e293b;
          display: block;
          margin-bottom: 2px;
        }
        .ipl-bank-acc {
          font-size: 13.5px;
          font-family: monospace;
          color: #2563eb;
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        .btn-copy-acc {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #475569;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 10px;
          border-radius: 8px;
          transition: all 0.15s;
        }
        .btn-copy-acc:hover {
          background: #eff6ff;
          border-color: #93c5fd;
          color: #2563eb;
        }

        /* Panduan Pembayaran Card (Desktop & Mobile) */
        .ipl-guide-card {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .ipl-guide-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 700;
          color: #166534;
          margin: 0;
        }
        .ipl-guide-list {
          margin: 0;
          padding-left: 18px;
          font-size: 12px;
          color: #15803d;
          line-height: 1.6;
        }
      `}</style>

      <div className="ipl-page-wrap">
        {/* Header */}
        <div className="ipl-header">
          <div className="ipl-header-left">
            <div className="ipl-title-row">
              <Link href="/dashboard" className="btn-ipl-back" aria-label="Kembali ke Beranda">
                <ArrowLeft size={22} />
              </Link>
              <div className="ipl-home-icon">
                <Home size={18} />
              </div>
              <h1 className="ipl-page-title">Pembayaran IPL</h1>
            </div>
            <p className="ipl-page-subtitle">
              Bayar iuran pengelolaan lingkungan secara mudah dan aman.
            </p>
          </div>

          {/* House + Invoice Illustration */}
          <div className="ipl-illustration-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/22.png" alt="Rumah Warga" className="ipl-illustration-img" />
            <div className="ipl-invoice-badge">
              <div className="ipl-invoice-doc">
                <div className="ipl-doc-line" style={{ width: "24px" }} />
                <div className="ipl-doc-line" style={{ width: "16px" }} />
                <div className="ipl-doc-line" style={{ width: "20px" }} />
                <div className="ipl-doc-line" style={{ width: "12px" }} />
              </div>
              <div className="ipl-rp-coin">Rp</div>
            </div>
          </div>
        </div>

        {/* Top Overview Grid (Responsive: 1 col on mobile, 2 col on desktop) */}
        <div className="ipl-top-overview-grid">
          {/* Highlight Blue Card */}
          <div className="ipl-active-card">
            <div className="ipl-active-left">
              <div className="ipl-wallet-icon-wrap">
                <Wallet size={24} />
              </div>
              <div className="ipl-active-meta">
                <p className="ipl-active-label">Total Tagihan Aktif</p>
                <p className="ipl-active-amount">
                  Rp {(activeUnpaid ? activeUnpaid.amount : 0).toLocaleString("id-ID")}
                </p>
                <p className="ipl-active-period">
                  {activeUnpaid
                    ? `Periode ${monthNames[activeUnpaid.month]} ${activeUnpaid.year}`
                    : "Semua tagihan sudah lunas 🎉"}
                </p>
              </div>
            </div>

            {activeUnpaid ? (
              <button
                type="button"
                onClick={() => handleOpenPayment(activeUnpaid)}
                className="btn-bayar-sekarang"
              >
                <CreditCard size={15} />
                <span>Bayar Sekarang</span>
                <ChevronRight size={15} />
              </button>
            ) : (
              <div className="btn-bayar-sekarang" style={{ cursor: "default", opacity: 0.9 }}>
                <CheckCircle2 size={16} color="#10b981" />
                <span>Lunas</span>
              </div>
            )}
          </div>

          {/* 3 Summary Stats Cards */}
          <div className="ipl-stats-grid">
            <div className="ipl-stat-card">
              <div className="ipl-stat-icon-wrap">
                <FileText size={20} color="#2563eb" />
              </div>
              <p className="ipl-stat-num">{unpaid.length}</p>
              <p className="ipl-stat-label">Belum Bayar</p>
            </div>

            <div className="ipl-stat-card">
              <div className="ipl-stat-icon-wrap">
                <CheckCircle2 size={20} color="#10b981" />
              </div>
              <p className="ipl-stat-num">{paid.length}</p>
              <p className="ipl-stat-label">Sudah Lunas</p>
            </div>

            <div className="ipl-stat-card">
              <div className="ipl-stat-icon-wrap">
                <Wallet size={20} color="#334155" />
              </div>
              <p className="ipl-stat-num">{(totalPaid / 1000).toFixed(0)}k</p>
              <p className="ipl-stat-label">Total Bayar</p>
            </div>
          </div>
        </div>

        {/* Main Content Area (Responsive: 1 col on mobile, 2 col on desktop) */}
        <div className="ipl-main-two-columns">
          {/* Left / Main Column: Riwayat Pembayaran */}
          <div className="ipl-history-column">
            <div className="ipl-section-title-row">
              <CalendarDays size={18} color="#1e3a8a" />
              <h2 className="ipl-section-title">Riwayat Pembayaran</h2>
            </div>

            <div className="ipl-history-list">
              {payments.length === 0 ? (
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e8eef6",
                    borderRadius: "16px",
                    padding: "36px",
                    textAlign: "center",
                    color: "#64748b",
                    fontSize: "13.5px",
                  }}
                >
                  Belum ada data iuran
                </div>
              ) : (
                payments.map((payment) => {
                  const isPaid = payment.status === "PAID";
                  const isOverdue = payment.status === "OVERDUE";
                  const monthLabel = monthNames[payment.month];
                  const monthShort = monthShortNames[payment.month];

                  const displayDate = isPaid
                    ? payment.paymentDate
                      ? format(new Date(payment.paymentDate), "dd MMM yyyy", { locale: idLocale })
                      : format(new Date(payment.createdAt), "dd MMM yyyy", { locale: idLocale })
                    : `15 ${monthShort} ${payment.year}`;

                  const displayReceipt =
                    payment.receiptNumber ||
                    `VK-${payment.year}-${String(payment.month).padStart(2, "0")}-${payment.id.slice(-5)}`;

                  return (
                    <div key={payment.id} className="ipl-history-card">
                      <div className="ipl-history-left">
                        <div className={`ipl-history-icon-box ${isPaid ? "paid" : "unpaid"}`}>
                          {isPaid ? <Calendar size={20} /> : <CalendarDays size={20} />}
                        </div>

                        <div className="ipl-history-meta">
                          <p className="ipl-history-month">
                            {monthLabel} {payment.year}
                          </p>

                          <div className="ipl-history-amount-row">
                            <span className="ipl-history-amount">
                              Rp {payment.amount.toLocaleString("id-ID")}
                            </span>
                            {!isPaid && (
                              isOverdue ? (
                                <span className="ipl-badge-overdue">
                                  <Clock size={11} />
                                  <span>Terlambat</span>
                                </span>
                              ) : (
                                <span className="ipl-badge-unpaid">
                                  <Clock size={11} />
                                  <span>Belum Bayar</span>
                                </span>
                              )
                            )}
                          </div>

                          <div className="ipl-history-code-row">
                            {displayReceipt} &bull; {displayDate}
                          </div>
                        </div>
                      </div>

                      <div className="ipl-history-right">
                        {isPaid ? (
                          <>
                            <span className="ipl-pill-lunas">Lunas</span>
                            <ChevronRight size={18} className="ipl-chevron" />
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenPayment(payment)}
                              className="btn-ipl-pay-item"
                            >
                              Bayar
                            </button>
                            <ChevronRight size={18} className="ipl-chevron" />
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Informasi Pembayaran & Rekening Virtual */}
          <div className="ipl-info-column">
            <div className="ipl-section-title-row">
              <Info size={18} color="#1e3a8a" />
              <h2 className="ipl-section-title">Informasi Pembayaran</h2>
            </div>

            <div className="ipl-info-cards">
              {/* Card 1: Metode Pembayaran */}
              <div
                className="ipl-info-card"
                onClick={() => setShowBankInfo(!showBankInfo)}
              >
                <div className="ipl-info-left">
                  <div className="ipl-info-icon-box">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="ipl-info-title">Metode Pembayaran</p>
                    <p className="ipl-info-sub">Transfer Bank / Virtual Account</p>
                  </div>
                </div>
                <ChevronRight size={18} className="ipl-chevron" />
              </div>

              {/* Card 2: Virtual Account Details */}
              <div className="ipl-bank-details">
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <Landmark size={18} color="#2563eb" />
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>
                    Nomor Rekening Virtual Account
                  </span>
                </div>

                <div className="ipl-bank-item">
                  <div>
                    <span className="ipl-bank-name">BCA Virtual Account</span>
                    <div className="ipl-bank-acc">8271 0812 3456 7890</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard("8271081234567890", "BCA")}
                    className="btn-copy-acc"
                  >
                    {copiedBank === "BCA" ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    <span>{copiedBank === "BCA" ? "Disalin" : "Salin"}</span>
                  </button>
                </div>

                <div className="ipl-bank-item">
                  <div>
                    <span className="ipl-bank-name">Mandiri Virtual Account</span>
                    <div className="ipl-bank-acc">8962 1081 2345 6789</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard("8962108123456789", "Mandiri")}
                    className="btn-copy-acc"
                  >
                    {copiedBank === "Mandiri" ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    <span>{copiedBank === "Mandiri" ? "Disalin" : "Salin"}</span>
                  </button>
                </div>

                <div className="ipl-bank-item">
                  <div>
                    <span className="ipl-bank-name">BRI Virtual Account</span>
                    <div className="ipl-bank-acc">1289 0081 2345 6789</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard("1289008123456789", "BRI")}
                    className="btn-copy-acc"
                  >
                    {copiedBank === "BRI" ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    <span>{copiedBank === "BRI" ? "Disalin" : "Salin"}</span>
                  </button>
                </div>
              </div>

              {/* Panduan Pembayaran */}
              <div className="ipl-guide-card">
                <p className="ipl-guide-title">
                  <ShieldCheck size={16} />
                  <span>Panduan Pembayaran</span>
                </p>
                <ol className="ipl-guide-list">
                  <li>Salin nomor Virtual Account sesuai bank Anda.</li>
                  <li>Masukkan nomor VA di menu transfer bank Anda.</li>
                  <li>Pastikan nama tagihan sesuai dengan unit warga Anda.</li>
                  <li>Bukti transaksi otomatis tersimpan di riwayat.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation & QRIS Payment Modal */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="bg-white border-[#e8eef6] text-slate-800 max-w-sm rounded-2xl p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 text-lg font-bold">
              {qrString ? (
                <>
                  <QrCode className="w-5 h-5 text-red-600" />
                  <span>Scan QRIS WargaKu</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <span>Konfirmasi Pembayaran IPL</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs mt-1">
              {qrString
                ? "Buka aplikasi m-Banking atau E-Wallet pilihan Anda untuk scan QRIS berikut."
                : "Pembayaran akan dicatat secara digital dan bukti tanda terima otomatis terbit."}
            </DialogDescription>
          </DialogHeader>

          {done ? (
            <div className="flex flex-col items-center py-6 gap-3">
              <div className="w-16 h-16 rounded-full bg-green-100 border border-green-200 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-green-600" />
              </div>
              <p className="font-bold text-slate-900 text-base">Pembayaran Berhasil Diterima!</p>
              <p className="text-xs text-slate-500 text-center">
                Iuran periode {selectedPayment ? `${monthNames[selectedPayment.month]} ${selectedPayment.year}` : ""} telah lunas tercatat di sistem.
              </p>
            </div>
          ) : qrString ? (
            <div className="flex flex-col items-center py-2 space-y-3">
              {/* QRIS Container */}
              <div className="relative p-3 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center">
                <div className="flex items-center justify-between w-full px-2 mb-2">
                  <span className="text-[10px] font-extrabold tracking-widest text-red-600 uppercase">QRIS</span>
                  <span className="text-[10px] font-medium text-slate-400">Pembayaran Nasional</span>
                </div>
                <div className="bg-white p-2 rounded-xl">
                  <QRCodeSVG value={qrString} size={200} level="M" />
                </div>
                <div className="mt-2 text-center">
                  <p className="text-xs text-slate-500">Total Nominal</p>
                  <p className="text-base font-bold text-slate-900">
                    Rp {selectedPayment ? selectedPayment.amount.toLocaleString("id-ID") : "30.000"}
                  </p>
                </div>
              </div>

              {/* Status & Countdown */}
              <div className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-center">
                <div className="flex items-center justify-center gap-2 text-xs font-medium text-amber-700">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span>Menunggu Pembayaran...</span>
                </div>
                {timeRemaining && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Berlaku sampai: <span className="font-semibold text-slate-700">{timeRemaining}</span>
                  </p>
                )}
              </div>

              {/* Info Pembayaran */}
              <p className="text-[11px] text-slate-400 text-center leading-tight">
                Mendukung BCA, Mandiri, BRI, BNI, GoPay, OVO, Dana, ShopeePay, dan aplikasi PJSP berizin BI.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col w-full gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setConfirmStatusModalOpen(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  disabled={isCheckingStatus || isConfirmingStatus}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Saya Sudah Bayar (Cek Status)</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleDialogChange(false)}
                    className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handlePay}
                    className="py-2 px-3 rounded-xl bg-slate-100 text-slate-500 text-[11px] font-medium hover:bg-slate-200 transition-colors"
                    title="Simulasi instan untuk pengujian lokal"
                  >
                    Simulasi Cepat
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2.5 my-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Jenis Iuran</span>
                  <span className="font-semibold text-slate-800">Iuran Pengelolaan Lingkungan</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Periode</span>
                  <span className="font-semibold text-slate-800">
                    {selectedPayment ? `${monthNames[selectedPayment.month]} ${selectedPayment.year}` : "-"}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Metode</span>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    QRIS Dinamis (Midtrans)
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200">
                  <span className="text-slate-900">Total Tagihan</span>
                  <span className="text-blue-600">
                    Rp {selectedPayment ? selectedPayment.amount.toLocaleString("id-ID") : "30.000"}
                  </span>
                </div>
              </div>

              <DialogFooter className="flex gap-2 sm:gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors"
                  disabled={isGeneratingQr || loading}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleGenerateQris}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5"
                  disabled={isGeneratingQr || loading}
                >
                  {isGeneratingQr ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <QrCode className="w-4 h-4" />
                  )}
                  <span>{isGeneratingQr ? "Membuat QRIS..." : "Bayar via QRIS"}</span>
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal Pop Up untuk "Saya Sudah Bayar" */}
      <Dialog open={confirmStatusModalOpen} onOpenChange={setConfirmStatusModalOpen}>
        <DialogContent className="z-[70] bg-white border border-[#e8eef6] text-slate-800 max-w-sm rounded-2xl p-6 shadow-2xl">
          <DialogHeader className="text-center sm:text-center items-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 mb-2 shadow-xs">
              <CheckCircle2 className="w-7 h-7" strokeWidth={2.5} />
            </div>
            <DialogTitle className="text-slate-900 text-lg font-bold">
              Konfirmasi Status Pembayaran
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs mt-1 text-center">
              Pastikan Anda telah menyelesaikan pembayaran QRIS atau transfer sebelum mengonfirmasi.
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2 my-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Periode Tagihan</span>
                <span className="font-semibold text-slate-800">
                  {monthNames[selectedPayment.month]} {selectedPayment.year}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Total Nominal</span>
                <span className="font-bold text-blue-600 text-sm">
                  Rp {selectedPayment.amount.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Metode</span>
                <span className="font-medium text-slate-700">QRIS Dinamis</span>
              </div>
              <div className="pt-2 border-t border-slate-200/80">
                <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                  Apakah Anda yakin <strong className="text-slate-700">sudah berhasil membayar</strong> tagihan ini? Status akan otomatis diperbarui dan halaman di-refresh.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-row gap-2 sm:gap-2 mt-2">
            <button
              type="button"
              onClick={() => setConfirmStatusModalOpen(false)}
              className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors"
              disabled={isConfirmingStatus}
            >
              Belum / Batal
            </button>
            <button
              type="button"
              onClick={handleConfirmPaymentStatus}
              className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
              disabled={isConfirmingStatus}
            >
              {isConfirmingStatus ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                  <span>Ya, Sudah Bayar</span>
                </>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
