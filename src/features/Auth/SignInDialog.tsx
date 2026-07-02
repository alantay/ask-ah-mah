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
import { useState } from "react";
import { GoogleIcon } from "./GoogleIcon";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignInDialog() {
  const [open, setOpen] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const emailValid = EMAIL_PATTERN.test(email.trim());
  const busy = googleLoading || sending;

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await authClient.signIn.social({ provider: "google", callbackURL: "/" });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmailSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!emailValid || sending) return;

    const address = email.trim();
    setSending(true);
    setError(null);
    try {
      const { error: sendError } = await authClient.signIn.magicLink({
        email: address,
        callbackURL: "/",
      });
      if (sendError) throw sendError;
      setSentTo(address);
    } catch {
      setError("Couldn't send the link — please try again.");
    } finally {
      setSending(false);
    }
  };

  // Reset the transient form state whenever the dialog closes so it reopens
  // clean (no stale "check your inbox" or error from a previous attempt).
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setEmail("");
      setSentTo(null);
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-foreground bg-card border border-border rounded-lg shadow-[0_1px_0_var(--border-soft)] hover:bg-background transition-colors cursor-pointer">
          Sign in
        </button>
      </DialogTrigger>
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
            <p>
              Check your inbox — we sent a sign-in link to{" "}
              <span className="font-semibold">{sentTo}</span>. It expires in 10
              minutes.
            </p>
            <button
              type="button"
              onClick={() => {
                setSentTo(null);
                setError(null);
              }}
              className="self-start text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors cursor-pointer"
            >
              Use a different email
            </button>
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
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
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
