import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CalendarDays, Plus } from "lucide-react";
import Link from "next/link";
import { EventCard } from "@/components/event-card";

const categoryLabels = {
  DUKA_CITA: "Duka Cita",
  PENGUMUMAN: "Pengumuman",
  KEGIATAN: "Kegiatan",
  LAINNYA: "Lainnya",
};

export default async function EventPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { category } = await searchParams;

  const events = await prisma.communityEvent.findMany({
    where: category ? { category: category as keyof typeof categoryLabels } : {},
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true, houseNumber: true } } },
  });

  const categories = Object.entries(categoryLabels);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between animate-float-up">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <CalendarDays className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">Komunitas</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Info Event Warga</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Pengumuman dan kegiatan komplek
          </p>
        </div>
        <Link
          href="/dashboard/event/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-semibold glow-green transition-all hover:scale-105 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Buat
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <Link
          href="/dashboard/event"
          className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            !category
              ? "bg-primary text-primary-foreground"
              : "surface text-muted-foreground hover:text-foreground"
          }`}
        >
          Semua
        </Link>
        {categories.map(([key, label]) => (
          <Link
            key={key}
            href={`/dashboard/event?category=${key}`}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              category === key
                ? "bg-primary text-primary-foreground"
                : "surface text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Events Feed */}
      {events.length === 0 ? (
        <div className="surface p-12 text-center">
          <CalendarDays className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-foreground font-medium">Belum ada pengumuman</p>
          <p className="text-muted-foreground text-sm mt-1">
            Jadilah yang pertama membuat pengumuman!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              currentUserId={session.user.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
