import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { action, method, note } = body;

    if (action !== "mark-paid") {
      return NextResponse.json({ error: "Action tidak valid" }, { status: 400 });
    }

    const payment = await prisma.iplPayment.findUnique({
      where: { id },
      include: { household: { select: { unitNumber: true } } },
    });

    if (!payment) {
      return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 });
    }

    if (payment.status === "PAID") {
      return NextResponse.json(
        { error: "Tagihan ini sudah berstatus lunas" },
        { status: 400 }
      );
    }

    const receiptNumber = `WK-ADM-${payment.year}-${String(payment.month).padStart(2, "0")}-${String(
      Math.floor(Math.random() * 9000) + 1000
    )}`;

    const updated = await prisma.iplPayment.update({
      where: { id },
      data: {
        status: "PAID",
        paymentDate: new Date(),
        receiptNumber,
        method: method || "TUNAI",
        note: note ? `[Admin: ${session.user.name}] ${note}` : `[Ditandai Lunas oleh Admin: ${session.user.name}]`,
        paidByUserId: session.user.id,
      },
      include: {
        household: { select: { unitNumber: true, address: true } },
        paidBy: { select: { name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Tagihan Unit ${payment.household.unitNumber} (${payment.month}/${payment.year}) berhasil ditandai Lunas.`,
      payment: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan server";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
