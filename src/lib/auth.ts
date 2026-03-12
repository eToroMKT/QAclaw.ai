import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

const adapter = PrismaAdapter(prisma);

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter,
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    Credentials({
      name: "Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const password = credentials?.password as string | undefined;
        const email = credentials?.email as string | undefined;

        // Demo login (backward compat): no email + correct demo password
        if (!email && password === process.env.DEMO_PASSWORD) {
          let user = await prisma.user.findFirst({
            where: { email: "demo@clawqa.ai" },
          });
          if (!user) {
            user = await prisma.user.create({
              data: {
                email: "demo@clawqa.ai",
                name: "ClawQA Demo",
                role: "admin",
              },
            });
          }
          return { id: user.id, name: user.name, email: user.email };
        }

        // Email + password login
        if (email && password) {
          const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
          });
          if (!user?.passwordHash) return null;

          const isValid = await bcrypt.compare(password, user.passwordHash);
          if (!isValid) return null;

          return {
            id: user.id,
            name: user.name || "User",
            email: user.email,
          };
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token?.id) {
        session.user.id = token.id as string;
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        });
        (session.user as any).role = dbUser?.role || "tester";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
