import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { s3, S3_BUCKET, S3_PUBLIC_URL } from "@/lib/storage";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const event = await prisma.communityEvent.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Hanya penulis atau admin yang bisa hapus
  if (event.authorId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Hapus foto lampiran dari S3 storage (jika ada)
  if (event.attachments?.length) {
    await Promise.allSettled(
      event.attachments.map((url) => {
        const key = url.replace(`${S3_PUBLIC_URL}/`, "");
        return s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
      })
    );
  }

  await prisma.communityEvent.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
