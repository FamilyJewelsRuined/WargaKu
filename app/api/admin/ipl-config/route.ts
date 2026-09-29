import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const iplConfigSchema = z.object({
  amount: z.number().int().positive("Nominal harus berupa angka positif"),
  effectiveFrom: z.string().min(1, "Tanggal berlaku wajib diisi"),
  note: z.string().trim().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const configs = await prisma.iplConfig.findMany({
    orderBy: { effectiveFrom: "desc" },
    include: {
      createdBy: {
        select: { name: true, email: true },
      },
    },
  });

  return NextResponse.json(configs);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = iplConfigSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Input tidak valid" },
        { status: 400 }
      );
    }

    const { amount, effectiveFrom, note } = parsed.data;

    const newConfig = await prisma.iplConfig.create({
      data: {
        amount,
        effectiveFrom: new Date(effectiveFrom),
        note: note || null,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Nominal tarif IPL Rp ${amount.toLocaleString("id-ID")} berhasil disimpan.`,
        config: newConfig,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan server";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
