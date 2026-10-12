interface TelegramAlertParams {
  callerName: string;
  address?: string | null;
  alertUrl?: string;
}

export async function sendTelegramEmergencyAlert({
  callerName,
  address,
  alertUrl = "/dashboard/panic",
}: TelegramAlertParams) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ALERT_CHAT_ID;

  // Lewati jika environment variable belum dikonfigurasi
  if (!token || !chatId) {
    console.warn("[Telegram] Token atau Chat ID belum dikonfigurasi di .env");
    return { success: false, error: "Credentials not configured" };
  }

  const siteUrl = process.env.NEXTAUTH_URL || "https://wargaku.app";
  const fullAlertUrl = `${siteUrl.replace(/\/$/, "")}${alertUrl}`;

  const now = new Date();
  const timeFormatted = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(now);

  const messageText = [
    `🚨 <b>PERINGATAN DARURAT WARGA!</b> 🚨`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `⚠️ <b>PERLU BANTUAN SEGERA!</b>`,
    ``,
    `👤 <b>Nama:</b> ${escapeHtml(callerName)}`,
    `📍 <b>Lokasi:</b> ${escapeHtml(address || "Lokasi tidak diketahui")}`,
    `⏰ <b>Waktu:</b> ${timeFormatted} WIB`,
    ``,
    `<i>Tetangga terdekat & petugas satpam harap segera mengecek lokasi atau berkoordinasi langsung di thread ini.</i>`,
    `━━━━━━━━━━━━━━━━━━━━`,
  ].join("\n");

  const payload = {
    chat_id: chatId,
    text: messageText,
    parse_mode: "HTML",
    disable_web_page_preview: false,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "📍 Buka Lokasi di WargaKu",
            url: fullAlertUrl,
          },
        ],
      ],
    },
  };

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!data.ok) {
      console.error("[Telegram] API error:", data);
      return { success: false, error: data.description };
    }

    // Auto-pin pesan agar selalu di posisi atas obrolan warga
    if (data.result?.message_id) {
      try {
        await fetch(`https://api.telegram.org/bot${token}/pinChatMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            message_id: data.result.message_id,
            disable_notification: false, // Bunyikan notifikasi pin untuk semua warga
          }),
        });
      } catch (pinErr) {
        console.warn("[Telegram] Gagal pin pesan:", pinErr);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("[Telegram] Network error:", error);
    return { success: false, error };
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
