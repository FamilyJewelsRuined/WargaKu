import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const createUnitSchema = z.object({
  unitNumber: z.string().trim().min(1, "Nomor unit wajib diisi"),
  address: z.string().trim().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const units = await prisma.householdUnit.findMany({
    orderBy: { unitNumber: "asc" },
    include: {
      _count: {
        select: { members: true },
      },
      members: {
        select: { id: true, name: true, role: true },
      },
    },
  });

  return NextResponse.json(units);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = createUnitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Input tidak valid" },
        { status: 400 }
      );
    }

    const { unitNumber, address } = parsed.data;

    // Cek duplikasi nomor unit
    const existing = await prisma.householdUnit.findUnique({
      where: { unitNumber },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Unit hunian dengan nomor "${unitNumber}" sudah terdaftar` },
        { status: 409 }
      );
    }

    const newUnit = await prisma.householdUnit.create({
      data: {
        unitNumber,
        address: address || null,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, unit: newUnit }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan server";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
