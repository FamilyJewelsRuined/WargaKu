// auth.config.ts — Edge-compatible auth configuration
// Tidak mengandung Prisma/pg yang memerlukan Node.js native modules
// Digunakan oleh proxy.ts yang berjalan di Node.js Runtime (Next.js 16)

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
        token.id = user.id ?? "";
        token.role = (user as { role?: string }).role ?? "WARGA";
        token.status = (user as { status?: string }).status ?? "ACTIVE";
        token.householdId = (user as { householdId?: string | null }).householdId ?? null;
        token.address = (user as { address?: string }).address ?? "";
        token.houseNumber = (user as { houseNumber?: string }).houseNumber ?? "";
        token.phone = (user as { phone?: string }).phone ?? "";
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = (token.id as string) ?? "";
        session.user.role = (token.role as string) ?? "WARGA";
        session.user.status = (token.status as string) ?? "ACTIVE";
        session.user.householdId = token.householdId as string | null | undefined;
        session.user.address = (token.address as string) ?? "";
        session.user.houseNumber = (token.houseNumber as string) ?? "";
        session.user.phone = (token.phone as string) ?? "";
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const userStatus = (auth?.user as { status?: string })?.status;
      const isPending = isLoggedIn && userStatus === "PENDING";
      const isSuspended = isLoggedIn && userStatus === "SUSPENDED";

      const isLandingPage = nextUrl.pathname === "/";
      const isAuthPage =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/register");
      const isWaitingPage = nextUrl.pathname.startsWith("/waiting");
      const isAdminPage = nextUrl.pathname.startsWith("/admin");
      const isApiAuth = nextUrl.pathname.startsWith("/api/auth");
      const isPublicApi =
        nextUrl.pathname.startsWith("/api/push/vapid-public") ||
        nextUrl.pathname === "/manifest.json" ||
        nextUrl.pathname.startsWith("/icons/") ||
        nextUrl.pathname === "/sw.js";

      // 1. Endpoint publik dan otentikasi selalu diizinkan
      if (isApiAuth || isPublicApi) return true;

      // 2. Pengguna belum login
      if (!isLoggedIn) {
        if (isLandingPage || isAuthPage) return true;
        return Response.redirect(new URL("/login", nextUrl));
      }

      // 3. Pengguna dinonaktifkan (SUSPENDED)
      if (isSuspended) {
        if (nextUrl.pathname.startsWith("/api/")) return false;
        return Response.redirect(new URL("/login?error=Suspended", nextUrl));
      }

      // 4. Pengguna menunggu verifikasi (PENDING)
      if (isPending) {
        if (nextUrl.pathname === "/api/user/status") return true;
        if (nextUrl.pathname.startsWith("/api/")) return false;
        if (isWaitingPage) return true;
        return Response.redirect(new URL("/waiting", nextUrl));
      }

      // 5. Pengguna aktif (ACTIVE / ADMIN / PETUGAS)
      if (isLandingPage || isAuthPage || isWaitingPage) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      if (isAdminPage && auth?.user?.role !== "ADMIN") {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
