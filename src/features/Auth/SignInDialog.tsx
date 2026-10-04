"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { useRef, useState } from "react";
import { GoogleIcon } from "./GoogleIcon";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SENT_ACTION_CLASS =
  "min-h-11 text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

interface SignInDialogProps {
  // Uncontrolled by default (renders its own trigger button). Pass both to
  // drive the dialog externally (e.g. from a toast action) — the component
  // then skips rendering its own trigger.
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/** Sign-in dialog offering Google OAuth or passwordless email (magic link). */
export function SignInDialog({ open: openProp, onOpenChange: onOpenChangeProp }: SignInDialogProps = {}) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = onOpenChangeProp ?? setOpenState;
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Bumped when the sent view is left, so a send still in flight can't
  // update the state that replaced it.
  const sendAttempt = useRef(0);

  const emailValid = EMAIL_PATTERN.test(email.trim());
  const busy = googleLoading || sending;

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const { error: signInError } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });
      if (signInError) {
        setError("Aiyah, Google didn't let you in — try again?");
      }
    } catch {
      setError("Aiyah, Google didn't let you in — try again?");
    } finally {
      setGoogleLoading(false);
    }
  };

  const sendLink = async (address: string) => {
    const attempt = ++sendAttempt.current;
    setSending(true);
    setError(null);
    try {
      const { error: sendError } = await authClient.signIn.magicLink({
        email: address,
        callbackURL: "/",
      });
      if (sendError) throw sendError;
      return attempt === sendAttempt.current;
    } catch {
      if (attempt === sendAttempt.current) setError("Couldn't send the link — please try again.");
      return false;
    } finally {
      setSending(false);
    }
  };

  const handleEmailSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!emailValid || sending) return;

    const address = email.trim();
    if (await sendLink(address)) setSentTo(address);
  };

  const handleResend = async () => {
    if (!sentTo || sending) return;
    setResent(false);
    if (await sendLink(sentTo)) setResent(true);
  };

  // Reset the transient form state whenever the dialog closes so it reopens
  // clean (no stale "check your inbox" or error from a previous attempt).
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      sendAttempt.current++;
      setEmail("");
      setSentTo(null);
      setResent(false);
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {openProp === undefined && (
        <DialogTrigger asChild>
          <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-foreground bg-card border border-border rounded-lg shadow-[0_1px_0_var(--border-soft)] hover:bg-background transition-colors cursor-pointer">
            Sign in
          </button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display tracking-tight">
            Welcome to Ah Mah&rsquo;s kitchen
          </DialogTitle>
          <DialogDescription className="font-display italic">
            Your kitchen stays with you across devices.
          </DialogDescription>
        </DialogHeader>

        {sentTo ? (
          <div className="flex flex-col gap-3 text-sm">
            <p role="status">
              {resent ? "Sent a fresh link to " : "Check your inbox — we sent a sign-in link to "}
              <span className="font-semibold">{sentTo}</span>. It expires in 10
              minutes.
            </p>
            {error && (
              <p role="alert" className="text-destructive">
                {error}
              </p>
            )}
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              <button
                type="button"
                onClick={handleResend}
                disabled={sending}
                className={SENT_ACTION_CLASS}
              >
                {sending ? "Sending…" : "Resend link"}
              </button>
              <button
                type="button"
                onClick={() => {
                  sendAttempt.current++;
                  setSentTo(null);
                  setResent(false);
                  setError(null);
                }}
                className={SENT_ACTION_CLASS}
              >
                Use a different email
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Button
              onClick={handleGoogle}
              disabled={busy}
              variant="outline"
              className="w-full gap-3 font-medium"
            >
              <GoogleIcon className="size-[18px] shrink-0" />
              {googleLoading ? "Redirecting…" : "Continue with Google"}
            </Button>

            {error && (
              <p role="alert" id="signin-error" className="text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-2">
              <Label htmlFor="signin-email">Email</Label>
              <Input
                id="signin-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (error) setError(null);
                }}
                disabled={sending}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "signin-error" : undefined}
              />
              <Button
                type="submit"
                disabled={!emailValid || busy}
                variant="outline"
                className="w-full font-medium"
              >
                {sending ? "Sending…" : "Send me a link"}
              </Button>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
