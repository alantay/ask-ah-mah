/**
 * Resolves better-auth's `baseURL` and `trustedOrigins` from the environment.
 *
 * The problem this solves: Vercel gives every deployment its own origin
 * (`VERCEL_URL`) and exposes the stable production domain separately
 * (`VERCEL_PROJECT_PRODUCTION_URL`) — both without a protocol. better-auth's
 * origin check defaults to trusting only `baseURL`'s origin, so requests from a
 * per-deployment URL are rejected with "Invalid origin" (which is what broke
 * anonymous sign-in, and with it every session-gated route, in production).
 *
 * Strategy:
 * - `baseURL` stays pinned to a *stable* origin so the Google OAuth callback
 *   URL doesn't move between deployments (a changing redirect_uri breaks
 *   sign-in). Prefer an explicit `BETTER_AUTH_URL`, then the Vercel production
 *   domain, then localhost.
 * - `trustedOrigins` additionally trusts the concrete deployment URL and any
 *   `*.vercel.app` preview origin, so the origin check passes on every deploy
 *   without making OAuth redirects dynamic.
 */
export function resolveAuthOrigins(
  env: Record<string, string | undefined> = process.env,
): {
  baseURL: string;
  trustedOrigins: string[];
} {
  const deploymentURL = env.VERCEL_URL ? `https://${env.VERCEL_URL}` : undefined;
  const productionURL = env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined;

  const baseURL =
    env.BETTER_AUTH_URL ?? productionURL ?? "http://localhost:3000";

  const trustedOrigins = Array.from(
    new Set(
      [baseURL, productionURL, deploymentURL, "https://*.vercel.app"].filter(
        (origin): origin is string => Boolean(origin),
      ),
    ),
  );

  return { baseURL, trustedOrigins };
}
