import type { RecipeBenchmarkCase } from "./types";

export const RECIPE_QUALITY_CASES: RecipeBenchmarkCase[] = [
  {
    id: "wok-chicken-fried-rice",
    category: "equipment and sequencing",
    prompt:
      "Make me chicken fried rice using my wok. I want distinct grains, not soggy rice.",
    inventory: {
      ingredients: [
        { name: "cold cooked rice", category: "Carbs", quantity: 500, unit: "g" },
        { name: "chicken thigh", category: "Protein", quantity: 300, unit: "g" },
        { name: "egg", category: "Protein", quantity: 2, unit: "pieces" },
        { name: "garlic", category: "Vegetable" },
        { name: "spring onion", category: "Vegetable" },
        { name: "soy sauce", category: "Condiments" },
        { name: "neutral oil", category: "Condiments" },
        { name: "white pepper", category: "Spice" },
      ],
      kitchenware: ["wok"],
    },
    reviewFocus:
      "High-heat wok sequencing, moisture control, distinct rice grains, and chicken doneness.",
    requiredIngredients: [
      { label: "rice", anyOf: ["rice"] },
      { label: "chicken", anyOf: ["chicken"] },
      { label: "egg", anyOf: ["egg"] },
    ],
    requiredText: [
      { label: "uses the wok", pattern: /\bwok\b/i },
      {
        label: "controls heat or crowding",
        pattern: /high heat|very hot|smoking|batches|overcrowd|crowd/i,
      },
    ],
  },
  {
    id: "classic-carbonara",
    category: "canonical technique",
    prompt:
      "Make a classic spaghetti carbonara for two. Keep it traditional and creamy without cream.",
    inventory: {
      ingredients: [
        { name: "spaghetti", category: "Carbs", quantity: 250, unit: "g" },
        { name: "egg", category: "Protein", quantity: 3, unit: "pieces" },
        { name: "pecorino romano", category: "Misc", quantity: 100, unit: "g" },
        { name: "guanciale", category: "Protein", quantity: 120, unit: "g" },
        { name: "black pepper", category: "Spice" },
        { name: "salt", category: "Condiments" },
      ],
      kitchenware: ["pot", "frying pan"],
    },
    reviewFocus:
      "A stable egg-and-cheese emulsion, sensible residual-heat control, and no added cream.",
    requiredIngredients: [
      { label: "pasta", anyOf: ["spaghetti", "pasta"] },
      { label: "egg", anyOf: ["egg"] },
      { label: "pecorino", anyOf: ["pecorino"] },
      { label: "guanciale", anyOf: ["guanciale"] },
    ],
    forbiddenIngredients: [{ label: "cream", anyOf: ["cream"] }],
    requiredText: [
      {
        label: "protects the eggs from scrambling",
        pattern: /off (?:the )?heat|residual heat|away from (?:the )?heat|not scramble/i,
      },
    ],
  },
  {
    id: "air-fryer-chicken-thighs",
    category: "equipment adaptation",
    prompt:
      "Give me crisp, juicy chicken thighs made in my air fryer, with a practical doneness check.",
    inventory: {
      ingredients: [
        { name: "bone-in chicken thigh", category: "Protein", quantity: 4, unit: "pieces" },
        { name: "neutral oil", category: "Condiments" },
        { name: "soy sauce", category: "Condiments" },
        { name: "garlic", category: "Vegetable" },
        { name: "paprika", category: "Spice" },
        { name: "black pepper", category: "Spice" },
        { name: "salt", category: "Condiments" },
      ],
      kitchenware: ["air fryer", "instant-read thermometer"],
    },
    reviewFocus:
      "Air-fryer-specific placement and timing, crisp skin, juicy meat, and safe doneness guidance.",
    requiredIngredients: [{ label: "chicken thigh", anyOf: ["chicken thigh"] }],
    requiredText: [
      { label: "uses the air fryer", pattern: /air fry|air fryer/i },
      {
        label: "provides a temperature doneness check",
        pattern: /(?:74|75)\s*°?c|165\s*°?f|thermometer|internal temperature/i,
      },
      {
        label: "provides an air-fryer cooking time",
        pattern: /\b\d+(?:\s*(?:-|–|to)\s*\d+)?\s*(?:minutes?|mins?)\b/i,
      },
    ],
  },
  {
    id: "mayonnaise-emulsion",
    category: "failure-sensitive technique",
    prompt:
      "Teach me to make a small batch of mayonnaise that will not split.",
    inventory: {
      ingredients: [
        { name: "egg yolk", category: "Protein", quantity: 1, unit: "piece" },
        { name: "neutral oil", category: "Condiments", quantity: 200, unit: "ml" },
        { name: "lemon", category: "Misc", quantity: 1, unit: "piece" },
        { name: "dijon mustard", category: "Condiments" },
        { name: "salt", category: "Condiments" },
      ],
      kitchenware: ["bowl", "whisk"],
    },
    reviewFocus:
      "Emulsion order, gradual oil incorporation, sensory cues, and a credible rescue path.",
    requiredIngredients: [
      { label: "egg yolk", anyOf: ["egg yolk"] },
      { label: "oil", anyOf: ["oil"] },
      { label: "acid", anyOf: ["lemon", "vinegar"] },
    ],
    requiredText: [
      {
        label: "adds oil gradually",
        pattern: /drop by drop|thin stream|slowly|gradually|a little at a time/i,
      },
      {
        label: "provides a split-emulsion rescue",
        pattern:
          /(?:split|broken|break)[\s\S]{0,160}(?:water|fresh (?:egg )?yolk|mustard)|(?:water|fresh (?:egg )?yolk|mustard)[\s\S]{0,160}(?:split|broken|break)/i,
      },
    ],
  },
  {
    id: "plain-congee",
    category: "restraint and texture",
    prompt:
      "Make me a comforting plain congee. Keep it simple, but not stripped of the ingredients that normally belong.",
    inventory: {
      ingredients: [
        { name: "jasmine rice", category: "Carbs", quantity: 200, unit: "g" },
        { name: "ginger", category: "Vegetable" },
        { name: "spring onion", category: "Vegetable" },
        { name: "salt", category: "Condiments" },
        { name: "white pepper", category: "Spice" },
        { name: "sesame oil", category: "Condiments" },
      ],
      kitchenware: ["heavy pot"],
    },
    reviewFocus:
      "Rice-to-water method, creamy texture without forced complexity, and appropriate restraint.",
    requiredIngredients: [
      { label: "rice", anyOf: ["rice"] },
      { label: "ginger", anyOf: ["ginger"] },
      { label: "spring onion", anyOf: ["spring onion", "scallion"] },
    ],
  },
  {
    id: "steamed-whole-fish",
    category: "doneness and sequencing",
    prompt:
      "Make Cantonese-style steamed whole fish. I care about tender fish and a clear doneness cue.",
    inventory: {
      ingredients: [
        { name: "whole sea bass", category: "Protein", quantity: 700, unit: "g" },
        { name: "ginger", category: "Vegetable" },
        { name: "spring onion", category: "Vegetable" },
        { name: "light soy sauce", category: "Condiments" },
        { name: "sesame oil", category: "Condiments" },
        { name: "neutral oil", category: "Condiments" },
        { name: "sugar", category: "Condiments" },
      ],
      kitchenware: ["wok with lid", "steaming rack", "heatproof plate"],
    },
    reviewFocus:
      "Steam timing, sensory doneness, handling of released liquid, and the hot-oil aromatic finish.",
    requiredIngredients: [
      { label: "whole fish", anyOf: ["sea bass", "whole fish"] },
      { label: "ginger", anyOf: ["ginger"] },
      { label: "spring onion", anyOf: ["spring onion", "scallion"] },
    ],
    requiredText: [
      {
        label: "gives a sensory doneness cue",
        pattern: /flakes|opaque|pulls away|lifts away|backbone|flesh.*(?:set|firm)/i,
      },
    ],
  },
  {
    id: "vegan-tempeh-rendang",
    category: "dietary constraint",
    prompt:
      "Make a deeply flavoured vegan tempeh rendang. It must stay fully vegan.",
    inventory: {
      ingredients: [
        { name: "tempeh", category: "Protein", quantity: 400, unit: "g" },
        { name: "coconut milk", category: "Misc", quantity: 400, unit: "ml" },
        { name: "lemongrass", category: "Vegetable" },
        { name: "galangal", category: "Vegetable" },
        { name: "shallot", category: "Vegetable" },
        { name: "garlic", category: "Vegetable" },
        { name: "dried chilli", category: "Spice" },
        { name: "tamarind paste", category: "Condiments" },
        { name: "coriander seed", category: "Spice" },
        { name: "cumin", category: "Spice" },
        { name: "turmeric", category: "Spice" },
        { name: "salt", category: "Condiments" },
        { name: "sugar", category: "Condiments" },
      ],
      kitchenware: ["wide heavy pan", "blender"],
    },
    reviewFocus:
      "Spice-paste development, coconut reduction, tempeh texture, balance, and strict vegan compliance.",
    requiredIngredients: [
      { label: "tempeh", anyOf: ["tempeh"] },
      { label: "coconut milk", anyOf: ["coconut milk"] },
      { label: "lemongrass", anyOf: ["lemongrass"] },
    ],
    forbiddenIngredients: [
      { label: "fish sauce", anyOf: ["fish sauce"] },
      { label: "shrimp paste", anyOf: ["shrimp paste", "belacan"] },
      { label: "meat", anyOf: ["beef", "chicken", "pork"] },
    ],
  },
  {
    id: "soft-boiled-eggs",
    category: "simple precision",
    prompt:
      "Show me how to make soft-boiled eggs with set whites and jammy yolks.",
    inventory: {
      ingredients: [
        { name: "egg", category: "Protein", quantity: 4, unit: "pieces" },
        { name: "salt", category: "Condiments" },
      ],
      kitchenware: ["small pot", "timer"],
    },
    reviewFocus:
      "A precise, reproducible method that accounts for carryover cooking and stops the eggs cleanly.",
    requiredIngredients: [{ label: "egg", anyOf: ["egg"] }],
    requiredText: [
      {
        label: "stops carryover cooking",
        pattern: /ice (?:bath|water)|cold water|stop (?:the )?cooking|carryover/i,
      },
      {
        label: "provides a precise cooking time",
        pattern:
          /\b(?:6(?:\.5)?|7|8)(?:\s*(?:-|–|to)\s*(?:6(?:\.5)?|7|8))?\s*(?:minutes?|mins?)\b/i,
      },
    ],
  },
  {
    id: "gluten-free-noodles",
    category: "allergen constraint",
    prompt:
      "Make me a gluten-free vegetable noodle stir-fry. Do not quietly introduce wheat.",
    inventory: {
      ingredients: [
        { name: "rice noodles", category: "Carbs", quantity: 250, unit: "g" },
        { name: "tamari", category: "Condiments" },
        { name: "carrot", category: "Vegetable" },
        { name: "napa cabbage", category: "Vegetable" },
        { name: "mushroom", category: "Vegetable" },
        { name: "garlic", category: "Vegetable" },
        { name: "ginger", category: "Vegetable" },
        { name: "sesame oil", category: "Condiments" },
        { name: "rice vinegar", category: "Condiments" },
        { name: "neutral oil", category: "Condiments" },
      ],
      kitchenware: ["wok"],
    },
    reviewFocus:
      "Strict gluten-free ingredient choices, rice-noodle handling, vegetable sequencing, and sauce balance.",
    requiredIngredients: [
      { label: "rice noodles", anyOf: ["rice noodles"] },
      { label: "tamari", anyOf: ["tamari"] },
    ],
    forbiddenIngredients: [
      { label: "wheat noodles", anyOf: ["wheat noodles"] },
      { label: "ordinary soy sauce", anyOf: ["regular soy sauce", "ordinary soy sauce"] },
      { label: "oyster sauce", anyOf: ["oyster sauce"] },
    ],
  },
  {
    id: "braised-pork-belly",
    category: "balance and reduction",
    prompt:
      "Make soy-braised pork belly that is rich but not cloying. Give me cues for the braise and final sauce.",
    inventory: {
      ingredients: [
        { name: "pork belly", category: "Protein", quantity: 700, unit: "g" },
        { name: "light soy sauce", category: "Condiments" },
        { name: "dark soy sauce", category: "Condiments" },
        { name: "shaoxing wine", category: "Condiments" },
        { name: "rock sugar", category: "Condiments" },
        { name: "ginger", category: "Vegetable" },
        { name: "spring onion", category: "Vegetable" },
        { name: "star anise", category: "Spice" },
        { name: "black vinegar", category: "Condiments" },
      ],
      kitchenware: ["heavy pot"],
    },
    reviewFocus:
      "Rendered but succulent pork, controlled sweetness, sufficient savoury depth, brightness, and sauce reduction.",
    requiredIngredients: [
      { label: "pork belly", anyOf: ["pork belly"] },
      { label: "soy sauce", anyOf: ["soy sauce"] },
      { label: "shaoxing wine", anyOf: ["shaoxing"] },
    ],
    requiredText: [
      {
        label: "describes tenderness or sauce consistency",
        pattern: /tender|yields|glossy|coats the back|syrupy|reduced/i,
      },
    ],
  },
  {
    id: "one-pot-tomato-pasta",
    category: "weeknight practicality",
    prompt:
      "Make a genuinely practical one-pot tomato pasta for a tired weeknight. Avoid unnecessary steps.",
    inventory: {
      ingredients: [
        { name: "spaghetti", category: "Carbs", quantity: 300, unit: "g" },
        { name: "canned tomato", category: "Vegetable", quantity: 400, unit: "g" },
        { name: "garlic", category: "Vegetable" },
        { name: "onion", category: "Vegetable" },
        { name: "olive oil", category: "Condiments" },
        { name: "parmesan", category: "Misc" },
        { name: "dried oregano", category: "Spice" },
        { name: "chilli flakes", category: "Spice" },
        { name: "salt", category: "Condiments" },
      ],
      kitchenware: ["wide pot"],
    },
    reviewFocus:
      "Actually one-pot execution, realistic liquid management, pasta doneness, and weeknight brevity.",
    requiredIngredients: [
      { label: "pasta", anyOf: ["spaghetti", "pasta"] },
      { label: "tomato", anyOf: ["tomato"] },
    ],
    requiredText: [
      {
        label: "manages the one-pot liquid",
        pattern: /absorbs|evaporates|reduce|too dry|splash|stir.*(?:often|frequently)|liquid/i,
      },
    ],
  },
  {
    id: "crispy-tofu-no-deep-fry",
    category: "constraint and texture",
    prompt:
      "Make crispy tofu with a punchy sauce, but I do not want to deep-fry anything.",
    inventory: {
      ingredients: [
        { name: "firm tofu", category: "Protein", quantity: 400, unit: "g" },
        { name: "cornstarch", category: "Carbs" },
        { name: "soy sauce", category: "Condiments" },
        { name: "rice vinegar", category: "Condiments" },
        { name: "sesame oil", category: "Condiments" },
        { name: "garlic", category: "Vegetable" },
        { name: "ginger", category: "Vegetable" },
        { name: "chilli crisp", category: "Condiments" },
        { name: "spring onion", category: "Vegetable" },
        { name: "neutral oil", category: "Condiments" },
      ],
      kitchenware: ["non-stick frying pan"],
    },
    reviewFocus:
      "Moisture removal, crisp coating, shallow-pan technique, sauce timing, and preservation of texture.",
    requiredIngredients: [
      { label: "tofu", anyOf: ["tofu"] },
      { label: "cornstarch", anyOf: ["cornstarch", "corn starch"] },
    ],
    forbiddenText: [
      { label: "deep-frying instruction", pattern: /deep[- ]fry|deep frying/i },
    ],
  },
];
