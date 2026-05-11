"use client";

import { authClient } from "@/lib/auth-client";
import { useSessionContext } from "@/contexts/SessionContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SignInDialog } from "./SignInDialog";
import { toast } from "sonner";

export function AuthButton() {
  const { isAuthenticated, user } = useSessionContext();

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      toast.success("Signed out");
      window.location.reload();
    } catch (error) {
      console.error("Sign out failed:", error);
      toast.error("Failed to sign out. Please try again.");
    }
  };

  if (!isAuthenticated) {
    return <SignInDialog />;
  }

  const initial = (user?.name?.[0] ?? user?.email?.[0] ?? "?").toUpperCase();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="cursor-pointer hover:opacity-80 transition-opacity" aria-label="Account menu">
          <Avatar className="size-7">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
              {initial}
            </AvatarFallback>
          </Avatar>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto min-w-[120px] p-1">
        <button
          onClick={handleSignOut}
          className="w-full text-left px-3 py-1.5 text-sm text-foreground hover:bg-muted rounded-sm transition-colors cursor-pointer"
        >
          Sign out
        </button>
      </PopoverContent>
    </Popover>
  );
}
