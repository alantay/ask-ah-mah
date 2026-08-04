// PROTOTYPE — throwaway. Wayfinder #478: what does answering a multi-select
// checklist feel like, and what does submitting it send?
// Three variants of the checklist block, switchable via `?variant=`, mounted in
// a realistic chat thread. Delete this whole folder once the answer is folded in.

export interface ChecklistRow {
  id: string;
  label: string;
  hint?: string;
}

export interface ChecklistData {
  dish: string;
  ask: string;
  rows: ChecklistRow[];
}

export const CHECKLIST: ChecklistData = {
  dish: "laksa",
  ask: "Ah Mah thinking laksa for you tonight. Got any of these hiding in your kitchen?",
  rows: [
    { id: "paste", label: "laksa paste", hint: "the whole soul of it" },
    { id: "coconut milk", label: "coconut milk", hint: "tinned is fine" },
    { id: "rice noodles", label: "thick rice noodles", hint: "the fat white ones" },
  ],
};

// The deal, stated up front (ask-policy §3 — both sides before the tap).
export const DEAL =
  "Got these, I make you proper laksa. If not, never mind — still cook you something good, just cannot call it laksa lah.";

export function labelsOf(ids: string[]): string[] {
  return ids.map(id => CHECKLIST.rows.find(r => r.id === id)?.label ?? id);
}

export function listify(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

// ── Ah Mah's follow-on reply ──────────────────────────────────────────────────
// Name is binary, dish is a gradient (ask-policy §4).

export function ahMahReply(ticked: string[]): string {
  const all = CHECKLIST.rows.length;
  if (ticked.length === all) {
    return "Wah, you got everything! Proper **laksa** then — I write it out for you now.";
  }
  if (ticked.length === 0) {
    return "Never mind lah. No laksa today, but I cook you a **spicy coconut-less noodle soup** from what you already have — still shiok.";
  }
  const missing = CHECKLIST.rows.filter(r => !ticked.includes(r.label)).map(r => r.label);
  return `Cannot call it laksa without the ${listify(missing)} — but with your ${listify(ticked)}, I make you a **coconut noodle soup** that's close. Still good, just honest name.`;
}

// ── Replay: recover the ticked set from the sent message text alone ────────────
// This is today's `derivePickedId` rule (substring scan) generalised to a set.
// The prototype runs it live so its failure modes are visible, not theoretical.

export function deriveTickedNaive(rows: ChecklistRow[], text: string): string[] {
  const lower = text.toLowerCase();
  return rows.filter(r => lower.includes(r.label.toLowerCase())).map(r => r.id);
}
