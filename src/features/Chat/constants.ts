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

### To get started, you can:

- **Tell me what ingredients you have:** "I have chicken and rice"
- **Add items to your kitchenware:** "I have a wok" 
- **Ask for recipe suggestions:** "What can I cook for dinner?"

---

**What would you like to cook today?** 🍳`,
    },
  ],
};
