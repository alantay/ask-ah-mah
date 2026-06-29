import { auth } from "@/lib/auth";

/**
 * The single source of truth for "who is making this request" on the server.
 *
 * Resolves the caller's id from the verified better-auth session cookie —
 * anonymous or signed-in alike. Routes MUST use this instead of trusting a
 * `userId` from the query string or body, which is attacker-controlled.
 *
 * Returns the verified user id, or `null` when there is no valid session
 * (callers map that to a 401 via `unauthorized()`).
 */
export async function getSessionUserId(req: Request): Promise<string | null> {
  const session = await auth.api.getSession({ headers: req.headers });
  return session?.user?.id ?? null;
}
