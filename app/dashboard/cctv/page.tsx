import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Camera, Maximize2, Wifi } from "lucide-react";
import { CctvPlayer } from "@/components/cctv-player";

export default async function CctvPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const cameras = await prisma.cctvCamera.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="animate-float-up">
        <div className="flex items-center gap-3 mb-1">
          <Camera className="w-5 h-5 text-primary" />
          <span className="text-sm text-muted-foreground">Keamanan</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Live CCTV</h1>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <p className="text-muted-foreground text-sm">
            {cameras.length} kamera aktif · Pemantauan real-time
          </p>
        </div>
      </div>

      {/* Camera Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cameras.map((camera) => (
          <CctvPlayer key={camera.id} camera={camera} />
        ))}
      </div>

      {/* Notice */}
      <div className="surface border-blue-800/30 bg-blue-950/20 p-4 rounded-xl flex items-start gap-3">
        <Wifi className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-400">Info Streaming</p>
          <p className="text-xs text-muted-foreground mt-1">
            Feed CCTV menggunakan koneksi internet. Untuk IP Camera lokal,
            hubungi admin komplek untuk setup streaming internal.
          </p>
        </div>
      </div>
    </div>
  );
}
