// auth.config.ts — Edge-compatible auth configuration
// Tidak mengandung Prisma/pg yang memerlukan Node.js native modules
// Digunakan oleh middleware.ts yang berjalan di Edge Runtime

import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [],
  session: { strategy: "jwt" as const },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.address = (user as { address?: string }).address;
        token.houseNumber = (user as { houseNumber?: string }).houseNumber;
        token.phone = (user as { phone?: string }).phone;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.address = token.address as string;
        session.user.houseNumber = token.houseNumber as string;
        session.user.phone = token.phone as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage = nextUrl.pathname.startsWith("/login");
      const isAdminPage = nextUrl.pathname.startsWith("/admin");
      const isApiAuth = nextUrl.pathname.startsWith("/api/auth");
      const isPublicApi =
        nextUrl.pathname.startsWith("/api/push/vapid-public") ||
        nextUrl.pathname === "/manifest.json" ||
        nextUrl.pathname.startsWith("/icons/") ||
        nextUrl.pathname === "/sw.js";

      if (isApiAuth || isPublicApi) return true;

      if (isLoggedIn && isAuthPage)
        return Response.redirect(new URL("/dashboard", nextUrl));

      if (!isLoggedIn && !isAuthPage)
        return Response.redirect(new URL("/login", nextUrl));

      if (isAdminPage && auth?.user?.role !== "ADMIN")
        return Response.redirect(new URL("/dashboard", nextUrl));

      return true;
    },
  },
} satisfies NextAuthConfig;
