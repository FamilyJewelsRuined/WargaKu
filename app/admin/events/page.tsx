import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminEventsClient } from "./client";

export default async function AdminEventsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  const events = await prisma.communityEvent.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } } },
  });

  // Serialisasi untuk client component
  const serialized = events.map((e) => ({
    id: e.id,
    title: e.title,
    category: e.category,
    eventDate: e.eventDate?.toISOString() ?? null,
    archivedAt: e.archivedAt?.toISOString() ?? null,
    createdAt: e.createdAt.toISOString(),
    author: e.author,
  }));

  return <AdminEventsClient initialEvents={serialized} />;
}
