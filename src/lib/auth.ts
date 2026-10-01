import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { rateLimit } from "./rate-limit";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/login" },
  providers: [
    Credentials({
      name: "Email",
      credentials: { email: {}, password: {} },
      async authorize(c) {
        const email = c?.email?.toLowerCase().trim();
        if (!email || !c?.password) return null;
        if (!rateLimit(`login:${email}`, 5, 15 * 60_000)) throw new Error("Too many attempts. Try again in 15 minutes.");
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash || !(await bcrypt.compare(c.password, user.passwordHash))) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) { token.id = user.id; token.role = user.role; }
      return token;
    },
    session({ session, token }) {
      if (session.user) { session.user.id = token.id; session.user.role = token.role; }
      return session;
    },
  },
};
