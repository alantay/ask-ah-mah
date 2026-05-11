"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { toast } from "sonner";

export function SignInDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState<"google" | "email" | null>(null);

  const handleGoogle = async () => {
    setLoading("google");
    try {
      await authClient.signIn.social({ provider: "google", callbackURL: "/" });
    } finally {
      setLoading(null);
    }
  };

  const handleMagicLink = async () => {
    if (!email.trim()) return;
    setLoading("email");
    const { error } = await authClient.signIn.magicLink({
      email: email.trim(),
      callbackURL: "/",
    });
    setLoading(null);
    if (error) {
      toast.error("Couldn't send the link — try again");
    } else {
      setEmailSent(true);
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setEmail("");
      setEmailSent(false);
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-foreground bg-card border border-border rounded-lg shadow-[0_1px_0_oklch(0.82_0.04_70)] hover:bg-background transition-colors cursor-pointer">
          Sign in
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign in to Ask Ah Mah</DialogTitle>
          <DialogDescription>
            Your kitchen stays with you across devices.
          </DialogDescription>
        </DialogHeader>
        {emailSent ? (
          <p className="text-sm text-muted-foreground">
            Check your email — we sent a sign-in link to <strong>{email}</strong>.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleGoogle}
              disabled={!!loading}
              variant="outline"
              className="w-full"
            >
              {loading === "google" ? "Redirecting…" : "Continue with Google"}
            </Button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex-1 border-t border-border" />
              or
              <span className="flex-1 border-t border-border" />
            </div>
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleMagicLink();
              }}
              disabled={!!loading}
            />
            <Button
              onClick={handleMagicLink}
              disabled={!!loading || !email.trim()}
              className="w-full"
            >
              {loading === "email" ? "Sending…" : "Email me a sign-in link"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
