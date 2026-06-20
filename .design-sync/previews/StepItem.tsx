import { StepItem } from "ask-ah-mah";

const bloom = {
  title: "Bloom the aromatics",
  body: "Heat 2 tbsp oil over medium. Add the garlic, ginger and the white parts of the spring onion. Fry until fragrant, about 30 seconds.",
  tip: "Low and slow here — burnt garlic turns the whole dish bitter.",
};

const sear = {
  title: "Sear the chicken",
  body: "Turn the heat to high and lay the chicken in a single layer. Leave it undisturbed for 2 minutes so it colours before you toss.",
};

// Chat "letter" register — rotated terracotta ink-stamp badge.
export const Stamp = () => <StepItem n={1} step={bloom} marker="stamp" />;

// Cookbook "reference" register — quiet mono "1." in a fixed gutter.
export const Quiet = () => <StepItem n={1} step={bloom} marker="quiet" />;

// A step without an Ah Mah tip.
export const NoTip = () => <StepItem n={2} step={sear} marker="stamp" />;
