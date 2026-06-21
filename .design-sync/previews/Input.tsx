import { Input } from "ask-ah-mah";

// Resting, filled, and disabled text inputs.
export const States = () => (
  <div className="flex w-72 flex-col gap-3">
    <Input placeholder="Add an ingredient…" />
    <Input defaultValue="2 cloves garlic" />
    <Input placeholder="Disabled" disabled />
  </div>
);
