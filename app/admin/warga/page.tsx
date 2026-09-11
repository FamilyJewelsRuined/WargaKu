import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Users, Home, Phone, Shield, Truck, User } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

const roleConfig = {
  ADMIN: { label: "Admin / RT", icon: Shield, class: "text-yellow-400 bg-yellow-950 border-yellow-800/50" },
  PETUGAS_SAMPAH: { label: "Petugas Sampah", icon: Truck, class: "text-blue-400 bg-blue-950 border-blue-800/50" },
  WARGA: { label: "Warga", icon: User, class: "text-green-400 bg-green-950 border-green-800/50" },
};

export default async function AdminWargaPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          iplPayments: { where: { status: { not: "PAID" } } },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Users className="w-5 h-5 text-primary" />
          <span className="text-sm text-muted-foreground">Admin · Manajemen</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Daftar Warga</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {users.filter((u) => u.role === "WARGA").length} warga terdaftar
        </p>
      </div>

      {/* Table */}
      <div className="surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 font-semibold text-muted-foreground">Nama</th>
                <th className="text-left p-4 font-semibold text-muted-foreground hidden md:table-cell">No. Rumah</th>
                <th className="text-left p-4 font-semibold text-muted-foreground hidden lg:table-cell">No. HP</th>
                <th className="text-left p-4 font-semibold text-muted-foreground">Role</th>
                <th className="text-left p-4 font-semibold text-muted-foreground">IPL Belum Bayar</th>
                <th className="text-left p-4 font-semibold text-muted-foreground hidden md:table-cell">Bergabung</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => {
                const role = roleConfig[user.role as keyof typeof roleConfig] ?? roleConfig.WARGA;
                const RoleIcon = role.icon;
                const unpaidCount = user._count.iplPayments;

                return (
                  <tr key={user.id} className="hover:bg-white/2 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className="text-foreground font-medium">
                        {user.houseNumber ?? "—"}
                      </span>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" />
                        {user.phone ?? "—"}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${role.class}`}>
                        <RoleIcon className="w-3 h-3" />
                        {role.label}
                      </span>
                    </td>
                    <td className="p-4">
                      {user.role === "WARGA" ? (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${unpaidCount > 0 ? "status-overdue" : "status-paid"}`}>
                          {unpaidCount > 0 ? `${unpaidCount} belum bayar` : "Lunas semua"}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="p-4 hidden md:table-cell text-xs text-muted-foreground">
                      {format(new Date(user.createdAt), "dd MMM yyyy", { locale: idLocale })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
