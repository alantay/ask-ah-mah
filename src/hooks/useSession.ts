"use client";
import { generateShortId } from "@/lib/inventory/utils";
import { useEffect, useState } from "react";

export default function useSession() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window === "undefined") {
      return;
    }

    let sessionId = localStorage.getItem("ask-ah-mah-session");
    if (!sessionId) {
      sessionId = generateShortId();
      localStorage.setItem("ask-ah-mah-session", sessionId);
    }
    setUserId(sessionId);
    setIsLoading(false);
  }, []);

  return { userId, isLoading };
}
