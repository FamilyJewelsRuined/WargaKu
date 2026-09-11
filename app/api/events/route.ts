import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const eventSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(10).max(5000),
  category: z.enum(["DUKA_CITA", "PENGUMUMAN", "KEGIATAN", "LAINNYA"]),
  eventDate: z.string().nullable().optional(),
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
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { title, content, category, eventDate } = parsed.data;

  const event = await prisma.communityEvent.create({
    data: {
      authorId: session.user.id,
      title,
      content,
      category,
      eventDate: eventDate ? new Date(eventDate) : null,
    },
  });

  return NextResponse.json(event, { status: 201 });
}
