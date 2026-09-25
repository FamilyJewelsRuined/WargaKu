// proxy.ts — Runs in Node.js Runtime (Next.js 16 default for proxy)
// Uses authConfig (no Prisma/pg) to keep it Edge-compatible
// Migrated from middleware.ts — see: https://nextjs.org/docs/messages/middleware-to-proxy

import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export const { auth: proxy } = NextAuth(authConfig);

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (Next.js static chunks)
     * - _next/image   (image optimisation)
     * - favicon.ico, manifest.json, sw.js (PWA assets)
     * - /icons/*      (app icons)
     * - /api/push/vapid-public (public VAPID endpoint)
     * - Common static file extensions in /public
     *   (png, jpg, jpeg, gif, webp, svg, ico, mp4, pdf, txt, xml, woff, woff2)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|icons|manifest\\.json|sw\\.js|api/push/vapid-public|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|mp4|pdf|txt|xml|woff2?)$).*)",
  ],
};

