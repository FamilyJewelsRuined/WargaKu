// middleware.ts — Runs in Edge Runtime
// Uses authConfig (no Prisma/pg) to keep it Edge-compatible

import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|api/push/vapid-public).*)",
  ],
};
