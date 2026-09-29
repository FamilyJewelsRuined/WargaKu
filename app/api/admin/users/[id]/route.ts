import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/push";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: userId } = await params;

  try {
    const body = await req.json();
    const { action, householdId } = body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { pushSubscriptions: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    if (action === "approve") {
      if (!householdId) {
        return NextResponse.json(
          { error: "Unit hunian wajib dipilih untuk menyetujui pendaftaran" },
          { status: 400 }
        );
      }

      // Pastikan unit hunian ada
      const unit = await prisma.householdUnit.findUnique({
        where: { id: householdId },
      });

      if (!unit) {
        return NextResponse.json(
          { error: "Unit hunian tidak ditemukan" },
          { status: 404 }
        );
      }

      // Update user menjadi ACTIVE dan assign ke unit
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          status: "ACTIVE",
          householdId,
        },
      });

      // Periksa apakah unit ini sudah memiliki tagihan IPL bulan berjalan
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const existingBill = await prisma.iplPayment.findUnique({
        where: {
          householdId_month_year: {
            householdId,
            month: currentMonth,
            year: currentYear,
          },
        },
      });

      // Jika belum ada tagihan bulan ini untuk unit ini, generate otomatis
      if (!existingBill) {
        const latestConfig = await prisma.iplConfig.findFirst({
          orderBy: { effectiveFrom: "desc" },
        });

        const amount = latestConfig?.amount ?? 50000;
        const dueDate = new Date(currentYear, currentMonth - 1, 10);

        await prisma.iplPayment.create({
          data: {
            householdId,
            amount,
            month: currentMonth,
            year: currentYear,
            status: "UNPAID",
            dueDate,
          },
        });
      }

      // Kirim web push notification jika warga sudah mengaktifkan subscription
      if (user.pushSubscriptions && user.pushSubscriptions.length > 0) {
        for (const sub of user.pushSubscriptions) {
          sendPushNotification(
            {
              endpoint: sub.endpoint,
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
            {
              title: "Pendaftaran Disetujui! 🎉",
              body: `Selamat datang di WargaKu! Anda telah ditetapkan pada Unit ${unit.unitNumber}.`,
              url: "/dashboard",
            }
          ).catch(() => {});
        }
      }

      return NextResponse.json({
        success: true,
        message: `Pendaftaran ${user.name} berhasil disetujui untuk Unit ${unit.unitNumber}`,
        user: updatedUser,
      });
    }

    if (action === "reject") {
      // Hapus user pending yang ditolak dari database
      await prisma.user.delete({
        where: { id: userId },
      });

      return NextResponse.json({
        success: true,
        message: `Pendaftaran ${user.name} telah ditolak dan dihapus.`,
      });
    }

    if (action === "assign-unit") {
      if (!householdId) {
        return NextResponse.json(
          { error: "Unit hunian wajib dipilih" },
          { status: 400 }
        );
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { householdId },
      });

      return NextResponse.json({
        success: true,
        message: `Unit hunian untuk ${user.name} berhasil diperbarui.`,
        user: updatedUser,
      });
    }

    return NextResponse.json({ error: "Aksi tidak valid" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan server";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
