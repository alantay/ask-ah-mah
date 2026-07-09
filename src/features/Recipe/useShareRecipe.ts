"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useSessionContext } from "@/contexts/SessionContext";

/**
 * Mints (or reuses) a recipe's public share token, then hands the link to the
 * native share sheet (mobile — opens straight into WhatsApp/Telegram) or
 * copies it to the clipboard (desktop, or no navigator.share support).
 */
export function useShareRecipe(recipeId: string, recipeTitle?: string) {
  const { userId } = useSessionContext();
  const [sharing, setSharing] = useState(false);

  const share = useCallback(async () => {
    if (!userId || sharing) return;
    setSharing(true);
    try {
      const res = await fetch(`/api/recipe/${recipeId}/share`, { method: "POST" });
      if (!res.ok) throw new Error("share failed");
      const { token } = await res.json();
      const url = `${window.location.origin}/r/${token}`;

      if (typeof navigator.share === "function") {
        await navigator.share({ title: recipeTitle, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied — send it to someone.");
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("[useShareRecipe] share error:", err);
      toast.error("Couldn't make a link. Try again?");
    } finally {
      setSharing(false);
    }
  }, [recipeId, recipeTitle, userId, sharing]);

  return { share, sharing };
}
