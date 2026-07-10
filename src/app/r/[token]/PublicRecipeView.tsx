"use client";

import { Button } from "@/components/ui/button";
import RecipeDisplay from "@/features/RecipeDisplay/RecipeDisplay";
import { Eyebrow } from "@/features/shared/components/recipe";
import { RecipeWithId } from "@/lib/recipes/schemas";
import Image from "next/image";
import Link from "next/link";

// Client wrapper for a shared recipe link. RecipeDisplay needs an `onBack`
// callback (can't cross the server boundary as a prop), so it's supplied here
// as a no-op — read-only mode hides the Back button anyway.
//
// No app chrome up top: the recipe photo leads, so a shared link reads like a
// recipe someone passed you rather than a web app. Brand + the way into the app
// live in one deliberate closing band after the recipe (`InvitationBand`).
export function PublicRecipeView({ recipe }: { recipe: RecipeWithId }) {
  return (
    <div className="h-dvh overflow-hidden">
      <RecipeDisplay
        recipe={recipe}
        onBack={() => {}}
        readOnly
        footerSlot={<InvitationBand />}
      />
    </div>
  );
}

// The signature moment: a note in Ah Mah's voice, passed along with the recipe.
// It carries brand identity, orientation for a cold visitor, and the single CTA
// into the app — reached right when the reader has finished the recipe.
function InvitationBand() {
  return (
    <section className="paper mt-6 rounded-xl border border-border bg-primary-tint px-5 py-8 sm:px-8 sm:py-9 text-center">
      <div className="relative mx-auto mb-3 h-12 w-12">
        <Image src="/granny-icon.png" alt="" fill className="object-contain" />
      </div>
      <Eyebrow className="block mb-2">From Ah Mah</Eyebrow>
      <h2 className="font-display font-semibold text-heading text-foreground">
        Your turn at the stove
      </h2>
      <p className="mx-auto mt-2 max-w-sm font-display italic text-emphasis text-muted-foreground">
        This recipe came out of a chat with Ah Mah. Tell her what&apos;s in your
        kitchen and she&apos;ll cook up one for you.
      </p>
      <Button
        asChild
        variant="cta"
        className="mt-5 inline-flex gap-2 px-5 py-2.5 text-sm font-semibold"
      >
        <Link href="/">
          Cook with what you have
          <span aria-hidden>→</span>
        </Link>
      </Button>
    </section>
  );
}
