"use client";

import { TAG_SETS, TagCategory, getTagCategory } from "@/lib/recipes/tagColors";

const CATEGORY_LABELS: Record<Exclude<TagCategory, "other">, string> = {
  cuisine: "Cuisine",
  main: "Protein & Carbs",
  method: "Method",
  meal: "Meal Type",
  effort: "Effort",
  style: "Flavour",
};

const HIDE_SCROLLBAR =
  "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

interface RecipeSidebarProps {
  tagCounts: Record<string, number>;
  activeTags: Set<string>;
  onToggle: (tag: string) => void;
  onClear: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

interface GroupedSection {
  cat: Exclude<TagCategory, "other">;
  label: string;
  tags: string[];
}

export function RecipeSidebar({
  tagCounts,
  activeTags,
  onToggle,
  onClear,
  mobileOpen,
  onMobileClose,
}: RecipeSidebarProps) {
  const grouped: GroupedSection[] = (
    Object.keys(TAG_SETS) as Exclude<TagCategory, "other">[]
  )
    .map((cat) => ({
      cat,
      label: CATEGORY_LABELS[cat],
      tags: TAG_SETS[cat].filter((t) => t in tagCounts),
    }))
    .filter((g) => g.tags.length > 0);

  const otherTags = Object.keys(tagCounts).filter(
    (t) => getTagCategory(t) === "other"
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden sm:flex flex-col w-52 shrink-0 border-r border-border overflow-hidden">
        <SidebarHeader activeTags={activeTags} onClear={onClear} />
        <div className={`flex-1 overflow-y-auto ${HIDE_SCROLLBAR}`}>
          <SidebarContent
            grouped={grouped}
            otherTags={otherTags}
            tagCounts={tagCounts}
            activeTags={activeTags}
            onToggle={onToggle}
          />
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="sm:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={onMobileClose}
          />
          <div className="relative w-72 max-w-[85vw] flex flex-col bg-muted shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Filters
              </span>
              <div className="flex items-center gap-3">
                {activeTags.size > 0 && (
                  <button
                    onClick={onClear}
                    className="text-[11px] text-primary hover:opacity-70 transition-opacity cursor-pointer"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={onMobileClose}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="m3 3 10 10M13 3 3 13"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className={`flex-1 overflow-y-auto ${HIDE_SCROLLBAR}`}>
              <SidebarContent
                grouped={grouped}
                otherTags={otherTags}
                tagCounts={tagCounts}
                activeTags={activeTags}
                onToggle={onToggle}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SidebarHeader({
  activeTags,
  onClear,
}: {
  activeTags: Set<string>;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
      <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        Filters
      </span>
      {activeTags.size > 0 && (
        <button
          onClick={onClear}
          className="text-[11px] text-primary hover:opacity-70 transition-opacity cursor-pointer"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

function SidebarContent({
  grouped,
  otherTags,
  tagCounts,
  activeTags,
  onToggle,
}: {
  grouped: GroupedSection[];
  otherTags: string[];
  tagCounts: Record<string, number>;
  activeTags: Set<string>;
  onToggle: (tag: string) => void;
}) {
  return (
    <div className="flex flex-col gap-5 px-3 py-4">
      {grouped.map(({ cat, label, tags }) => (
        <section key={cat}>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/60 mb-1.5 px-1">
            {label}
          </p>
          <div className="flex flex-col">
            {tags.map((tag) => (
              <CheckboxRow
                key={tag}
                tag={tag}
                count={tagCounts[tag]}
                checked={activeTags.has(tag)}
                onToggle={() => onToggle(tag)}
              />
            ))}
          </div>
        </section>
      ))}
      {otherTags.length > 0 && (
        <section>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/60 mb-1.5 px-1">
            Other
          </p>
          <div className="flex flex-col">
            {otherTags.map((tag) => (
              <CheckboxRow
                key={tag}
                tag={tag}
                count={tagCounts[tag]}
                checked={activeTags.has(tag)}
                onToggle={() => onToggle(tag)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function CheckboxRow({
  tag,
  count,
  checked,
  onToggle,
}: {
  tag: string;
  count: number;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2.5 px-1 py-[5px] rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left w-full cursor-pointer group"
    >
      <span
        className={`w-[13px] h-[13px] shrink-0 rounded-[3px] border flex items-center justify-center transition-colors ${
          checked
            ? "bg-primary border-primary"
            : "border-border bg-card group-hover:border-muted-foreground"
        }`}
      >
        {checked && (
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
            <path
              d="m1 3 2 2 4-4"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span
        className={`flex-1 text-[12px] leading-snug truncate transition-colors ${
          checked ? "text-foreground font-medium" : "text-muted-foreground"
        }`}
      >
        {tag}
      </span>
      <span className="text-[10px] text-muted-foreground/50 tabular-nums shrink-0">
        {count}
      </span>
    </button>
  );
}
