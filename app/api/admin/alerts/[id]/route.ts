import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { action } = await req.json();

  if (action !== "resolve") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const alert = await prisma.panicAlert.findUnique({ where: { id } });
  if (!alert) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.panicAlert.update({
    where: { id },
    data: {
      isResolved: true,
      resolvedAt: new Date(),
      note: "Diselesaikan oleh admin.",
    },
  });

  return NextResponse.json({ success: true, alert: updated });
}
