"use client";

import { useSessionContext } from "@/contexts/SessionContext";
import { GetInventoryResponse } from "@/lib/inventory/schemas";
import { fetcher } from "@/lib/utils/index";
import { useEffect, useState } from "react";
import useSWR from "swr";
import InventoryWrapper from "./InventoryWrapper";

const PANTRY_OPEN_KEY = "ask-ah-mah-pantry-open";

export function PantryDrawer() {
  const { userId } = useSessionContext();
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(PANTRY_OPEN_KEY) === "true";
  });

  useEffect(() => {
    localStorage.setItem(PANTRY_OPEN_KEY, String(open));
  }, [open]);

  const { data } = useSWR<GetInventoryResponse>(
    userId ? `/api/inventory?userId=${userId}` : null,
    fetcher,
  );

  const count =
    (data?.ingredientInventory?.length ?? 0) +
    (data?.kitchenwareInventory?.length ?? 0);

  return (
    <>
      {/* Collapsed tab — always mounted so right edge doesn't jump */}
      <button
        type="button"
        className="hidden lg:flex flex-col items-center justify-start pt-3.5 w-9 shrink-0 bg-muted paper border-l border-border relative"
        style={{ cursor: open ? "default" : "pointer" }}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={open ? "Close pantry drawer" : "Open pantry drawer"}
      >
        <span
          className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-ink-faint select-none"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          Pantry · {count} ›
        </span>
      </button>

      {/* xl+ (≥1280px): squeeze — pantry is a static flex sibling, chat narrows */}
      {open && (
        <div className="hidden xl:flex w-80 flex-col bg-muted paper border-l border-border overflow-y-auto">
          <InventoryWrapper onClose={() => setOpen(false)} />
        </div>
      )}

      {/* lg–xl (1024–1279px): overlay — pantry floats over chat */}
      {open && (
        <div className="hidden lg:flex xl:hidden absolute right-9 top-0 bottom-0 w-80 flex-col bg-muted paper border-l border-border z-20 overflow-y-auto">
          <InventoryWrapper onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
