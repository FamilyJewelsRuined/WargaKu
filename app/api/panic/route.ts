import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { broadcastPushNotification } from "@/lib/push";
import { sendTelegramEmergencyAlert } from "@/lib/telegram";

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Guard anti-duplikat: ketukan ganda dalam 2 menit tidak membuat alert baru
  // dan tidak menyiarkan ulang ke semua warga.
  const DUPLICATE_WINDOW_MS = 2 * 60 * 1000;
  const recent = await prisma.panicAlert.findFirst({
    where: {
      userId: session.user.id,
      isResolved: false,
      triggeredAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
    },
    orderBy: { triggeredAt: "desc" },
    select: { id: true },
  });
  if (recent) {
    return NextResponse.json({ success: true, alertId: recent.id, duplicate: true });
  }

  // Simpan panic alert
  const alert = await prisma.panicAlert.create({
    data: { userId: session.user.id },
  });

  // Ambil semua push subscriptions (kecuali yang mengirim)
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: { not: session.user.id } },
  });

  // Broadcast ke kedua channel secara paralel tanpa saling memblokir
  await Promise.allSettled([
    // Channel 1: Web Push ke PWA
    (async () => {
      if (subscriptions.length > 0) {
        const { expired } = await broadcastPushNotification(subscriptions, {
          title: "🚨 BANTUAN DARURAT!",
          body: `PERLU BANTUAN! ${session.user.name} membutuhkan bantuan sekarang! Ketuk untuk lihat lokasi.`,
          icon: "/icons/icon-panic.png",
          badge: "/icons/badge-panic.png",
          image: "/icons/panic-banner.jpg",
          tag: "panic-alert",
          url: "/dashboard/panic",
        });

        // Hapus subscription yang expired
        if (expired.length > 0) {
          await prisma.pushSubscription.deleteMany({
            where: { id: { in: expired } },
          });
        }
      }
    })(),

    // Channel 2: Telegram Supergroup Fallback
    sendTelegramEmergencyAlert({
      callerName: session.user.name,
      address: session.user.address,
      alertUrl: "/dashboard/panic",
    }),
  ]);

  return NextResponse.json({ success: true, alertId: alert.id });
}
