import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const createAccountSchema = z.object({
  bankName: z
    .string()
    .trim()
    .min(2, "Nama bank minimal 2 karakter")
    .max(50, "Nama bank maksimal 50 karakter"),
  accountNumber: z
    .string()
    .trim()
    .regex(/^[0-9]+$/, "Nomor rekening hanya boleh berisi angka")
    .min(5, "Nomor rekening minimal 5 digit")
    .max(30, "Nomor rekening maksimal 30 digit"),
  accountHolder: z
    .string()
    .trim()
    .min(2, "Nama pemilik rekening minimal 2 karakter")
    .max(100, "Nama pemilik rekening maksimal 100 karakter"),
  label: z
    .string()
    .trim()
    .max(100, "Label maksimal 100 karakter")
    .optional()
    .nullable(),
  order: z.number().int().default(0),
});

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const accounts = await prisma.paymentAccount.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    include: {
      createdBy: {
        select: { name: true, email: true },
      },
    },
  });

  return NextResponse.json(accounts);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = createAccountSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Input tidak valid" },
        { status: 400 }
      );
    }

    const { bankName, accountNumber, accountHolder, label, order } = parsed.data;

    // Periksa apakah nomor rekening yang sama sudah aktif
    const existing = await prisma.paymentAccount.findFirst({
      where: { accountNumber, bankName, isActive: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Nomor rekening ${bankName} ${accountNumber} sudah terdaftar dan aktif.` },
        { status: 409 }
      );
    }

    const newAccount = await prisma.paymentAccount.create({
      data: {
        bankName,
        accountNumber,
        accountHolder,
        label: label || null,
        order,
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
        message: `Rekening ${bankName} a.n. ${accountHolder} berhasil ditambahkan.`,
        account: newAccount,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan server";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
