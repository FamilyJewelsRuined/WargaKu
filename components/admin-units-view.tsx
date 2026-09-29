"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  Plus,
  Search,
  Users,
  Edit2,
  Power,
  PowerOff,
  CheckCircle2,
  XCircle,
  Loader2,
  MapPin,
  Home,
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

export interface UnitMember {
  id: string;
  name: string;
  role: string;
}

export interface UnitWithMembers {
  id: string;
  unitNumber: string;
  address: string | null;
  isActive: boolean;
  createdAt: Date | string;
  _count: {
    members: number;
    payments: number;
  };
  members: UnitMember[];
}

interface AdminUnitsViewProps {
  initialUnits: UnitWithMembers[];
}

export function AdminUnitsView({ initialUnits }: AdminUnitsViewProps) {
  const router = useRouter();
  const [units, setUnits] = useState<UnitWithMembers[]>(initialUnits);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Modal Create / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitWithMembers | null>(null);
  const [unitNumber, setUnitNumber] = useState("");
  const [address, setAddress] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered list
  const filteredUnits = units.filter((u) => {
    const matchSearch =
      u.unitNumber.toLowerCase().includes(search.toLowerCase()) ||
      (u.address && u.address.toLowerCase().includes(search.toLowerCase())) ||
      u.members.some((m) => m.name.toLowerCase().includes(search.toLowerCase()));

    if (!matchSearch) return false;
    if (filterActive === "ACTIVE") return u.isActive;
    if (filterActive === "INACTIVE") return !u.isActive;
    return true;
  });

  const totalMembers = units.reduce((acc, u) => acc + u._count.members, 0);
  const activeUnitsCount = units.filter((u) => u.isActive).length;

  const openCreateModal = () => {
    setEditingUnit(null);
    setUnitNumber("");
    setAddress("");
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (unit: UnitWithMembers) => {
    setEditingUnit(unit);
    setUnitNumber(unit.unitNumber);
    setAddress(unit.address || "");
    setIsActive(unit.isActive);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitNumber.trim()) {
      toast.error("Nomor unit wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUnit) {
        // Edit existing
        const res = await fetch(`/api/admin/units/${editingUnit.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update",
            unitNumber: unitNumber.trim(),
            address: address.trim() || undefined,
            isActive,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal memperbarui unit");

        toast.success(`Unit ${data.unit.unitNumber} berhasil diperbarui`);
        setUnits((prev) =>
          prev.map((u) => (u.id === editingUnit.id ? { ...u, ...data.unit } : u))
        );
      } else {
        // Create new
        const res = await fetch("/api/admin/units", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            unitNumber: unitNumber.trim(),
            address: address.trim() || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal membuat unit");

        toast.success(`Unit ${data.unit.unitNumber} berhasil ditambahkan`);
        setUnits((prev) => [
          ...prev,
          {
            ...data.unit,
            _count: { members: 0, payments: 0 },
            members: [],
          },
        ]);
      }

      setModalOpen(false);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (unit: UnitWithMembers) => {
    try {
      const res = await fetch(`/api/admin/units/${unit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle-status" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengubah status unit");

      toast.success(data.message);
      setUnits((prev) =>
        prev.map((u) => (u.id === unit.id ? { ...u, isActive: data.unit.isActive } : u))
      );
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Manajemen Wilayah
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Unit Hunian
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelola kavling rumah, tetapkan penghuni, dan atur penagihan IPL per unit.
          </p>
        </div>

        <Button
          id="btn-tambah-unit"
          type="button"
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 shadow-xs"
        >
          <Plus size={16} />
          Tambah Unit
        </Button>
      </div>

      {/* ── Stats Summary ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Building2 size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Total Unit</p>
            <p className="text-2xl font-black text-slate-900 leading-tight">
              {units.length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Unit Aktif (Dihuni)</p>
            <p className="text-2xl font-black text-slate-900 leading-tight">
              {activeUnitsCount}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Total Warga Ditetapkan</p>
            <p className="text-2xl font-black text-slate-900 leading-tight">
              {totalMembers}
            </p>
          </div>
        </div>
      </div>

      {/* ── Filters & Search ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nomor unit, alamat, penghuni..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilterActive("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterActive === "ALL"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Semua ({units.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterActive("ACTIVE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterActive === "ACTIVE"
                ? "bg-emerald-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Aktif ({activeUnitsCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterActive("INACTIVE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterActive === "INACTIVE"
                ? "bg-slate-500 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Nonaktif ({units.length - activeUnitsCount})
          </button>
        </div>
      </div>

      {/* ── Units Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-5">Nomor Unit</th>
                <th className="py-3.5 px-4">Keterangan / Alamat</th>
                <th className="py-3.5 px-4">Penghuni Terdaftar</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400 text-xs">
                    Tidak ada data unit hunian yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredUnits.map((unit) => (
                  <tr key={unit.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Nomor Unit */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm border border-blue-100 flex-shrink-0">
                          {unit.unitNumber}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">
                            Unit {unit.unitNumber}
                          </p>
                          <p className="text-xs text-slate-400">
                            {unit._count.payments} riwayat tagihan
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Alamat */}
                    <td className="py-4 px-4">
                      {unit.address ? (
                        <div className="flex items-start gap-1.5 text-slate-700 text-xs font-medium">
                          <MapPin size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
                          <span>{unit.address}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Tanpa alamat deskriptif</span>
                      )}
                    </td>

                    {/* Penghuni */}
                    <td className="py-4 px-4">
                      {unit.members.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 max-w-sm">
                          {unit.members.map((m) => (
                            <span
                              key={m.id}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              {m.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200">
                          Belum berpenghuni
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          unit.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {unit.isActive ? (
                          <>
                            <CheckCircle2 size={12} /> Aktif
                          </>
                        ) : (
                          <>
                            <XCircle size={12} /> Nonaktif
                          </>
                        )}
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(unit)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit Unit"
                        >
                          <Edit2 size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(unit)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            unit.isActive
                              ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title={unit.isActive ? "Nonaktifkan Unit" : "Aktifkan Unit"}
                        >
                          {unit.isActive ? <PowerOff size={15} /> : <Power size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal Tambah / Edit Unit ── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-slate-200">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Home size={20} className="text-blue-600" />
                {editingUnit ? "Edit Unit Hunian" : "Tambah Unit Hunian Baru"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {editingUnit
                  ? `Ubah informasi atau nomor identitas unit ${editingUnit.unitNumber}.`
                  : "Daftarkan nomor unit hunian baru ke dalam sistem WargaKu."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nomor Unit <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 02-01, A-01, atau Blok B-12"
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Format unik penanda rumah, contoh: &quot;JalurNoRmh&quot; seperti &quot;02-01&quot;.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Keterangan Alamat / Jalur (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Jalur 2 No. 1, Blok A"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              {editingUnit && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Status Keaktifan Unit</p>
                    <p className="text-[11px] text-slate-500">
                      Unit nonaktif tidak akan dimasukkan ke tagihan IPL bulanan.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin mr-1.5" />
                    Menyimpan...
                  </>
                ) : editingUnit ? (
                  "Simpan Perubahan"
                ) : (
                  "Tambah Unit"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
