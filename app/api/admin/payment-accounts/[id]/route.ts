import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateAccountSchema = z.object({
  isActive: z.boolean().optional(),
  order: z.number().int().optional(),
  label: z.string().trim().max(100).optional().nullable(),
  // Blokir upaya pengubahan rekening
  bankName: z.undefined({ message: "Nama bank tidak dapat diubah setelah dibuat" }),
  accountNumber: z.undefined({ message: "Nomor rekening tidak dapat diubah setelah dibuat" }),
  accountHolder: z.undefined({ message: "Nama pemilik rekening tidak dapat diubah setelah dibuat" }),
});

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
    const parsed = updateAccountSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Input tidak valid" },
        { status: 400 }
      );
    }

    const account = await prisma.paymentAccount.findUnique({ where: { id } });
    if (!account) {
      return NextResponse.json({ error: "Rekening tidak ditemukan" }, { status: 404 });
    }

    const updated = await prisma.paymentAccount.update({
      where: { id },
      data: {
        ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
        ...(parsed.data.order !== undefined ? { order: parsed.data.order } : {}),
        ...(parsed.data.label !== undefined ? { label: parsed.data.label } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Data rekening berhasil diperbarui",
      account: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan server";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
