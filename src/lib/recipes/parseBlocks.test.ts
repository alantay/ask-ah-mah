import {
  extractRecipeBlocks,
  findOpenArrayKey,
  getOpenFence,
  parsePartialBlock,
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

  it("parses a valid clarify block", () => {
    const text = `Quick question:
\`\`\`clarify
{
  "question": "What kind of meal are you after?",
  "options": [
    { "id": "quick", "label": "Something quick", "hint": "under 20 min" },
    { "id": "comfort", "label": "Comfort food" }
  ]
}
\`\`\``;

    const blocks = extractRecipeBlocks(text);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].kind).toBe("clarify");
    if (blocks[0].kind === "clarify") {
      expect(blocks[0].payload.question).toBe("What kind of meal are you after?");
      expect(blocks[0].payload.options[0].id).toBe("quick");
      expect(blocks[0].payload.options[0].hint).toBe("under 20 min");
      expect(blocks[0].payload.options[1].hint).toBeUndefined();
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

describe("getOpenFence", () => {
  it("returns null when no fence is present", () => {
    expect(getOpenFence("just some text")).toBeNull();
  });

  it("returns null when the recipe fence is closed", () => {
    expect(getOpenFence("```recipe\n{}\n```")).toBeNull();
  });

  it("returns null when the suggestions fence is closed", () => {
    expect(getOpenFence('```suggestions\n{"intro":"hi"}\n```')).toBeNull();
  });

  it("returns null when the clarify fence is closed", () => {
    expect(getOpenFence('```clarify\n{"question":"hi","options":[]}\n```')).toBeNull();
  });

  it("detects an unclosed clarify fence", () => {
    const text = 'Quick question:\n```clarify\n{"question":"What kind';
    const fence = getOpenFence(text);
    expect(fence?.kind).toBe("clarify");
    expect(fence?.json).toBe('{"question":"What kind');
  });

  it("detects an unclosed recipe fence with its prose offset and json body", () => {
    const text = 'Some prose\n```recipe\n{"title":"Gin';
    const fence = getOpenFence(text);
    expect(fence?.kind).toBe("recipe");
    expect(text.slice(fence!.index)).toContain("```recipe");
    expect(fence?.json).toBe('{"title":"Gin');
  });

  it("detects an unclosed suggestions fence (previously leaked raw JSON)", () => {
    const text = 'Here are ideas:\n```suggestions\n{"intro":"A few';
    const fence = getOpenFence(text);
    expect(fence?.kind).toBe("suggestions");
    expect(fence?.json).toBe('{"intro":"A few');
  });

  it("returns the trailing open fence after an earlier closed one (Mode 3)", () => {
    const text =
      '```recipe\n{"title":"Close"}\n```\nAnd a stretch:\n```recipe\n{"title":"Stre';
    const fence = getOpenFence(text);
    expect(fence?.kind).toBe("recipe");
    expect(fence?.json).toBe('{"title":"Stre');
  });
});

describe("findOpenArrayKey", () => {
  it("returns null when no top-level array is open", () => {
    expect(findOpenArrayKey('{"title":"X"')).toBeNull();
  });

  it("returns null when a top-level array has closed", () => {
    expect(findOpenArrayKey('{"ingredients":[{"name":"a"}],')).toBeNull();
  });

  it("names the open object-array being streamed", () => {
    expect(
      findOpenArrayKey('{"title":"X","ingredients":[{"name":"a"},{"name":"b'),
    ).toBe("ingredients");
  });

  it("names the open string-array being streamed", () => {
    expect(findOpenArrayKey('{"prep":["chop garlic","min')).toBe("prep");
  });

  it("reports the top-level array even when nested deeper inside an element", () => {
    expect(
      findOpenArrayKey('{"options":[{"id":"x","tags":["quick'),
    ).toBe("options");
  });

  it("is not fooled by brackets inside string values", () => {
    expect(findOpenArrayKey('{"title":"Soup [the good one]"')).toBeNull();
  });
});

describe("parsePartialBlock", () => {
  it("returns null for an empty or unparseable buffer", async () => {
    expect(await parsePartialBlock("")).toBeNull();
    expect(await parsePartialBlock("{")).toBeNull();
  });

  it("reveals a growing scalar string as it streams (typewriter)", async () => {
    const partial = await parsePartialBlock('{"title":"Ginger Chick');
    expect(partial?.title).toBe("Ginger Chick");
  });

  it("drops the in-progress trailing element of the streaming array", async () => {
    const partial = await parsePartialBlock(
      '{"ingredients":[{"name":"chicken"},{"name":"gin',
    );
    expect(partial?.ingredients).toEqual([{ name: "chicken" }]);
  });

  it("keeps every element once the array has closed", async () => {
    const partial = await parsePartialBlock(
      '{"ingredients":[{"name":"a"},{"name":"b"}],"steps":[{"title":"S',
    );
    expect(partial?.ingredients).toEqual([{ name: "a" }, { name: "b" }]);
    expect(partial?.steps).toEqual([]); // in-progress step held back
  });

  it("streams clarify options, holding back the in-progress one", async () => {
    const partial = await parsePartialBlock(
      '{"question":"What meal?","options":[{"id":"quick","label":"Quick"},{"id":"comf',
    );
    expect(partial?.question).toBe("What meal?");
    expect(partial?.options).toEqual([{ id: "quick", label: "Quick" }]);
  });

  it("returns the whole object untrimmed once the JSON is complete", async () => {
    const partial = await parsePartialBlock(
      '{"title":"X","baseServings":2,"ingredients":[{"name":"a"}],"steps":[]}',
    );
    expect(partial?.ingredients).toEqual([{ name: "a" }]);
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

  it("strips clarify fences, leaving prose", () => {
    const text = `Quick question:\n\`\`\`clarify\n{"question":"hi","options":[]}\n\`\`\`\nMore prose.`;
    const result = stripFences(text);
    expect(result).toContain("Quick question:");
    expect(result).toContain("More prose.");
    expect(result).not.toContain("```clarify");
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
