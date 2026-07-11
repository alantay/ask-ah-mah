import { addShoppingListItems } from "@/lib/shoppingList";
import { parseShoppingListText } from "@/lib/shoppingList/parseText";
import { withAuth } from "@/lib/withAuth";
import { NextRequest, NextResponse } from "next/server";

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }
    if (text.length > 10_000) {
      return NextResponse.json({ error: "text is too long" }, { status: 400 });
    }

    const items = await parseShoppingListText(text);
    await addShoppingListItems(items, userId);

    return NextResponse.json({
      success: true,
      items,
      message: `Added ${items.length} item(s)`,
    });
  } catch (error) {
    console.error("Failed to parse shopping list entry", error);
    return NextResponse.json(
      { error: "Failed to parse shopping list entry" },
      { status: 500 },
    );
  }
});
