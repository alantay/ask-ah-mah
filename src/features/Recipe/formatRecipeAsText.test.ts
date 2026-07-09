import { formatRecipeAsText, type FormattableRecipe } from "./formatRecipeAsText";

const base: FormattableRecipe = {
  title: "Ginger Chicken & Bok Choy",
  description: "Velvety chicken thighs, ginger that bites a little.",
  totalTimeMinutes: 20,
  baseServings: 2,
  ingredients: [
    { name: "chicken thigh", amount: "500", unit: "g", note: "boneless, bite-size" },
    { name: "bok choy", amount: "1", unit: "bunch" },
    { name: "salt" },
  ],
  prep: ["Cut chicken into bite-size pieces", "Mince 1 tbsp ginger"],
  steps: [
    {
      title: "Marinate the chicken",
      body: "Toss chicken with soy, cornstarch and sesame oil. Leave 10 min.",
      tip: "Cornstarch gives you that velvety texture.",
    },
    { title: "Stir-fry", body: "Sear the chicken hot and fast, then the greens." },
  ],
  notes: ["Make-ahead: the sauce keeps 3 days in the fridge."],
};

describe("formatRecipeAsText", () => {
  it("renders all sections with CAPS headers and the footer", () => {
    const text = formatRecipeAsText(base, 2);
    expect(text).toContain("GINGER CHICKEN & BOK CHOY");
    expect(text).toContain("WHAT TO GATHER");
    expect(text).toContain("BEFORE YOU START");
    expect(text).toContain("METHOD");
    expect(text).toContain("NOTES");
    expect(text).toContain("— from Ah Mah");
    expect(text).toContain("Total time: 20 min");
    expect(text).toContain("Servings: 2");
  });

  it("contains no markdown syntax (survives a plain-text paste)", () => {
    const text = formatRecipeAsText(base, 2);
    expect(text).not.toMatch(/[*#_`]/);
    expect(text).not.toMatch(/\[.*\]\(.*\)/); // no markdown links
  });

  it("scales ingredient amounts to the displayed servings", () => {
    const text = formatRecipeAsText(base, 4); // double from base 2
    expect(text).toContain("• 1000 g chicken thigh");
    expect(text).toContain("• 2 bunch bok choy");
    expect(text).toContain("Servings: 4");
  });

  it("renders amountless rows as 'to taste'", () => {
    const text = formatRecipeAsText(base, 2);
    expect(text).toContain("• salt, to taste");
  });

  it("appends an ingredient note after an em dash", () => {
    const text = formatRecipeAsText(base, 2);
    expect(text).toContain("• 500 g chicken thigh — boneless, bite-size");
  });

  it("numbers steps, leads with the title, and renders the tip", () => {
    const text = formatRecipeAsText(base, 2);
    expect(text).toContain("1. Marinate the chicken");
    expect(text).toContain("   Tip: Cornstarch gives you that velvety texture.");
    expect(text).toContain("2. Stir-fry");
  });

  it("omits sections that are absent (no empty NOTES / BEFORE YOU START)", () => {
    const lean: FormattableRecipe = {
      title: "Toast",
      baseServings: 1,
      ingredients: [{ name: "bread", amount: "2", unit: "slice" }],
      steps: [{ title: "", body: "Toast the bread." }],
    };
    const text = formatRecipeAsText(lean, 1);
    expect(text).not.toContain("NOTES");
    expect(text).not.toContain("BEFORE YOU START");
    expect(text).not.toContain("Total time:");
    // titleless step renders body inline against the number
    expect(text).toContain("1. Toast the bread.");
  });

  it("excludes user-specific pantry state", () => {
    const text = formatRecipeAsText(base, 2);
    expect(text).not.toMatch(/in your pantry/i);
    expect(text).not.toMatch(/still need/i);
  });
});

describe("formatRecipeAsText — Step Uses", () => {
  it("includes a scaled Uses line under a step that has uses", () => {
    const text = formatRecipeAsText(
      {
        title: "Mapo Tofu",
        baseServings: 2,
        ingredients: [],
        steps: [
          {
            body: "Stir in the slurry.",
            uses: [
              { name: "cornstarch slurry", amount: "2", unit: "tbsp" },
              { name: "spring onion", text: "to taste" },
            ],
          },
        ],
      },
      4, // servings — 2x baseServings
    );
    expect(text).toContain("Uses: 4 tbsp cornstarch slurry, to taste spring onion");
  });

  it("omits the Uses line for a step without uses", () => {
    const text = formatRecipeAsText(
      { title: "Mapo Tofu", baseServings: 2, ingredients: [], steps: [{ body: "Fry it." }] },
      2,
    );
    expect(text).not.toContain("Uses:");
  });
});
