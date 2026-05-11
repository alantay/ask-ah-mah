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
        <Button
          onClick={handleGoogle}
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          {loading ? "Redirecting…" : "Continue with Google"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
