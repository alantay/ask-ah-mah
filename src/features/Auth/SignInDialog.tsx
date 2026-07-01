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
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { GoogleIcon } from "./GoogleIcon";

export function SignInDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await authClient.signIn.social({ provider: "google", callbackURL: "/" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
        <Button
          onClick={handleGoogle}
          disabled={loading}
          variant="outline"
          className="w-full gap-3 font-medium"
        >
          <GoogleIcon className="size-[18px] shrink-0" />
          {loading ? "Redirecting…" : "Continue with Google"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
