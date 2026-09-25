import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CctvClientView } from "@/components/cctv-client-view";

export default async function CctvPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const cameras = await prisma.cctvCamera.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  return <CctvClientView cameras={cameras} />;
}

