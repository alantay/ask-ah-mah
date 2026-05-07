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
      <div
        className="hidden lg:flex flex-col items-center justify-start pt-3.5 w-9 shrink-0 bg-muted paper border-l border-border relative"
        style={{ cursor: open ? "default" : "pointer" }}
        onClick={() => setOpen(!open)}
      >
        <span
          className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-ink-faint select-none"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          Pantry · {count} ›
        </span>
      </div>

      {/* Open overlay — absolute over chat */}
      {open && (
        <div className="hidden lg:flex absolute right-9 top-0 bottom-0 w-80 flex-col bg-muted paper border-l border-border z-20 overflow-y-auto">
          <InventoryWrapper onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
