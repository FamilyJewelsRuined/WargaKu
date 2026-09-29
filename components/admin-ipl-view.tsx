"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  PlusCircle,
  Settings2,
  Calendar,
  Search,
  Filter,
  Loader2,
  DollarSign,
  TrendingUp,
  Receipt,
  FileCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const monthNames = [
  "",
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export interface PaymentRecord {
  id: string;
  householdId: string;
  amount: number;
  month: number;
  year: number;
  status: "PAID" | "UNPAID" | "OVERDUE";
  dueDate: Date | string | null;
  paymentDate: Date | string | null;
  receiptNumber: string | null;
  method: string | null;
  note: string | null;
  household: {
    unitNumber: string;
    address: string | null;
  };
  paidBy: {
    name: string;
  } | null;
}

export interface IplConfigItem {
  id: string;
  amount: number;
  effectiveFrom: Date | string;
  note: string | null;
  createdBy: {
    name: string;
  };
}

interface AdminIplViewProps {
  initialPayments: PaymentRecord[];
  activeConfig: IplConfigItem | null;
  configs: IplConfigItem[];
  totalActiveUnits: number;
}

export function AdminIplView({
  initialPayments,
  activeConfig,
  configs: initialConfigs,
  totalActiveUnits,
}: AdminIplViewProps) {
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentRecord[]>(initialPayments);
  const [configs, setConfigs] = useState<IplConfigItem[]>(initialConfigs);
  const [currentAmount, setCurrentAmount] = useState<number>(activeConfig?.amount ?? 50000);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PAID" | "UNPAID" | "OVERDUE">("ALL");

  // Modal Generate Tagihan
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewData, setPreviewData] = useState<{
    unbilledCount: number;
    month: number;
    year: number;
    amount: number;
  } | null>(null);

  // Modal Config Tarif
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [newAmount, setNewAmount] = useState(String(currentAmount));
  const [effectiveFrom, setEffectiveFrom] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().split("T")[0]
  );
  const [configNote, setConfigNote] = useState("");
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Modal Mark Paid Manual
  const [markPaidModalOpen, setMarkPaidModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [payMethod, setPayMethod] = useState("TUNAI");
  const [payNote, setPayNote] = useState("");
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);

  // Evaluasi computed status (OVERDUE jika UNPAID dan melewati dueDate)
  const computedPayments = payments.map((p) => {
    let effectiveStatus: "PAID" | "UNPAID" | "OVERDUE" = p.status;
    if (p.status === "UNPAID" && p.dueDate && new Date(p.dueDate) < new Date()) {
      effectiveStatus = "OVERDUE";
    }
    return { ...p, effectiveStatus };
  });

  // Filtered Payments
  const filteredPayments = computedPayments.filter((p) => {
    const matchSearch =
      p.household.unitNumber.toLowerCase().includes(search.toLowerCase()) ||
      (p.household.address && p.household.address.toLowerCase().includes(search.toLowerCase())) ||
      (p.paidBy?.name && p.paidBy.name.toLowerCase().includes(search.toLowerCase()));

    if (!matchSearch) return false;
    if (statusFilter !== "ALL" && p.effectiveStatus !== statusFilter) return false;
    return true;
  });

  // Stats
  const totalPaid = computedPayments.filter((p) => p.effectiveStatus === "PAID").length;
  const totalUnpaid = computedPayments.filter((p) => p.effectiveStatus === "UNPAID").length;
  const totalOverdue = computedPayments.filter((p) => p.effectiveStatus === "OVERDUE").length;
  const totalRevenue = computedPayments
    .filter((p) => p.effectiveStatus === "PAID")
    .reduce((s, p) => s + p.amount, 0);

  // Buka Modal Generate Tagihan dengan hitung unbilled preview
  const openGenerateDialog = () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const billedInCurrentMonth = new Set(
      payments
        .filter((p) => p.month === currentMonth && p.year === currentYear)
        .map((p) => p.householdId)
    );

    const unbilled = Math.max(0, totalActiveUnits - billedInCurrentMonth.size);

    setPreviewData({
      month: currentMonth,
      year: currentYear,
      amount: currentAmount,
      unbilledCount: unbilled,
    });
    setGenerateModalOpen(true);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/admin/ipl/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menerbitkan tagihan");

      toast.success(data.message);
      setGenerateModalOpen(false);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseInt(newAmount.replace(/\D/g, ""), 10);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error("Nominal tarif harus lebih dari 0");
      return;
    }

    setIsSavingConfig(true);
    try {
      const res = await fetch("/api/admin/ipl-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsedAmount,
          effectiveFrom,
          note: configNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan tarif baru");

      toast.success(data.message);
      setCurrentAmount(parsedAmount);
      setConfigs((prev) => [data.config, ...prev]);
      setConfigModalOpen(false);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(msg);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const openMarkPaidDialog = (payment: PaymentRecord) => {
    setSelectedPayment(payment);
    setPayMethod("TUNAI");
    setPayNote("");
    setMarkPaidModalOpen(true);
  };

  const handleMarkPaid = async () => {
    if (!selectedPayment) return;

    setIsSubmittingPay(true);
    try {
      const res = await fetch(`/api/admin/ipl/${selectedPayment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mark-paid",
          method: payMethod,
          note: payNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menandai lunas");

      toast.success(data.message);
      setPayments((prev) =>
        prev.map((p) => (p.id === selectedPayment.id ? { ...p, ...data.payment } : p))
      );
      setMarkPaidModalOpen(false);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(msg);
    } finally {
      setIsSubmittingPay(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Keuangan RT & Iuran Warga
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Laporan IPL
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelola penagihan iuran pengangkutan sampah, penerbitan tagihan unit, dan pelunasan manual.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            id="btn-config-ipl"
            type="button"
            variant="outline"
            onClick={() => setConfigModalOpen(true)}
            className="flex items-center gap-1.5 font-bold text-slate-700 bg-white shadow-xs"
          >
            <Settings2 size={16} />
            Tarif: Rp {currentAmount.toLocaleString("id-ID")}
          </Button>

          <Button
            id="btn-generate-ipl"
            type="button"
            onClick={openGenerateDialog}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-xs"
          >
            <PlusCircle size={16} />
            Terbitkan Tagihan Bulan Ini
          </Button>
        </div>
      </div>

      {/* ── Stats Summary ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-400">Total Lunas</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600">{totalPaid}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-400">Belum Bayar</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600">{totalUnpaid}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-400">Terlambat (Overdue)</span>
            <AlertCircle size={16} className="text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600">{totalOverdue}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-400">Kas Terkumpul</span>
            <DollarSign size={16} className="text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            Rp {totalRevenue.toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari unit atau nama pembayar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === "ALL"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Semua ({computedPayments.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("PAID")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === "PAID"
                ? "bg-emerald-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Lunas ({totalPaid})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("UNPAID")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === "UNPAID"
                ? "bg-amber-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Belum Bayar ({totalUnpaid})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("OVERDUE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === "OVERDUE"
                ? "bg-rose-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Terlambat ({totalOverdue})
          </button>
        </div>
      </div>

      {/* ── Payments Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-5">Unit Hunian</th>
                <th className="py-3.5 px-4">Periode</th>
                <th className="py-3.5 px-4">Tagihan</th>
                <th className="py-3.5 px-4">Jatuh Tempo</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 hidden md:table-cell">Riwayat Pembayaran</th>
                <th className="py-3.5 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                    Tidak ada data tagihan IPL yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const isPaid = p.effectiveStatus === "PAID";
                  const isOverdue = p.effectiveStatus === "OVERDUE";

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Unit */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-100 flex-shrink-0">
                            {p.household.unitNumber}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">
                              Unit {p.household.unitNumber}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {p.household.address ?? "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Periode */}
                      <td className="py-4 px-4 font-semibold text-slate-800">
                        {monthNames[p.month]} {p.year}
                      </td>

                      {/* Tagihan */}
                      <td className="py-4 px-4 font-bold text-slate-900">
                        Rp {p.amount.toLocaleString("id-ID")}
                      </td>

                      {/* Jatuh Tempo */}
                      <td className="py-4 px-4 text-xs text-slate-500">
                        {p.dueDate
                          ? format(new Date(p.dueDate), "dd MMM yyyy", { locale: idLocale })
                          : "Tgl 10"}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            isPaid
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : isOverdue
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {isPaid ? (
                            <>
                              <CheckCircle2 size={12} /> Lunas
                            </>
                          ) : isOverdue ? (
                            <>
                              <AlertCircle size={12} /> Terlambat
                            </>
                          ) : (
                            <>
                              <Clock size={12} /> Belum Bayar
                            </>
                          )}
                        </span>
                      </td>

                      {/* Riwayat */}
                      <td className="py-4 px-4 hidden md:table-cell text-xs text-slate-500">
                        {isPaid ? (
                          <div>
                            <p className="font-medium text-slate-700">
                              {p.paidBy?.name ? `Oleh: ${p.paidBy.name}` : p.method || "Lunas"}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {p.paymentDate
                                ? format(new Date(p.paymentDate), "dd MMM yyyy", { locale: idLocale })
                                : "—"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Menunggu pembayaran</span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-4 px-5 text-right">
                        {!isPaid ? (
                          <button
                            type="button"
                            onClick={() => openMarkPaidDialog(p)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center gap-1.5 ml-auto"
                          >
                            <FileCheck size={14} />
                            Tandai Lunas
                          </button>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400">
                            {p.receiptNumber || "Tervalidasi"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Dialog Generate Tagihan ── */}
      <Dialog open={generateModalOpen} onOpenChange={setGenerateModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <PlusCircle size={20} className="text-blue-600" />
              Terbitkan Tagihan IPL Bulan Ini
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed">
              Sistem akan menerbitkan tagihan IPL secara serentak untuk unit hunian aktif yang belum ditagih pada bulan berjalan.
            </DialogDescription>
          </DialogHeader>

          {previewData && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2.5 my-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Periode Tagihan:</span>
                <span className="font-bold text-slate-800">
                  {monthNames[previewData.month]} {previewData.year}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Tarif IPL per Unit:</span>
                <span className="font-bold text-blue-700">
                  Rp {previewData.amount.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Total Unit Aktif:</span>
                <span className="font-bold text-slate-800">{totalActiveUnits} unit</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-700 font-bold">Unit yang Akan Diterbitkan:</span>
                <span className="font-extrabold text-emerald-700">
                  {previewData.unbilledCount} unit baru
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setGenerateModalOpen(false)}
              disabled={isGenerating}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || previewData?.unbilledCount === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-1.5" />
                  Menerbitkan...
                </>
              ) : previewData?.unbilledCount === 0 ? (
                "Semua Sudah Ditagih"
              ) : (
                "Ya, Terbitkan Tagihan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog Konfigurasi Tarif IPL ── */}
      <Dialog open={configModalOpen} onOpenChange={setConfigModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-slate-200">
          <form onSubmit={handleSaveConfig}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Settings2 size={20} className="text-blue-600" />
                Kelola Tarif Nominal IPL
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Ubah nominal tagihan IPL yang akan berlaku pada penerbitan tagihan mendatang. Tagihan lama yang sudah terbit tidak akan terpengaruh.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nominal Baru (Rupiah) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    required
                    min={1000}
                    step={1000}
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full h-10 pl-11 pr-3.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mulai Berlaku Tanggal <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-300 font-medium text-slate-800 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Catatan / Alasan Perubahan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Penyesuaian biaya operasional kebersihan 2026"
                  value={configNote}
                  onChange={(e) => setConfigNote(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-300 font-medium text-slate-800 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Riwayat Tarif */}
              {configs.length > 0 && (
                <div className="pt-2">
                  <p className="font-bold text-slate-600 mb-2">Riwayat Perubahan Tarif:</p>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {configs.map((c) => (
                      <div
                        key={c.id}
                        className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70 flex justify-between items-center text-[11px]"
                      >
                        <div>
                          <p className="font-bold text-slate-800">
                            Rp {c.amount.toLocaleString("id-ID")}
                          </p>
                          <p className="text-slate-400">
                            {c.note || "Tanpa catatan"} · Oleh {c.createdBy?.name || "Admin"}
                          </p>
                        </div>
                        <span className="text-slate-500 font-semibold">
                          {format(new Date(c.effectiveFrom), "dd MMM yyyy", { locale: idLocale })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfigModalOpen(false)}
                disabled={isSavingConfig}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSavingConfig}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                {isSavingConfig ? (
                  <>
                    <Loader2 size={14} className="animate-spin mr-1.5" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Tarif Baru"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog Tandai Lunas Manual ── */}
      <Dialog open={markPaidModalOpen} onOpenChange={setMarkPaidModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-emerald-700 flex items-center gap-2">
              <FileCheck size={20} />
              Konfirmasi Pelunasan Manual
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Tandai tagihan IPL unit ini sebagai lunas untuk pembayaran tunai atau transfer langsung ke rekening RT.
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-3.5 py-2 text-xs">
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Unit Hunian:</span>
                  <span className="font-bold text-slate-800">
                    Unit {selectedPayment.household.unitNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Periode:</span>
                  <span className="font-bold text-slate-800">
                    {monthNames[selectedPayment.month]} {selectedPayment.year}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Nominal Tagihan:</span>
                  <span className="font-extrabold text-blue-700">
                    Rp {selectedPayment.amount.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Metode Pembayaran <span className="text-red-500">*</span>
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-300 font-semibold text-slate-800 text-xs focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="TUNAI">TUNAI (Diterima Tunai)</option>
                  <option value="TRANSFER">TRANSFER BANK (Bukti Diterima)</option>
                  <option value="QRIS">QRIS</option>
                  <option value="LAINNYA">LAINNYA</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Catatan Admin (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Diterima oleh Satpam Pos Utama"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-300 font-medium text-slate-800 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setMarkPaidModalOpen(false)}
              disabled={isSubmittingPay}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleMarkPaid}
              disabled={isSubmittingPay}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {isSubmittingPay ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-1.5" />
                  Menyimpan...
                </>
              ) : (
                "Konfirmasi Lunas"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
