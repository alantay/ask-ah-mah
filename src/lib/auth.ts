import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { anonymous } from "better-auth/plugins";
import { prisma } from "@/lib/db";
import { migrateGuestData } from "@/lib/auth/migrateGuestData";
import { resolveAuthOrigins } from "@/lib/auth/origins";

const { baseURL, trustedOrigins } = resolveAuthOrigins();

export const auth = betterAuth({
  baseURL,
  trustedOrigins,
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
  // the session cookie instead of a client-supplied userId. When a guest signs
  // in, onLinkAccount carries the cookbook/pantry they built over to the
  // account before better-auth deletes the anonymous user.
  plugins: [
    anonymous({
      onLinkAccount: async ({ anonymousUser, newUser }) => {
        await migrateGuestData(anonymousUser.user.id, newUser.user.id);
      },
    }),
  ],
});
