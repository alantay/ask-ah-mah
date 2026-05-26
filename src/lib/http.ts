import { NextResponse } from "next/server";

export function missingUserId() {
  return NextResponse.json({ error: "userId is required" }, { status: 400 });
}
