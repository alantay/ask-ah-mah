const PREFIX = "askahmah:signin-nudge:";

export type SignInNudgeKey = "first-save" | "finish-moment";

/** Has this guest-only sign-in nudge already been shown once on this browser? */
export function hasSeenSignInNudge(key: SignInNudgeKey): boolean {
  try {
    return window.localStorage.getItem(PREFIX + key) === "1";
  } catch {
    return false;
  }
}

/** Marks a sign-in nudge as shown so it never fires again on this browser. */
export function markSignInNudgeSeen(key: SignInNudgeKey): void {
  try {
    window.localStorage.setItem(PREFIX + key, "1");
  } catch {
    // Non-fatal: private mode etc. — the nudge just may show again later.
  }
}
