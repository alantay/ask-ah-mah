import {
  extractRecipeBlocks,
  getOpenRecipeFenceIdx,
  stripFences,
} from "./parseBlocks";

describe("extractRecipeBlocks", () => {
  it("parses a valid suggestions block", () => {
    const text = `Here are some ideas:
\`\`\`suggestions
{
  "intro": "A few things you can make:",
  "options": [
    {
      "id": "fried-rice",
      "title": "Fried Rice",
      "blurb": "Quick one-pan comfort.",
      "time": "15 min",
      "tags": ["stir-fry"],
      "keyIngredients": ["rice", "egg", "soy sauce"]
    }
  ]
}
\`\`\``;

    const blocks = extractRecipeBlocks(text);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].kind).toBe("suggestions");
    if (blocks[0].kind === "suggestions") {
      expect(blocks[0].payload.intro).toBe("A few things you can make:");
      expect(blocks[0].payload.options[0].id).toBe("fried-rice");
    }
  });

  it("parses a valid recipe block", () => {
    const text = `Here it is:
\`\`\`recipe
{
  "title": "Scrambled Eggs",
  "description": "Simple, buttery, perfect.",
  "totalTimeMinutes": 5,
  "baseServings": 1,
  "ingredients": [
    { "name": "egg", "category": "Protein", "amount": "2", "unit": "pcs" }
  ],
  "steps": [
    { "title": "Beat eggs", "body": "Whisk with a pinch of salt." }
  ],
  "tags": ["quick"]
}
\`\`\``;

    const blocks = extractRecipeBlocks(text);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].kind).toBe("recipe");
    if (blocks[0].kind === "recipe") {
      expect(blocks[0].payload.title).toBe("Scrambled Eggs");
      expect(blocks[0].payload.baseServings).toBe(1);
    }
  });

  it("does NOT parse a gate fenced block (gate path removed)", () => {
    const text = `Quick check:
\`\`\`gate
{
  "recipeId": "guacamole",
  "title": "Guacamole",
  "keyIngredients": ["avocado", "lime", "onion"]
}
\`\`\``;

    const blocks = extractRecipeBlocks(text);
    expect(blocks).toHaveLength(0);
  });

  it("parses legacy dashed-separator recipes when no new-style blocks present", () => {
    const text = `Here you go:\n-----\n## Sambal Belacan\nSpicy paste.\n-----\nEnjoy!`;

    const blocks = extractRecipeBlocks(text);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].kind).toBe("legacy");
  });

  it("does not parse legacy blocks when a new-style block is present", () => {
    const text = `-----\n## Old Recipe\n-----\n\`\`\`recipe
{
  "title": "New Recipe",
  "baseServings": 2,
  "ingredients": [],
  "steps": [],
  "tags": []
}
\`\`\``;

    const blocks = extractRecipeBlocks(text);
    expect(blocks.every((b) => b.kind !== "legacy")).toBe(true);
    expect(blocks.some((b) => b.kind === "recipe")).toBe(true);
  });

  it("silently skips a fenced block with invalid JSON", () => {
    const text = `\`\`\`recipe
not valid json at all
\`\`\``;

    const blocks = extractRecipeBlocks(text);
    expect(blocks).toHaveLength(0);
  });

  it("silently skips a block that fails schema validation", () => {
    // Missing required 'baseServings' field
    const text = `\`\`\`recipe
{ "title": "Oops", "ingredients": [], "steps": [], "tags": [] }
\`\`\``;

    const blocks = extractRecipeBlocks(text);
    expect(blocks).toHaveLength(0);
  });

  it("returns multiple blocks from a single string", () => {
    const text = `\`\`\`recipe
{
  "title": "Recipe A",
  "baseServings": 2,
  "ingredients": [],
  "steps": [],
  "tags": []
}
\`\`\`
Some prose.
\`\`\`recipe
{
  "title": "Recipe B",
  "baseServings": 4,
  "ingredients": [],
  "steps": [],
  "tags": []
}
\`\`\``;

    const blocks = extractRecipeBlocks(text);
    expect(blocks.filter((b) => b.kind === "recipe")).toHaveLength(2);
  });
});

describe("getOpenRecipeFenceIdx", () => {
  it("returns -1 when no recipe fence is present", () => {
    expect(getOpenRecipeFenceIdx("just some text")).toBe(-1);
  });

  it("returns -1 when recipe fence is closed", () => {
    const text = "```recipe\n{}\n```";
    expect(getOpenRecipeFenceIdx(text)).toBe(-1);
  });

  it("returns the index of an unclosed recipe fence", () => {
    const text = "Some prose\n```recipe\n{ partial json";
    const idx = getOpenRecipeFenceIdx(text);
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(text.slice(idx)).toContain("```recipe");
  });
});

describe("stripFences", () => {
  it("strips suggestions and recipe fences, leaving prose", () => {
    const text = `Here are ideas:\n\`\`\`suggestions\n{"intro":"hi","options":[]}\n\`\`\`\nMore prose.`;
    const result = stripFences(text);
    expect(result).toContain("Here are ideas:");
    expect(result).toContain("More prose.");
    expect(result).not.toContain("```suggestions");
  });

  it("strips recipe fences", () => {
    const text = `Cook time:\n\`\`\`recipe\n{"title":"X","baseServings":2,"ingredients":[],"steps":[],"tags":[]}\n\`\`\``;
    const result = stripFences(text);
    expect(result).not.toContain("```recipe");
    expect(result).toContain("Cook time:");
  });

  it("strips legacy gate fenced blocks (prevents Shiki crash on unknown language)", () => {
    const text = `Quick check:\n\`\`\`gate\n{"recipeId":"guac","title":"Guacamole","keyIngredients":["avocado"]}\n\`\`\`\nMore text.`;
    const result = stripFences(text);
    expect(result).not.toContain("```gate");
    expect(result).not.toContain("recipeId");
    expect(result).toContain("Quick check:");
    expect(result).toContain("More text.");
  });

  it("leaves plain prose untouched", () => {
    const text = "Just a normal message with no fences.";
    expect(stripFences(text)).toBe(text);
  });
});
