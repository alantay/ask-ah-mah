import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { anonymous } from "better-auth/plugins";
import { prisma } from "@/lib/db";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL!,
  secret: process.env.BETTER_AUTH_SECRET!,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  // Every visitor — signed-in or not — gets a real, unforgeable session.
  // Guests are issued an anonymous session so routes can derive identity from
  // the session cookie instead of a client-supplied userId. Migrating an
  // anonymous user's data to their account on sign-in (onLinkAccount) is
  // handled separately in #346.
  plugins: [anonymous()],
});
