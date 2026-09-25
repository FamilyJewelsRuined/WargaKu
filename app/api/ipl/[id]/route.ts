import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { action } = await req.json();

  if (action !== "pay") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const payment = await prisma.iplPayment.findUnique({ where: { id } });
  if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (payment.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (payment.status === "PAID") {
    return NextResponse.json({ error: "Already paid" }, { status: 400 });
  }

  // Generate mock receipt number
  const receiptNumber = `WK-${payment.year}-${String(payment.month).padStart(2, "0")}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

  const updated = await prisma.iplPayment.update({
    where: { id },
    data: {
      status: "PAID",
      paymentDate: new Date(),
      receiptNumber,
      method: "MOCK_TRANSFER",
    },
  });

  return NextResponse.json({ success: true, payment: updated });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const payment = await prisma.iplPayment.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      amount: true,
      month: true,
      year: true,
      paymentDate: true,
      receiptNumber: true,
      method: true,
    },
  });

  if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(payment);
}

