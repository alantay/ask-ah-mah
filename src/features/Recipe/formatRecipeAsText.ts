import { scaleAmount } from "./scaleAmount";

// The recipe as plain text for the clipboard — one formatter, two call sites
// (RecipeLetter and RecipeDisplay), identical output. Deliberately NO markdown:
// CAPS headers and `•`/numbered lists survive a paste into WhatsApp, Notes, or
// any plain-text target. User-specific pantry state ("10/12 in your pantry",
// "Still need") is excluded — this is the recipe, not the shopping context.

export interface FormattableRecipe {
  title: string;
  description?: string;
  totalTimeMinutes?: number;
  baseServings: number;
  ingredients: { name: string; amount?: string; unit?: string; note?: string }[];
  prep?: string[];
  steps: { title?: string; body: string; tip?: string; uses?: { name: string; amount?: string; unit?: string; text?: string }[] }[];
  notes?: string[];
}

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

export function formatRecipeAsText(
  recipe: FormattableRecipe,
  servings: number,
): string {
  const ratio = recipe.baseServings ? servings / recipe.baseServings : 1;
  // Each entry is a section; blank line between sections.
  const sections: string[] = [];

  sections.push(recipe.title.toUpperCase());

  if (recipe.description) sections.push(recipe.description);

  const meta: string[] = [];
  if (recipe.totalTimeMinutes)
    meta.push(`Total time: ${formatTime(recipe.totalTimeMinutes)}`);
  meta.push(`Servings: ${servings}`);
  sections.push(meta.join("\n"));

  if (recipe.ingredients.length > 0) {
    const lines = recipe.ingredients.map((ing) => {
      const scaled = ing.amount ? scaleAmount(ing.amount, ratio) : "";
      // amount reflects the displayed servings; amountless rows read "to taste"
      let line = scaled
        ? `• ${scaled}${ing.unit ? ` ${ing.unit}` : ""} ${ing.name}`
        : `• ${ing.name}, to taste`;
      if (ing.note) line += ` — ${ing.note}`;
      return line;
    });
    sections.push(["WHAT TO GATHER", ...lines].join("\n"));
  }

  if (recipe.prep && recipe.prep.length > 0) {
    sections.push(
      ["BEFORE YOU START", ...recipe.prep.map((p) => `• ${p}`)].join("\n"),
    );
  }

  if (recipe.steps.length > 0) {
    const lines = recipe.steps.flatMap((step, i) => {
      const n = i + 1;
      const out: string[] = [];
      if (step.title) {
        out.push(`${n}. ${step.title}`);
        out.push(`   ${step.body}`);
      } else {
        out.push(`${n}. ${step.body}`);
      }
      if (step.uses && step.uses.length > 0) {
        const usesLine = step.uses
          .map((u) =>
            u.amount
              ? `${scaleAmount(u.amount, ratio)}${u.unit ? ` ${u.unit}` : ""} ${u.name}`
              : u.text
                ? `${u.text} ${u.name}`
                : u.name,
          )
          .join(", ");
        out.push(`   Uses: ${usesLine}`);
      }
      if (step.tip) out.push(`   Tip: ${step.tip}`);
      return out;
    });
    sections.push(["METHOD", ...lines].join("\n"));
  }

  if (recipe.notes && recipe.notes.length > 0) {
    sections.push(["NOTES", ...recipe.notes.map((nt) => `• ${nt}`)].join("\n"));
  }

  sections.push("— from Ah Mah");

  return sections.join("\n\n");
}
