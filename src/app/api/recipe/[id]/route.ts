import { updateRecipe } from "@/lib/recipes";
import { missingUserId } from "@/lib/http";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const { userId, recipe } = body;

  if (!userId) return missingUserId();

  const existing = await prisma.recipe.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  const updated = await updateRecipe(id, recipe);
  return NextResponse.json(updated);
}
