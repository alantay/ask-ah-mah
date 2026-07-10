"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useSessionContext } from "@/contexts/SessionContext";

/**
 * Mints (or reuses) a recipe's public share token. Purely a data hook — the
 * consumer decides what to do with the resulting link (copy, native share,
 * per-channel deep link, etc).
 */
export function useRecipeShareLink(recipeId: string) {
  const { userId } = useSessionContext();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const mint = useCallback(async () => {
    if (!userId || token || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/recipe/${recipeId}/share`, { method: "POST" });
      if (!res.ok) throw new Error("share failed");
      const { token: mintedToken } = await res.json();
      setToken(mintedToken);
    } catch (err) {
      console.error("[useRecipeShareLink] mint error:", err);
      toast.error("Couldn't make a link. Try again?");
    } finally {
      setLoading(false);
    }
  }, [recipeId, userId, token, loading]);

  const url = token ? `${window.location.origin}/r/${token}` : null;

  return { url, token, loading, mint };
}
