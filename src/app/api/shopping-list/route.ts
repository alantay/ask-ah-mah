import { addShoppingListItems, getShoppingList } from "@/lib/shoppingList";
import { AddShoppingListItemsSchema } from "@/lib/shoppingList/schemas";
import { missingUserId } from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) return missingUserId();

    const items = await getShoppingList(userId);
    return NextResponse.json(
      { items },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  } catch (error) {
    console.error("Failed to fetch shopping list", error);
    return NextResponse.json(
      { error: "Failed to fetch shopping list" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, ...rest } = await req.json();
    if (!userId) return missingUserId();

    const parsed = AddShoppingListItemsSchema.safeParse(rest);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid shopping list payload" },
        { status: 400 },
      );
    }

    await addShoppingListItems(parsed.data.items, userId);
    return NextResponse.json({ success: true, message: "Shopping list updated" });
  } catch (error) {
    console.error("Failed to update shopping list", error);
    return NextResponse.json(
      { error: "Failed to update shopping list" },
      { status: 500 },
    );
  }
}
