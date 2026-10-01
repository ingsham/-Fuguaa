import "next-auth";
import "next-auth/jwt";
type Role = "BUYER" | "SELLER" | "ADMIN";
declare module "next-auth" {
  interface User { role: Role }
  interface Session { user: { id: string; role: Role; name?: string | null; email?: string | null } }
}
declare module "next-auth/jwt" { interface JWT { id: string; role: Role } }
