import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const payment = await prisma.iplPayment.findUnique({ where: { id } });

    if (!payment) {
      return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 });
    }

    // Validasi akses: cek apakah user berada di unit yang sama dengan tagihan (atau ADMIN)
    if (session.user.role !== "ADMIN") {
      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { householdId: true },
      });
      if (!currentUser?.householdId || currentUser.householdId !== payment.householdId) {
        return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
      }
    }

    if (payment.status === "PAID") {
      return NextResponse.json({ error: "Tagihan ini sudah lunas" }, { status: 400 });
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      return NextResponse.json(
        { error: "Kredensial Midtrans (MIDTRANS_SERVER_KEY) belum disetel di server .env" },
        { status: 500 }
      );
    }

    const isProd = process.env.MIDTRANS_IS_PRODUCTION === "true";
    const baseUrl = isProd
      ? "https://api.midtrans.com"
      : "https://api.sandbox.midtrans.com";

    const authHeader = `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`;
    const orderId = `IPL-${payment.id}-${Date.now()}`;

    // Panggil Midtrans Core API (Charge QRIS)
    const midtransRes = await fetch(`${baseUrl}/v2/charge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        payment_type: "qris",
        transaction_details: {
          order_id: orderId,
          gross_amount: payment.amount,
        },
        qris: {
          acquirer: "gopay",
        },
      }),
    });

    const data = await midtransRes.json();

    if (!midtransRes.ok || data.status_code !== "201") {
      const errorMessage =
        data.status_message || data.message || "Gagal membuat transaksi QRIS di Midtrans";
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Hitung tanggal kedaluwarsa (Midtrans WIB +07:00, default 15 menit)
    let expiresAtDate = new Date(Date.now() + 15 * 60 * 1000);
    if (data.expiry_time) {
      const parsed = new Date(data.expiry_time.replace(" ", "T") + "+07:00");
      if (!isNaN(parsed.getTime())) {
        expiresAtDate = parsed;
      }
    }

    return NextResponse.json({
      qrString: data.qr_string,
      expiresAt: expiresAtDate.toISOString(),
      amount: payment.amount,
      transactionId: data.transaction_id,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan internal server";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
