import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "ask-ah-mah";

// The select at rest — trigger with a chosen value. (The dropdown opens into a
// portal on click; the resting trigger is the catalog representation.)
export const Trigger = () => (
  <Select defaultValue="medium">
    <SelectTrigger className="w-56">
      <SelectValue placeholder="Spice level" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="mild">Mild</SelectItem>
      <SelectItem value="medium">Medium</SelectItem>
      <SelectItem value="hot">Hot</SelectItem>
    </SelectContent>
  </Select>
);
