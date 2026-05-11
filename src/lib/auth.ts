import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink } from "better-auth/plugins";
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
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `Ask Ah Mah <${process.env.RESEND_FROM_EMAIL}>`,
            to: email,
            subject: "Your sign-in link for Ask Ah Mah",
            html: `<p>Click <a href="${url}">here to sign in to Ask Ah Mah</a>. This link expires in 15 minutes.</p><p>If you didn't request this, you can safely ignore it.</p>`,
          }),
        });
        if (!res.ok) {
          throw new Error(`Resend error: ${res.status}`);
        }
      },
    }),
  ],
});
