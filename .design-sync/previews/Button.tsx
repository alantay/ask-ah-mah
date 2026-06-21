import { Button } from "ask-ah-mah";

// The brand CTAs — terracotta with the paper-stamp hard shadow. `cta` is the
// page-level action; `ctaDeep` is the modal/commit shape.
export const Cta = () => (
  <div className="flex items-center gap-3">
    <Button variant="cta">Start cooking</Button>
    <Button variant="ctaDeep">Save recipe</Button>
  </div>
);

// The standard shadcn variants, all styled with the app's tokens.
export const Variants = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Button>Default</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="outline">Outline</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="link">Link</Button>
    <Button variant="destructive">Delete</Button>
  </div>
);

// The size scale — sm, default, lg, and the square icon button.
export const Sizes = () => (
  <div className="flex items-center gap-3">
    <Button size="sm">Small</Button>
    <Button size="default">Default</Button>
    <Button size="lg">Large</Button>
    <Button size="icon" aria-label="Add">+</Button>
  </div>
);

// Disabled state — dimmed, non-interactive.
export const Disabled = () => (
  <div className="flex items-center gap-3">
    <Button disabled>Default</Button>
    <Button variant="ctaDeep" disabled>
      Save recipe
    </Button>
  </div>
);
