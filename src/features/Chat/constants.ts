export const THINKING_MESSAGES = [
  "Ah Mah is checking her recipe book...",
  "Ah Mah is rummaging through her memory...",
  "Ah Mah is tasting and adjusting...",
  "Ah Mah is stirring up some ideas...",
  "Ah Mah is simmering on this...",
  "Ah Mah is thinking hard...",
  "Ah Mah is wracking her brain...",
  "Ah Mah is putting on her thinking cap...",
  "Ah Mah is scratching her head...",
  "Let Ah Mah think about this...",
  "Ah Mah is consulting her kitchen wisdom...",
  "Ah Mah is digging through her cooking secrets...",
  "Ah Mah is mixing up something good...",
  "Ah Mah is seasoning her thoughts...",
  "Ah Mah is letting ideas marinate...",
  "Ah Mah is cooking up an answer...",
  "Ah Mah is hunting through her pantry of knowledge...",
  "Ah Mah is brewing up some suggestions...",
  "Ah Mah is chopping through the possibilities...",
  "Ah Mah is warming up her ideas...",
] as const;

export const INITIAL_MESSAGE = {
  role: "assistant" as const,
  id: "initial",
  parts: [
    {
      type: "text" as const,
      text: `**Hello dear!** I'm Ah Mah, your cooking assistant. I'd love to help you discover delicious recipes!


- **Tell me what ingredients you have:** "I have chicken and rice"
- **Add items to your kitchenware:** "I have a wok" 
- **Ask for recipe suggestions:** "What can I cook for dinner?"

---

**What would you like to cook today?** 🍳`,
    },
  ],
};

export const SUGGESTIONS = [
  "What can I cook tonight?",
  "I just got groceries",
  "Something quick for one",
];

export const LOADING_MESSAGES = [
  "Ah Mah is getting ready...",
  "Preparing your cooking assistant...",
  "Ah Mah is searching for her recipe book...",
  "Getting the kitchen ready...",
  "Ah Mah is warming up...",
  "Setting up your cooking session...",
  "Ah Mah is putting on her apron...",
  "Ah Mah is sharpening her knives...",
  "Getting ready to help you cook...",
];

// Recipe processing messages for optimistic UI
export const RECIPE_PROCESSING_MESSAGES = [
  "Tagging your recipe with love...",
  "Cooking up some delicious tags...",
  "Writing down the perfect recipe...",
  "Looking for the perfect recipe tags...",
  "Adding colorful recipe tags...",
  "Preparing your recipe for the cookbook...",
  "Predicting the perfect recipe tags...",
];

// Normalised phrases — slot after "Ah Mah ·" in the typing loader eyebrow
export const NORMALISED_THINKING_MESSAGES = [
  'checking her recipe book…',
  'rummaging through her memory…',
  'tasting and adjusting…',
  'stirring up some ideas…',
  'simmering on this…',
  'thinking hard…',
  'wracking her brain…',
  'putting on her thinking cap…',
  'scratching her head…',
  'thinking about this…',
  'consulting her kitchen wisdom…',
  'digging through her cooking secrets…',
  'mixing up something good…',
  'seasoning her thoughts…',
  'letting ideas marinate…',
  'cooking up an answer…',
  'hunting through her pantry…',
  'brewing up some suggestions…',
  'chopping through the possibilities…',
  'warming up her ideas…',
] as const;

// Status stream lines for the C loader variant
export const STATUS_LINES = [
  'looking at what you have…',
  'thinking of something nice…',
  'checking the pantry…',
  'writing the steps…',
] as const;

// ID generation patterns
export const generateTempId = (prefix: string = "temp"): string =>
  `${prefix}-${Date.now()}`;

export const isTempId = (id: string): boolean => id.startsWith("temp-");

// Helper function to get a random recipe processing message
export const getRandomRecipeProcessingMessage = (): string => {
  const randomIndex = Math.floor(
    Math.random() * RECIPE_PROCESSING_MESSAGES.length
  );
  return RECIPE_PROCESSING_MESSAGES[randomIndex];
};
