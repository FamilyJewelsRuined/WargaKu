import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { note } = await req.json().catch(() => ({}));

  const alert = await prisma.panicAlert.findUnique({ where: { id } });
  if (!alert) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Warga hanya bisa resolve alert miliknya; admin bisa semua
  if (alert.userId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (alert.isResolved) {
    return NextResponse.json(
      { error: "Alert sudah diselesaikan sebelumnya" },
      { status: 400 }
    );
  }

  const updated = await prisma.panicAlert.update({
    where: { id },
    data: {
      isResolved: true,
      resolvedAt: new Date(),
      note: typeof note === "string" && note.trim()
        ? note.trim()
        : "Situasi sudah aman.",
    },
  });

  return NextResponse.json({ success: true, alert: updated });
}
