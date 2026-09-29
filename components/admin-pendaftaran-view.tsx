"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  UserCheck,
  UserX,
  Clock,
  Home,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  Plus,
  Loader2,
  Building2,
  AlertCircle,
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

interface PendingUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  createdAt: Date | string;
}

interface UnitItem {
  id: string;
  unitNumber: string;
  address: string | null;
  _count: {
    members: number;
  };
}

interface AdminPendaftaranViewProps {
  initialUsers: PendingUser[];
  units: UnitItem[];
}

export function AdminPendaftaranView({
  initialUsers,
  units: initialUnits,
}: AdminPendaftaranViewProps) {
  const router = useRouter();
  const [users, setUsers] = useState<PendingUser[]>(initialUsers);
  const [units, setUnits] = useState<UnitItem[]>(initialUnits);

  // Modal Approve states
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [isCreatingNewUnit, setIsCreatingNewUnit] = useState(false);
  const [newUnitNumber, setNewUnitNumber] = useState("");
  const [newUnitAddress, setNewUnitAddress] = useState("");
  const [isSubmittingApprove, setIsSubmittingApprove] = useState(false);

  // Modal Reject states
  const [rejectUser, setRejectUser] = useState<PendingUser | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  const openApproveModal = (user: PendingUser) => {
    setSelectedUser(user);
    setSelectedUnitId(units[0]?.id || "NEW");
    setIsCreatingNewUnit(units.length === 0);
    setNewUnitNumber("");
    setNewUnitAddress(user.address || "");
    setApproveModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedUser) return;

    let targetUnitId = selectedUnitId;

    setIsSubmittingApprove(true);
    try {
      // Jika admin memilih untuk membuat unit baru langsung
      if (isCreatingNewUnit) {
        if (!newUnitNumber.trim()) {
          toast.error("Nomor unit baru wajib diisi");
          setIsSubmittingApprove(false);
          return;
        }

        const createRes = await fetch("/api/admin/units", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            unitNumber: newUnitNumber.trim(),
            address: newUnitAddress.trim() || undefined,
          }),
        });

        const createData = await createRes.json();
        if (!createRes.ok) {
          throw new Error(createData.error || "Gagal membuat unit hunian baru");
        }

        targetUnitId = createData.unit.id;

        // Update list units lokal
        setUnits((prev) => [
          ...prev,
          {
            id: createData.unit.id,
            unitNumber: createData.unit.unitNumber,
            address: createData.unit.address,
            _count: { members: 0 },
          },
        ]);
      }

      if (!targetUnitId) {
        toast.error("Pilih unit hunian untuk warga ini");
        setIsSubmittingApprove(false);
        return;
      }

      // Approve user dan assign ke unit
      const approveRes = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          householdId: targetUnitId,
        }),
      });

      const approveData = await approveRes.json();
      if (!approveRes.ok) {
        throw new Error(approveData.error || "Gagal menyetujui pendaftaran");
      }

      toast.success(approveData.message || "Pendaftaran warga berhasil disetujui! 🎉");
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
      setApproveModalOpen(false);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(msg);
    } finally {
      setIsSubmittingApprove(false);
    }
  };

  const handleReject = async () => {
    if (!rejectUser) return;

    setIsSubmittingReject(true);
    try {
      const res = await fetch(`/api/admin/users/${rejectUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menolak pendaftaran");
      }

      toast.success("Pendaftaran telah ditolak dan data dihapus.");
      setUsers((prev) => prev.filter((u) => u.id !== rejectUser.id));
      setRejectModalOpen(false);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(msg);
    } finally {
      setIsSubmittingReject(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
              <Clock size={12} className="animate-spin text-amber-600" />
              Menunggu Verifikasi
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Pendaftaran Warga Baru
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Tinjau data pendaftar dan tentukan nomor unit hunian untuk mengaktifkan akun.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-2.5">
            <span className="text-2xl font-black text-amber-600 leading-none">
              {users.length}
            </span>
            <span className="text-xs font-semibold text-slate-500 leading-tight">
              Permohonan<br />Tertunda
            </span>
          </div>
        </div>
      </div>

      {/* Main Table / Empty State */}
      {users.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-inner">
            <CheckCircle size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            Semua Pendaftaran Bersih!
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Tidak ada permohonan pendaftaran warga yang menunggu verifikasi saat ini. Warga yang mendaftar melalui portal publik akan muncul di sini.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Calon Warga</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Kontak</th>
                  <th className="py-3.5 px-4">Alamat Diajukan</th>
                  <th className="py-3.5 px-4 hidden lg:table-cell">Waktu Daftar</th>
                  <th className="py-3.5 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Nama */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base flex-shrink-0 border border-blue-200">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">
                            {user.name}
                          </p>
                          <p className="text-xs text-slate-500 md:hidden mt-0.5">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Kontak */}
                    <td className="py-4 px-4 hidden md:table-cell">
                      <div className="flex flex-col gap-1 text-xs">
                        <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Mail size={13} className="text-slate-400" />
                          {user.email}
                        </span>
                        {user.phone ? (
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <Phone size={13} className="text-slate-400" />
                            {user.phone}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Tanpa No. HP</span>
                        )}
                      </div>
                    </td>

                    {/* Alamat */}
                    <td className="py-4 px-4">
                      <div className="flex items-start gap-1.5 text-slate-700 max-w-xs">
                        <MapPin size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                        <span className="text-xs font-medium leading-relaxed">
                          {user.address || "—"}
                        </span>
                      </div>
                    </td>

                    {/* Waktu Daftar */}
                    <td className="py-4 px-4 hidden lg:table-cell text-xs text-slate-500">
                      {format(new Date(user.createdAt), "dd MMM yyyy, HH:mm", {
                        locale: idLocale,
                      })}
                    </td>

                    {/* Aksi */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setRejectUser(user);
                            setRejectModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all flex items-center gap-1"
                        >
                          <UserX size={14} />
                          <span className="hidden sm:inline">Tolak</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openApproveModal(user)}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs hover:shadow transition-all flex items-center gap-1.5"
                        >
                          <UserCheck size={14} />
                          <span>Setujui</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Dialog Setujui & Assign Unit ── */}
      <Dialog open={approveModalOpen} onOpenChange={setApproveModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserCheck size={20} className="text-blue-600" />
              Setujui & Tetapkan Unit
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Tetapkan nomor unit hunian resmi untuk calon warga{" "}
              <strong>{selectedUser?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            {/* Ringkasan calon warga */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/70 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Nama:</span>
                <span className="font-bold text-slate-800">{selectedUser?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Alamat Diajukan:</span>
                <span className="font-semibold text-slate-800 text-right max-w-[240px]">
                  {selectedUser?.address || "—"}
                </span>
              </div>
            </div>

            {/* Pilihan Mode Unit */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Pilih Unit Hunian:</span>
                <button
                  type="button"
                  onClick={() => setIsCreatingNewUnit(!isCreatingNewUnit)}
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                >
                  {isCreatingNewUnit ? (
                    "← Pilih dari unit yang ada"
                  ) : (
                    <>
                      <Plus size={12} /> Buat Unit Baru Langsung
                    </>
                  )}
                </button>
              </label>

              {!isCreatingNewUnit ? (
                <div className="relative">
                  <select
                    value={selectedUnitId}
                    onChange={(e) => setSelectedUnitId(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        Unit {u.unitNumber} {u.address ? `(${u.address})` : ""} — {u._count.members} penghuni
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-3 bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                    <Building2 size={14} className="text-blue-600" />
                    Tambah Unit Hunian Baru
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Nomor Unit <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 02-01 atau B-05"
                      value={newUnitNumber}
                      onChange={(e) => setNewUnitNumber(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs font-medium focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Keterangan Alamat / Blok (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Jalur 2 No. 1"
                      value={newUnitAddress}
                      onChange={(e) => setNewUnitAddress(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs font-medium focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Notice tagihan IPL */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex gap-2.5 items-start text-xs text-emerald-800 leading-relaxed">
              <CheckCircle size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>
                Saat disetujui, akun warga akan langsung <strong>AKTIF</strong>. Sistem juga akan otomatis memastikan tagihan IPL bulan ini telah terbit untuk unit bersangkutan.
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setApproveModalOpen(false)}
              disabled={isSubmittingApprove}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleApprove}
              disabled={isSubmittingApprove}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              {isSubmittingApprove ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-1.5" />
                  Menyetujui...
                </>
              ) : (
                "Setujui & Aktifkan Warga"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog Konfirmasi Tolak ── */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="sm:max-w-sm bg-white border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-rose-600 flex items-center gap-2">
              <AlertCircle size={20} />
              Tolak Pendaftaran?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed pt-1">
              Apakah Anda yakin ingin menolak permohonan pendaftaran dari{" "}
              <strong className="text-slate-800">{rejectUser?.name}</strong>? Data akun akan dihapus dari sistem.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectModalOpen(false)}
              disabled={isSubmittingReject}
            >
              Batalkan
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleReject}
              disabled={isSubmittingReject}
              className="font-bold"
            >
              {isSubmittingReject ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-1.5" />
                  Menolak...
                </>
              ) : (
                "Ya, Tolak & Hapus"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
