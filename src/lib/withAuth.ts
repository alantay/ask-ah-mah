import { unauthorized } from "@/lib/http";
import { getSessionUserId } from "@/lib/session";
import { NextRequest } from "next/server";

export function withAuth(
  handler: (req: NextRequest, ctx: { userId: string }) => Promise<Response>,
): (req: NextRequest) => Promise<Response> {
  return async (req: NextRequest) => {
    const userId = await getSessionUserId(req);
    if (!userId) return unauthorized();
    return handler(req, { userId });
  };
}

export function withAuthDynamic<P extends Record<string, string>>(
  handler: (req: NextRequest, ctx: { userId: string; params: Promise<P> }) => Promise<Response>,
): (req: NextRequest, routeCtx: { params: Promise<P> }) => Promise<Response> {
  return async (req: NextRequest, routeCtx: { params: Promise<P> }) => {
    const userId = await getSessionUserId(req);
    if (!userId) return unauthorized();
    return handler(req, { userId, params: routeCtx.params });
  };
}
