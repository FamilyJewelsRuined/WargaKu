"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Landmark,
  Plus,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Shield,
  Loader2,
  Info,
  Power,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export interface PaymentAccountItem {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  label: string | null;
  isActive: boolean;
  order: number;
  createdAt: string | Date;
  createdBy: {
    name: string;
    email: string;
  };
}

interface AdminRekeningViewProps {
  initialAccounts: PaymentAccountItem[];
}

export function AdminRekeningView({ initialAccounts }: AdminRekeningViewProps) {
  const router = useRouter();
  const [accounts, setAccounts] = useState<PaymentAccountItem[]>(initialAccounts);
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [label, setLabel] = useState("");
  const [order, setOrder] = useState("0");
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanBank = bankName.trim();
    const cleanNumber = accountNumber.trim().replace(/\s+/g, "");
    const cleanHolder = accountHolder.trim();

    if (!cleanBank || !cleanNumber || !cleanHolder) {
      toast.error("Mohon lengkapi nama bank, nomor rekening, dan atas nama");
      return;
    }

    if (!/^\d+$/.test(cleanNumber)) {
      toast.error("Nomor rekening hanya boleh berupa angka");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/payment-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: cleanBank,
          accountNumber: cleanNumber,
          accountHolder: cleanHolder,
          label: label.trim() || null,
          order: parseInt(order, 10) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menambahkan rekening");
      }

      toast.success(data.message || "Rekening resmi berhasil ditambahkan!");
      setAccounts((prev) => [data.account, ...prev]);
      setBankName("");
      setAccountNumber("");
      setAccountHolder("");
      setLabel("");
      setOrder("0");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (acc: PaymentAccountItem) => {
    const nextState = !acc.isActive;
    setTogglingId(acc.id);
    try {
      const res = await fetch(`/api/admin/payment-accounts/${acc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextState }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengubah status rekening");
      }

      setAccounts((prev) =>
        prev.map((item) =>
          item.id === acc.id ? { ...item, isActive: nextState } : item
        )
      );
      toast.success(
        nextState
          ? `Rekening ${acc.bankName} diaktifkan untuk pembayaran warga`
          : `Rekening ${acc.bankName} dinonaktifkan`
      );
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal mengubah status";
      toast.error(msg);
    } finally {
      setTogglingId(null);
    }
  };

  const copyNumber = (acc: PaymentAccountItem) => {
    navigator.clipboard.writeText(acc.accountNumber);
    setCopiedId(acc.id);
    toast.success(`Nomor rekening ${acc.bankName} disalin!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatAccNum = (num: string) => {
    return num.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Landmark className="w-5 h-5 text-amber-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Admin · Keuangan RT
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Rekening Resmi Pembayaran IPL
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola nomor rekening resmi RT yang ditampilkan pada halaman IPL warga.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
          <Shield className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>Nomor rekening tidak dapat diedit setelah dibuat (audit trail).</span>
        </div>
      </div>

      {/* Grid: Form Tambah + Daftar Rekening */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Kolom Kiri: Form Tambah Rekening Baru */}
        <div className="lg:col-span-1 bg-white border border-[#e8eef6] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Tambah Rekening Baru</h2>
              <p className="text-xs text-slate-400">Pastikan nomor dan nama sudah benar</p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-3.5">
            <div>
              <label htmlFor="input-bank-name" className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Bank <span className="text-red-500">*</span>
              </label>
              <input
                id="input-bank-name"
                type="text"
                required
                placeholder="cth: BCA, Mandiri, BRI, BNI"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="input-account-num" className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Rekening <span className="text-red-500">*</span>
              </label>
              <input
                id="input-account-num"
                type="text"
                required
                inputMode="numeric"
                placeholder="cth: 8271081234567890 (angka saja)"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="input-holder-name" className="block text-xs font-semibold text-slate-700 mb-1">
                Atas Nama (Pemilik Rekening) <span className="text-red-500">*</span>
              </label>
              <input
                id="input-holder-name"
                type="text"
                required
                placeholder="cth: KAS RT 03 KOMPLEK"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="input-label" className="block text-xs font-semibold text-slate-700 mb-1">
                Label Keterangan <span className="text-slate-400 font-normal">(opsional)</span>
              </label>
              <input
                id="input-label"
                type="text"
                placeholder="cth: Rekening Utama IPL Warga"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="input-order" className="block text-xs font-semibold text-slate-700 mb-1">
                Urutan Tampil <span className="text-slate-400 font-normal">(0 = paling atas)</span>
              </label>
              <input
                id="input-order"
                type="number"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Simpan Rekening</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Kolom Kanan: Daftar Rekening Aktif & Nonaktif */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Daftar Rekening ({accounts.length})
            </h2>
            <span className="text-xs text-slate-400">
              {accounts.filter((a) => a.isActive).length} aktif ditampilkan ke warga
            </span>
          </div>

          {accounts.length === 0 ? (
            <div className="bg-white border border-[#e8eef6] rounded-2xl p-10 text-center text-slate-400 space-y-2">
              <Landmark className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-600">Belum ada nomor rekening terdaftar</p>
              <p className="text-xs">
                Tambahkan rekening resmi di formulir sebelah kiri agar warga dapat menyalin nomor transfer.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className={`bg-white border rounded-2xl p-4 transition-all shadow-xs ${
                    acc.isActive ? "border-[#e8eef6]" : "border-slate-200 bg-slate-50/70 opacity-75"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          acc.isActive
                            ? "bg-blue-50 text-blue-600 border border-blue-100"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        <Landmark className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-extrabold text-sm text-slate-900">
                            {acc.bankName}
                          </span>
                          {acc.label && (
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              {acc.label}
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              acc.isActive
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {acc.isActive ? "Aktif" : "Nonaktif"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-mono text-slate-800 font-semibold mb-1">
                          <span>{formatAccNum(acc.accountNumber)}</span>
                          <button
                            type="button"
                            onClick={() => copyNumber(acc)}
                            className="p-1 rounded-md text-slate-400 hover:text-blue-600 transition-colors"
                            title="Salin nomor rekening"
                          >
                            {copiedId === acc.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <p className="text-xs text-slate-500">
                          a.n. <strong className="text-slate-700">{acc.accountHolder}</strong>
                        </p>

                        <p className="text-[11px] text-slate-400 mt-2">
                          Dibuat oleh {acc.createdBy.name} ·{" "}
                          {format(new Date(acc.createdAt), "dd MMM yyyy, HH:mm", {
                            locale: idLocale,
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Toggle Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(acc)}
                      disabled={togglingId === acc.id}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        acc.isActive
                          ? "bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      {togglingId === acc.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Power className="w-3.5 h-3.5" />
                      )}
                      <span>{acc.isActive ? "Nonaktifkan" : "Aktifkan"}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
