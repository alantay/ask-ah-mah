"use client";
// PROTOTYPE — floating variant switcher. Hidden in production builds.

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

interface Props {
  variants: string[];
  names: Record<string, string>;
  current: string;
  onReset: () => void;
}

export function PrototypeSwitcher({ variants, names, current, onReset }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const go = (delta: number) => {
    const i = variants.indexOf(current);
    const next = variants[(i + delta + variants.length) % variants.length];
    const params = new URLSearchParams(searchParams.toString());
    params.set("variant", next);
    router.replace(`?${params.toString()}`, { scroll: false });
    onReset();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el instanceof HTMLElement && el.isContentEditable)
      )
        return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 rounded-full bg-neutral-900 text-white shadow-2xl px-2 py-1.5 font-sans text-xs">
      <button
        type="button"
        onClick={() => go(-1)}
        className="px-2 py-1 rounded-full hover:bg-white/15 cursor-pointer"
        aria-label="Previous variant"
      >
        ←
      </button>
      <span className="px-2 whitespace-nowrap font-semibold">
        {current} — {names[current]}
      </span>
      <button
        type="button"
        onClick={() => go(1)}
        className="px-2 py-1 rounded-full hover:bg-white/15 cursor-pointer"
        aria-label="Next variant"
      >
        →
      </button>
      <button
        type="button"
        onClick={onReset}
        className="ml-1 px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 cursor-pointer"
      >
        reset thread
      </button>
    </div>
  );
}
