import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/admin/events/[id]
// body: { action: "archive" | "unarchive" }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { action } = body as { action: "archive" | "unarchive" };

  if (!["archive", "unarchive"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const event = await prisma.communityEvent.findUnique({ where: { id } });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const updated = await prisma.communityEvent.update({
    where: { id },
    data: {
      archivedAt: action === "archive" ? new Date() : null,
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/admin/events/[id]
// Hapus permanen — hanya untuk event yang sudah diarsipkan
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const event = await prisma.communityEvent.findUnique({ where: { id } });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (!event.archivedAt) {
    return NextResponse.json(
      { error: "Hanya event yang sudah diarsipkan yang dapat dihapus permanen." },
      { status: 400 }
    );
  }

  await prisma.communityEvent.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
