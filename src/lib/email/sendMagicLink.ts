import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends the "sign in to Ah Mah's kitchen" magic-link email via Resend.
 * Called by the better-auth `magicLink` plugin with a freshly generated `url`;
 * the link is single-use and expires in 10 minutes (set on the plugin).
 */
export async function sendMagicLink({
  email,
  url,
}: {
  email: string;
  url: string;
}): Promise<void> {
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: email,
    subject: "Your key to Ah Mah's kitchen",
    html: magicLinkEmail(url),
  });

  // Surface delivery failures to the caller so the UI can tell the user the
  // link didn't send, rather than silently showing "check your inbox".
  if (error) {
    throw new Error(`Failed to send magic link: ${error.message}`);
  }
}

function magicLinkEmail(url: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #2b2b2b;">
      <h1 style="font-size: 20px; margin: 0 0 16px;">Come on in, the kitchen's warm</h1>
      <p style="font-size: 15px; line-height: 1.5; margin: 0 0 24px;">
        Tap the button below to sign in to Ah Mah's kitchen. Your pantry and
        cookbook will be waiting for you.
      </p>
      <a href="${url}" style="display: inline-block; background: #c2703d; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; padding: 12px 24px; border-radius: 8px;">
        Open the kitchen
      </a>
      <p style="font-size: 13px; line-height: 1.5; color: #6b6b6b; margin: 24px 0 0;">
        This link expires in 10 minutes and can only be used once. If the button
        doesn't work, copy this link into your browser:
      </p>
      <p style="font-size: 13px; word-break: break-all; margin: 8px 0 0;">
        <a href="${url}" style="color: #c2703d;">${url}</a>
      </p>
      <p style="font-size: 13px; line-height: 1.5; color: #6b6b6b; margin: 24px 0 0;">
        If you didn't ask to sign in, you can safely ignore this email.
      </p>
    </div>
  `;
}
