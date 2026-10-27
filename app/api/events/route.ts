import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { eventSchema } from "@/lib/validators/event";

export async function GET() {
  const events = await prisma.communityEvent.findMany({
    where: { archivedAt: null },
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

  const { title, content, category, eventDate, location, attachments } = parsed.data;

  const event = await prisma.communityEvent.create({
    data: {
      authorId: session.user.id,
      title,
      content,
      category,
      eventDate: eventDate ? new Date(eventDate) : null,
      location: location || null,
      attachments: attachments ?? [],
    },
  });

  return NextResponse.json(event, { status: 201 });
}
