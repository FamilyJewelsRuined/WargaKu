import { auth } from "@/lib/auth";
import { s3, S3_BUCKET } from "@/lib/storage";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

/**
 * GET /api/image?key=events/userId/timestamp.png
 *
 * Image proxy: mengambil file dari S3 menggunakan server credentials
 * dan meneruskannya ke browser. Ini mengatasi masalah 403 Forbidden
 * karena bucket tidak bersifat public.
 *
 * Juga mendukung full S3 URL sebagai fallback untuk data lama.
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  let key = searchParams.get("key") ?? "";

  if (!key) {
    return NextResponse.json({ error: "Parameter 'key' diperlukan" }, { status: 400 });
  }

  // Fallback: jika key adalah full S3 URL (data lama), ekstrak key-nya
  // Contoh: https://t3.storage.dev/bucket-name/events/... -> events/...
  if (key.startsWith("http")) {
    try {
      const parsed = new URL(key);
      // pathname: /bucket-name/events/userId/file.png
      const parts = parsed.pathname.split("/").slice(2); // hapus leading slash dan bucket name
      key = parts.join("/");
    } catch {
      return NextResponse.json({ error: "URL tidak valid" }, { status: 400 });
    }
  }

  try {
    const command = new GetObjectCommand({ Bucket: S3_BUCKET, Key: key });
    const s3Response = await s3.send(command);

    const bodyBytes = await s3Response.Body?.transformToByteArray();
    if (!bodyBytes) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 404 });
    }
    const body = Buffer.from(bodyBytes);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": s3Response.ContentType ?? "image/jpeg",
        // Cache di browser 1 jam
        "Cache-Control": "private, max-age=3600",
        "Content-Length": String(body.length),
      },
    });
  } catch (err: unknown) {
    const code = (err as { Code?: string })?.Code;
    if (code === "NoSuchKey") {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 404 });
    }
    console.error("[image proxy] S3 error:", err);
    return NextResponse.json({ error: "Gagal mengambil gambar" }, { status: 500 });
  }
}
