import { auth } from "@/lib/auth";
import { s3, S3_BUCKET } from "@/lib/storage";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(req: Request) {
  // 1. Autentikasi — semua role (WARGA, PETUGAS_SAMPAH, ADMIN) bisa upload
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse FormData
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
  }

  // 3. Validasi tipe file
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Tipe file tidak didukung. Gunakan JPG, PNG, WebP, atau GIF." },
      { status: 400 }
    );
  }

  // 4. Validasi ukuran file
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: `Ukuran file melebihi batas 10MB. File kamu: ${(file.size / 1024 / 1024).toFixed(1)}MB` },
      { status: 400 }
    );
  }

  try {
    // 5. Upload ke Prisma Object Storage (T3 — S3-compatible)
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const key = `events/${session.user.id}/${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await s3.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        ContentLength: buffer.length,
      })
    );

    // Kembalikan URL via proxy endpoint (/api/image) — bukan URL S3 langsung
    // agar tidak kena 403 Forbidden (bucket tidak public)
    const proxyUrl = `/api/image?key=${encodeURIComponent(key)}`;
    return NextResponse.json({ url: proxyUrl, key }, { status: 201 });
  } catch (err) {
    console.error("[upload] S3 upload error:", err);
    return NextResponse.json(
      { error: "Gagal mengunggah foto. Coba lagi." },
      { status: 500 }
    );
  }
}
