import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { broadcastPushNotification } from "@/lib/push";

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Simpan panic alert
  const alert = await prisma.panicAlert.create({
    data: { userId: session.user.id },
  });

  // Ambil semua push subscriptions (kecuali yang mengirim)
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: { not: session.user.id } },
  });

  // Broadcast push notification ke semua warga
  if (subscriptions.length > 0) {
    const { expired } = await broadcastPushNotification(subscriptions, {
      title: "🚨 ALERT DARURAT — WargaKu",
      body: `${session.user.name} membutuhkan bantuan di ${session.user.address ?? "lokasi tidak diketahui"}`,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: "panic-alert",
      url: "/dashboard/panic",
    });

    // Hapus subscripsi yang expired
    if (expired.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: { id: { in: expired } },
      });
    }
  }

  return NextResponse.json({ success: true, alertId: alert.id });
}
