import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
    } = body;

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      return NextResponse.json({ error: "Server key not configured" }, { status: 500 });
    }

    // 1. Verifikasi Signature Key Midtrans (SHA-512)
    const expectedSignature = crypto
      .createHash("sha512")
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest("hex");

    if (signature_key !== expectedSignature) {
      return NextResponse.json({ error: "Invalid signature key" }, { status: 403 });
    }

    // 2. Periksa apakah pembayaran sukses
    const isSuccess =
      transaction_status === "settlement" ||
      (transaction_status === "capture" && fraud_status === "accept");

    if (isSuccess && order_id) {
      let targetPaymentId: string | null = null;

      if (order_id.startsWith("IPL-")) {
        const parts = order_id.split("-");
        if (parts.length >= 2) {
          targetPaymentId = parts[1];
        }
      }

      if (targetPaymentId) {
        const payment = await prisma.iplPayment.findUnique({
          where: { id: targetPaymentId },
        });

        if (payment && payment.status !== "PAID") {
          const receiptNumber = `WK-${payment.year}-${String(payment.month).padStart(2, "0")}-${String(
            Math.floor(Math.random() * 9000) + 1000
          )}`;

          await prisma.iplPayment.update({
            where: { id: payment.id },
            data: {
              status: "PAID",
              paymentDate: new Date(),
              receiptNumber,
              method: "QRIS_MIDTRANS",
            },
          });
        }
      }
    }

    return NextResponse.json({ status: "OK" }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Midtrans webhook handler failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
