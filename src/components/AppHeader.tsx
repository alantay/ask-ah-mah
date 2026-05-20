"use client";

import AboutPopOver from "@/components/AboutPopOver";
import { AuthButton } from "@/features/Auth";
import Image from "next/image";
import type { ReactNode } from "react";

interface AppHeaderProps {
  tabs?: ReactNode;
}

export function AppHeader({ tabs }: AppHeaderProps) {
  return (
    <div className="pb-2 pt-2 border-b xl:container mx-auto px-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <h1 className="text-xl md:text-2xl font-bold font-logo flex items-center gap-2 text-primary shrink-0">
          <div className="relative w-8 h-8 md:w-9 md:h-9">
            <Image
              src="/granny-icon.png"
              alt="Ask Ah Mah"
              fill
              className="object-contain"
            />
          </div>
          Ask Ah Mah
        </h1>

        {tabs && (
          <>
            <div className="w-px h-[18px] bg-border shrink-0" />
            {tabs}
          </>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <AboutPopOver className="hidden lg:flex" />
        <AuthButton />
      </div>
    </div>
  );
}
