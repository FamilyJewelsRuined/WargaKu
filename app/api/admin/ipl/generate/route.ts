import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const targetMonth = searchParams.get("month") ? parseInt(searchParams.get("month")!) : now.getMonth() + 1;
  const targetYear = searchParams.get("year") ? parseInt(searchParams.get("year")!) : now.getFullYear();

  // Ambil nominal IPL aktif
  const latestConfig = await prisma.iplConfig.findFirst({
    orderBy: { effectiveFrom: "desc" },
  });
  const currentAmount = latestConfig?.amount ?? 50000;

  // Ambil semua unit aktif
  const activeUnits = await prisma.householdUnit.findMany({
    where: { isActive: true },
    select: { id: true, unitNumber: true },
    orderBy: { unitNumber: "asc" },
  });

  // Cek unit yang sudah punya tagihan di periode ini
  const existingPayments = await prisma.iplPayment.findMany({
    where: {
      month: targetMonth,
      year: targetYear,
      householdId: { in: activeUnits.map((u) => u.id) },
    },
    select: { householdId: true },
  });

  const billedHouseholdIds = new Set(existingPayments.map((p) => p.householdId));
  const unbilledUnits = activeUnits.filter((u) => !billedHouseholdIds.has(u.id));

  return NextResponse.json({
    month: targetMonth,
    year: targetYear,
    amount: currentAmount,
    totalActiveUnits: activeUnits.length,
    unbilledCount: unbilledUnits.length,
    unbilledUnitNumbers: unbilledUnits.map((u) => u.unitNumber),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const now = new Date();
    const month = typeof body.month === "number" ? body.month : now.getMonth() + 1;
    const year = typeof body.year === "number" ? body.year : now.getFullYear();

    // 1. Ambil tarif IPL terbaru
    const latestConfig = await prisma.iplConfig.findFirst({
      orderBy: { effectiveFrom: "desc" },
    });
    const amount = latestConfig?.amount ?? 50000;

    // 2. Ambil semua unit hunian aktif
    const activeUnits = await prisma.householdUnit.findMany({
      where: { isActive: true },
      select: { id: true, unitNumber: true },
    });

    if (activeUnits.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada unit hunian aktif untuk diterbitkan tagihan" },
        { status: 400 }
      );
    }

    // 3. Filter unit yang BELUM punya tagihan di bulan/tahun ini
    const existingPayments = await prisma.iplPayment.findMany({
      where: {
        month,
        year,
        householdId: { in: activeUnits.map((u) => u.id) },
      },
      select: { householdId: true },
    });

    const billedHouseholdIds = new Set(existingPayments.map((p) => p.householdId));
    const targetUnits = activeUnits.filter((u) => !billedHouseholdIds.has(u.id));

    if (targetUnits.length === 0) {
      return NextResponse.json({
        success: true,
        generated: 0,
        message: "Semua unit aktif sudah memiliki tagihan untuk periode ini.",
      });
    }

    // 4. Tanggal jatuh tempo (tanggal 10 bulan tsb)
    const dueDate = new Date(year, month - 1, 10);

    const paymentsToCreate = targetUnits.map((u) => ({
      householdId: u.id,
      amount,
      month,
      year,
      status: "UNPAID" as const,
      dueDate,
    }));

    const result = await prisma.iplPayment.createMany({
      data: paymentsToCreate,
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      generated: result.count,
      message: `${result.count} tagihan IPL berhasil diterbitkan untuk periode ${month}/${year}.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan server";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
