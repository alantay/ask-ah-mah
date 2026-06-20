import { StepList } from "ask-ah-mah";

const steps = [
  {
    title: "Bloom the aromatics",
    body: "Heat 2 tbsp oil over medium. Fry the garlic, ginger and white spring onion until fragrant, about 30 seconds.",
    tip: "Low and slow — burnt garlic turns the whole dish bitter.",
  },
  {
    title: "Sear the chicken",
    body: "Turn the heat to high and lay the chicken in a single layer. Leave it 2 minutes to colour, then toss for one more.",
  },
  {
    title: "Bring it together",
    body: "Splash in the soy and oyster sauce, add a ladle of stock, and simmer until the sauce clings to everything.",
    tip: "Taste before you salt — the sauces already carry a lot.",
  },
];

// Chat "letter" register.
export const Letter = () => <StepList steps={steps} marker="stamp" />;

// Cookbook "reference" register.
export const Reference = () => <StepList steps={steps} marker="quiet" />;
