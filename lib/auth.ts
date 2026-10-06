// auth.ts — Full auth with Prisma adapter (Node.js runtime only)
// Runs ONLY in server components and API routes, NOT in middleware

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { authConfig } from "@/lib/auth.config";
import { normalizePhone, phoneVariants } from "@/lib/phone";

// Field `email` tetap bernama "email" demi kompatibilitas, tetapi berisi email ATAU nomor HP.
const loginSchema = z.object({
  email: z.string().trim().min(1),
  password: z.string().min(1),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email: identifier, password } = parsed.data;

        let user;
        if (identifier.includes("@")) {
          user = await prisma.user.findUnique({
            where: { email: identifier.toLowerCase() },
          });
        } else {
          const phone = normalizePhone(identifier);
          if (!phone) return null;
          const matches = await prisma.user.findMany({
            where: { phone: { in: phoneVariants(phone) } },
            take: 2,
          });
          // Nomor ganda → tolak (ambigu), user harus login dengan email.
          user = matches.length === 1 ? matches[0] : null;
        }
        if (!user) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        if (user.status === "SUSPENDED") {
          throw new Error("Akun Anda telah dinonaktifkan oleh administrator.");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          householdId: user.householdId,
          address: user.address ?? undefined,
          houseNumber: user.houseNumber ?? undefined,
          phone: user.phone ?? undefined,
        };
      },
    }),
  ],
});
