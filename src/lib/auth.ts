import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink } from "better-auth/plugins";
import { prisma } from "@/lib/db";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    plugins: [
        magicLink({
            sendMagicLink: async ({ email, url }) => {
                // TODO: Integrate with an email provider like Resend
                console.log(`Magic link for ${email}: ${url}`);
            },
        }),
    ],
    socialProviders: {
...
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
    },
});
