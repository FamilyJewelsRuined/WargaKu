import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateUnitSchema = z.object({
  action: z.enum(["update", "toggle-status"]).optional(),
  unitNumber: z.string().trim().min(1).optional(),
  address: z.string().trim().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: unitId } = await params;

  try {
    const body = await req.json();
    const parsed = updateUnitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Input tidak valid" },
        { status: 400 }
      );
    }

    const unit = await prisma.householdUnit.findUnique({
      where: { id: unitId },
    });

    if (!unit) {
      return NextResponse.json({ error: "Unit hunian tidak ditemukan" }, { status: 404 });
    }

    const { action, unitNumber, address, isActive } = parsed.data;

    if (action === "toggle-status") {
      const updated = await prisma.householdUnit.update({
        where: { id: unitId },
        data: { isActive: !unit.isActive },
      });

      return NextResponse.json({
        success: true,
        message: `Status unit ${unit.unitNumber} diubah menjadi ${updated.isActive ? "Aktif" : "Nonaktif"}`,
        unit: updated,
      });
    }

    // Cek duplikasi jika nomor unit diubah
    if (unitNumber && unitNumber !== unit.unitNumber) {
      const existing = await prisma.householdUnit.findUnique({
        where: { unitNumber },
      });
      if (existing) {
        return NextResponse.json(
          { error: `Nomor unit "${unitNumber}" sudah digunakan` },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.householdUnit.update({
      where: { id: unitId },
      data: {
        ...(unitNumber ? { unitNumber } : {}),
        ...(address !== undefined ? { address: address || null } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Unit ${updated.unitNumber} berhasil diperbarui`,
      unit: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan server";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
