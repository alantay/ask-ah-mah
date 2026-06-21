import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge about our custom named font-size tokens (see the
// `@theme` scale in globals.css). Without this, tailwind-merge treats e.g.
// `text-dense` as an unknown `text-*` class and lets it collide with text
// COLOR classes like `text-white` — silently dropping the colour when both
// appear in one `cn()` call (e.g. a `cta` Button given a `text-dense`
// className). Registering them as font-size classes keeps colour and size
// independent while still letting two sizes override each other.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        { text: ["eyebrow", "micro", "dense", "emphasis", "heading", "display"] },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function upperCaseFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function generateShortId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

export const fetcher = async (...args: Parameters<typeof fetch>) => {
  const response = await fetch(...args);
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const payload = await response.json();
      if (payload && typeof payload.error === "string") message = payload.error;
    } catch { /* non-JSON error body */ }
    throw new Error(message);
  }
  return response.json();
};
