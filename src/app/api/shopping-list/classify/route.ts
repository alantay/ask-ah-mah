import { classifyPendingAisles } from "@/lib/shoppingList";
import { withAuth } from "@/lib/withAuth";
import { NextResponse } from "next/server";

export const POST = withAuth(async (_req, { userId }) => {
  try {
    await classifyPendingAisles(userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to classify shopping list aisles", error);
    return NextResponse.json(
      { error: "Failed to classify shopping list aisles" },
      { status: 500 },
    );
  }
});
