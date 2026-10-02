import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "buyer" | "seller" | "admin";
      name?: string | null;
      email?: string | null;
    };
  }

  interface User {
    role?: string;
  }
}
