"use client";

import { InventoryItem } from "@/lib/inventory/schemas";

interface InventoryItemRowProps {
  item: InventoryItem;
  onRemove: (itemName: string) => void;
}

export function InventoryItemRow({ item, onRemove }: InventoryItemRowProps) {
  const qty =
    item.quantity && item.unit
      ? `${item.quantity} ${item.unit}`
      : item.quantity
        ? `${item.quantity}`
        : item.unit
          ? item.unit
          : "";

  return (
    <li className="group flex items-baseline gap-2 py-1.5 border-b border-dotted border-border last:border-0">
      <span className="font-display text-[14px] text-foreground leading-snug flex items-baseline gap-1.5 min-w-0">
        {item.shelfLife === "short" && (
          <span
            aria-label="Short shelf life"
            title="Short shelf life — use soon"
            className="inline-block h-1.5 w-1.5 rounded-full bg-tertiary shrink-0"
          />
        )}
        <span className="truncate">{item.name}</span>
      </span>
      <span className="flex-1" />
      {qty && (
        <span className="font-mono text-[11.5px] text-ink-faint tabular-nums shrink-0 group-hover:opacity-30 sm:group-hover:opacity-30 transition-opacity">
          {qty}
        </span>
      )}
      <button
        onClick={() => onRemove(item.name)}
        aria-label={`Remove ${item.name}`}
        className="shrink-0 -mr-1 w-6 h-6 rounded-md flex items-center justify-center text-ink-faint hover:text-foreground hover:bg-muted opacity-30 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer"
      >
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
          <path
            d="M3 3l10 10M13 3L3 13"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </li>
  );
}
