import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const eventSchema = z.object({
  title: z.string().min(1, "Judul event wajib diisi").max(200, "Judul maksimal 200 karakter"),
  content: z.string().min(1, "Konten/deskripsi wajib diisi").max(5000, "Konten maksimal 5000 karakter"),
  category: z.enum(["DUKA_CITA", "PENGUMUMAN", "KEGIATAN", "LAINNYA"]).default("KEGIATAN"),
  eventDate: z.string().nullable().optional(),
  attachments: z.array(z.string().url("URL lampiran tidak valid")).max(5, "Maksimal 5 foto per event").optional().default([]),
});

export async function GET() {
  const events = await prisma.communityEvent.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true, houseNumber: true } } },
  });
  return NextResponse.json(events);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstMessage =
      Object.values(fieldErrors).flat()[0] || "Format data pengumuman tidak valid";
    return NextResponse.json({ error: firstMessage }, { status: 400 });
  }

  const { title, content, category, eventDate, attachments } = parsed.data;

  const event = await prisma.communityEvent.create({
    data: {
      authorId: session.user.id,
      title,
      content,
      category,
      eventDate: eventDate ? new Date(eventDate) : null,
      attachments: attachments ?? [],
    },
  });

  return NextResponse.json(event, { status: 201 });
}
