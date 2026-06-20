"use client";

import { cn } from "@/lib/utils";
import { InventoryItem } from "@/lib/inventory/schemas";

interface InventoryItemRowProps {
  item: InventoryItem;
  onRemove: (itemName: string) => void;
  selectionMode?: boolean;
  selected?: boolean;
  onToggle?: (itemId: string) => void;
}

export function InventoryItemRow({
  item,
  onRemove,
  selectionMode = false,
  selected = false,
  onToggle,
}: InventoryItemRowProps) {
  const qty =
    item.quantity && item.unit
      ? `${item.quantity} ${item.unit}`
      : item.quantity
        ? `${item.quantity}`
        : item.unit
          ? item.unit
          : "";

  if (selectionMode) {
    return (
      <li
        role="checkbox"
        aria-checked={selected}
        tabIndex={0}
        onClick={() => onToggle?.(item.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle?.(item.id);
          }
        }}
        className={cn(
          "flex items-center gap-2.5 py-1.5 border-b border-dotted border-border last:border-0 cursor-pointer select-none transition-colors",
          selected && "text-foreground",
        )}
      >
        <span
          className={cn(
            "shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors",
            selected
              ? "bg-primary border-primary text-primary-foreground"
              : "border-border bg-transparent",
          )}
        >
          {selected && (
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
              <path
                d="M1.5 5L4 7.5L8.5 2.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
        <span className="font-display text-emphasis leading-snug flex items-baseline gap-1.5 min-w-0 flex-1">
          <span className="truncate">{item.name}</span>
        </span>
        {qty && (
          <span className="font-mono text-micro text-ink-faint tabular-nums shrink-0">
            {qty}
          </span>
        )}
      </li>
    );
  }

  return (
    <li className="group flex items-baseline gap-2 py-1.5 border-b border-dotted border-border last:border-0">
      <span className="font-display text-emphasis text-foreground leading-snug flex items-baseline gap-1.5 min-w-0">
        <span className="truncate">{item.name}</span>
      </span>
      <span className="flex-1" />
      {qty && (
        <span className="font-mono text-micro text-ink-faint tabular-nums shrink-0 group-hover:opacity-30 sm:group-hover:opacity-30 transition-opacity">
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
