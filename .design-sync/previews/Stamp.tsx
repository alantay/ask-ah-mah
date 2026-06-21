import { Stamp } from "ask-ah-mah";

// The terracotta "chop" — the pressed-ink register used for numbered recipe
// step badges. Inner content sits upright inside the tilted frame.
export const Primary = () => (
  <Stamp tone="primary" className="size-9 font-display text-lg font-semibold">
    1
  </Stamp>
);

// The cream paper tile — a softer lift, used for brand marks and avatars.
export const Paper = () => (
  <Stamp tone="paper" className="size-16 text-3xl">
    🍜
  </Stamp>
);

// Stamps compose into a run — e.g. the numbered steps of a method.
export const Sequence = () => (
  <div className="flex items-center gap-3">
    {[1, 2, 3].map((n) => (
      <Stamp
        key={n}
        tone="primary"
        className="size-9 font-display text-lg font-semibold"
      >
        {n}
      </Stamp>
    ))}
  </div>
);
