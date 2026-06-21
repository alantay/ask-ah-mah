import { Badge } from "ask-ah-mah";

// The four badge variants, all on the app's tokens.
export const Variants = () => (
  <div className="flex flex-wrap items-center gap-2">
    <Badge>Fresh</Badge>
    <Badge variant="secondary">Pantry</Badge>
    <Badge variant="outline">Optional</Badge>
    <Badge variant="destructive">Out of stock</Badge>
  </div>
);
