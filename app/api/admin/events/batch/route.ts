import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/admin/events/batch
// body: { action: "archive-old" | "purge-old" }
//
// archive-old: arsipkan semua event aktif yang eventDate-nya sudah > 30 hari lalu
// purge-old:   hapus permanen event yang archivedAt-nya sudah > 60 hari lalu
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { action } = body as { action: "archive-old" | "purge-old" };

  if (action === "archive-old") {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await prisma.communityEvent.updateMany({
      where: {
        archivedAt: null,
        eventDate: { lt: thirtyDaysAgo },
      },
      data: { archivedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      archived: result.count,
      message: `${result.count} event berhasil diarsipkan.`,
    });
  }

  if (action === "purge-old") {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const result = await prisma.communityEvent.deleteMany({
      where: {
        archivedAt: { lt: sixtyDaysAgo },
      },
    });

    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `${result.count} event lama berhasil dihapus permanen.`,
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
