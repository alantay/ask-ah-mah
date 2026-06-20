import { Label, Input } from "ask-ah-mah";

// A label paired with its input — the standard form field composition.
export const Field = () => (
  <div className="flex w-72 flex-col gap-2">
    <Label htmlFor="serves">How many does it serve?</Label>
    <Input id="serves" placeholder="e.g. 4" />
  </div>
);
