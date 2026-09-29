import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      role: true,
      householdId: true,
      household: {
        select: {
          unitNumber: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Akun tidak ditemukan atau pendaftaran ditolak", status: "REJECTED" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    status: user.status,
    householdId: user.householdId,
    unitNumber: user.household?.unitNumber ?? null,
  });
}
