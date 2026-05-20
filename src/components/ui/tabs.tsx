"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-0", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "relative z-10 flex items-baseline gap-5",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  children,
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "group relative font-display italic text-[15px] tracking-[-0.005em] font-medium cursor-pointer whitespace-nowrap pb-1.5",
        "text-ink-faint hover:text-foreground transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:text-primary-ink data-[state=active]:font-semibold",
        className
      )}
      {...props}
    >
      {children}
      {/* pen-squiggle underline — visible only when active */}
      <svg
        aria-hidden="true"
        viewBox="0 0 80 6"
        preserveAspectRatio="none"
        className="absolute left-0 right-0 -bottom-0.5 w-full h-[6px] text-primary opacity-0 group-data-[state=active]:opacity-80 transition-opacity"
      >
        <path
          d="M2 4 Q20 0, 40 3 T78 3"
          stroke="currentColor"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </TabsPrimitive.Trigger>
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
