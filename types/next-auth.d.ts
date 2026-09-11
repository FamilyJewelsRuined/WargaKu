// Extend Next-Auth session types
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      address?: string;
      houseNumber?: string;
      phone?: string;
    };
  }

  interface User {
    role: string;
    address?: string;
    houseNumber?: string;
    phone?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    address?: string;
    houseNumber?: string;
    phone?: string;
  }
}
