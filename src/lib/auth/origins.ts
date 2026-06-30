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
 * - `trustedOrigins` additionally trusts the *concrete* origins this app is
 *   served from — the current deployment URL (`VERCEL_URL`, which is exactly
 *   the origin each deployment serves itself from) and the production domain.
 *   We deliberately do NOT add a broad `*.vercel.app` wildcard: `trustedOrigins`
 *   is a CSRF boundary, and that wildcard would trust every Vercel project's
 *   origin, not just ours.
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

  // Treat a blank/whitespace BETTER_AUTH_URL as unset — `??` alone would let an
  // empty string through and produce an invalid `baseURL: ""`.
  const configuredBaseURL = env.BETTER_AUTH_URL?.trim() || undefined;
  const baseURL = configuredBaseURL ?? productionURL ?? "http://localhost:3000";

  const trustedOrigins = Array.from(
    new Set(
      [baseURL, productionURL, deploymentURL].filter(
        (origin): origin is string => Boolean(origin),
      ),
    ),
  );

  return { baseURL, trustedOrigins };
}
