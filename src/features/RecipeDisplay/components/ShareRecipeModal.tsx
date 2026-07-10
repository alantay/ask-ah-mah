"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRecipeShareLink } from "@/features/Recipe";
import type { RecipeWithId } from "@/lib/recipes/schemas";
import { cn } from "@/lib/utils";
import { Copy, Download, Mail, MessageSquare, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";
import { toast } from "sonner";

interface ShareRecipeModalProps {
  recipe: RecipeWithId;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function WhatsAppIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.87 9.87 0 0 0 12.04 2zm0 1.67c2.2 0 4.27.86 5.82 2.42a8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23zm-3.9 4.34c-.16 0-.42.06-.64.31-.22.25-.85.83-.85 2.02s.87 2.35.99 2.51c.12.16 1.71 2.61 4.14 3.66.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28-.24-.12-1.44-.71-1.66-.79-.22-.08-.38-.12-.55.12-.16.24-.63.79-.77.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.42-.55-.42h-.47z" />
    </svg>
  );
}

export function ShareRecipeModal({ recipe, open, onOpenChange }: ShareRecipeModalProps) {
  const { url, token, loading, mint } = useRecipeShareLink(recipe.id);

  useEffect(() => {
    if (open && !url) mint();
  }, [open, url, mint]);

  const canAct = !!url;
  const ogImageUrl =
    token && typeof window !== "undefined" ? `${window.location.origin}/r/${token}/opengraph-image` : undefined;

  const copyLink = () => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    toast.success("Link copied — send it to someone.");
  };

  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const chanClass =
    "flex flex-col items-center gap-2 group " + (canAct ? "cursor-pointer" : "pointer-events-none opacity-40");
  const tileClass =
    "w-full aspect-square rounded-[14px] bg-chat border border-border-soft shadow-[0_2px_0_var(--border)] flex items-center justify-center text-primary-deep group-hover:bg-muted/50 transition-colors";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] rounded-[22px] bg-card p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl">Pass this on</DialogTitle>
          <DialogDescription>Send a friend the recipe, exactly as you have it.</DialogDescription>
        </DialogHeader>

        <div className="rounded-[14px] overflow-hidden border border-border-soft bg-chat shadow-[0_6px_16px_-8px_rgba(60,40,20,0.35)]">
          <div className="h-[130px] relative overflow-hidden bg-primary-tint">
            {recipe.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={recipe.imageUrl} alt="" className="w-full h-full object-cover" />
            )}
            {recipe.totalTimeMinutes && (
              <span className="absolute left-3 top-3 font-sans text-[10px] font-bold tracking-wider uppercase text-white bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
                {recipe.totalTimeMinutes} min
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <span className="size-8 rounded-lg overflow-hidden shrink-0 bg-card border border-border-soft relative">
              <Image src="/granny-icon.png" alt="" fill className="object-contain" />
            </span>
            <div>
              <h4 className="font-display font-semibold text-base leading-tight m-0">{recipe.name}</h4>
              <p className="font-sans text-xs text-ink-faint m-0 mt-0.5">From Ah Mah</p>
            </div>
          </div>
        </div>

        <div className="flex items-center border border-border rounded-xl overflow-hidden bg-chat mt-4">
          <span className="flex-1 px-4 font-mono text-[13px] text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
            {url ?? (loading ? "Fetching your link…" : "—")}
          </span>
          <button
            onClick={copyLink}
            disabled={!canAct}
            className="inline-flex items-center gap-2 px-5 py-3 m-[5px] rounded-[9px] bg-primary-deep text-white font-sans text-[13.5px] font-semibold shadow-[0_2px_0_var(--primary-deeper)] whitespace-nowrap disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            <Copy size={15} />
            Copy link
          </button>
        </div>

        <div className="flex items-center gap-3.5 text-ink-faint font-sans text-[11px] font-semibold tracking-wider uppercase my-4 before:content-[''] before:flex-1 before:h-px before:border-t before:border-dashed before:border-border after:content-[''] after:flex-1 after:h-px after:border-t after:border-dashed after:border-border">
          or send via
        </div>

        <div className={cn("grid gap-3", canNativeShare ? "grid-cols-5" : "grid-cols-4")}>
          <a
            href={canAct ? `sms:?&body=${encodeURIComponent(url ?? "")}` : undefined}
            className={chanClass}
            aria-label="Share via Message"
          >
            <span className={tileClass}>
              <MessageSquare size={22} />
            </span>
            <span className="font-sans text-xs text-muted-foreground">Message</span>
          </a>

          <a
            href={canAct ? `mailto:?subject=${encodeURIComponent(recipe.name)}&body=${encodeURIComponent(url ?? "")}` : undefined}
            className={chanClass}
            aria-label="Share via Email"
          >
            <span className={tileClass}>
              <Mail size={22} />
            </span>
            <span className="font-sans text-xs text-muted-foreground">Email</span>
          </a>

          <a
            href={canAct ? `https://wa.me/?text=${encodeURIComponent(`${recipe.name} — ${url}`)}` : undefined}
            target="_blank"
            rel="noopener noreferrer"
            className={chanClass}
            aria-label="Share via WhatsApp"
          >
            <span className={tileClass}>
              <WhatsAppIcon size={22} />
            </span>
            <span className="font-sans text-xs text-muted-foreground">WhatsApp</span>
          </a>

          <a href={canAct ? ogImageUrl : undefined} download className={chanClass} aria-label="Save image">
            <span className={tileClass}>
              <Download size={22} />
            </span>
            <span className="font-sans text-xs text-muted-foreground">Save img</span>
          </a>

          {canNativeShare && (
            <button
              onClick={() => canAct && url && navigator.share({ title: recipe.name, url })}
              disabled={!canAct}
              className={chanClass}
              aria-label="More share options"
            >
              <span className={tileClass}>
                <MoreHorizontal size={22} />
              </span>
              <span className="font-sans text-xs text-muted-foreground">More</span>
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
