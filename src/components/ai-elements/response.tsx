"use client";

import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { memo } from "react";
import type { StreamdownProps } from "streamdown";

// Deferred: streamdown pulls in katex (~253 kB parsed, ADR-0019) that Ah Mah's
// chat never needs on first paint, so load it after the shell renders instead
// of shipping it in the initial bundle.
const Streamdown = dynamic(() => import("@/lib/markdown/streamdownLoader"));

type ResponseProps = StreamdownProps;

export const Response = memo(
  ({ className, ...props }: ResponseProps) => (
    <Streamdown
      className={cn(
        "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
"[&_p+p]:mt-[0.65em]",
        "[&_ul]:pl-5 [&_ul]:mt-2 [&_ul]:mb-1 [&_li]:mb-1",
        "[&_ol]:pl-5 [&_ol]:mt-2 [&_ol]:mb-1",
        "[&_em]:italic [&_em]:font-display",
        "[&_strong]:font-semibold [&_strong]:not-italic",
        "[&_code]:font-mono [&_code]:not-italic [&_code]:text-dense [&_code]:bg-card [&_code]:border [&_code]:border-border [&_code]:rounded [&_code]:px-1",
        className
      )}
      {...props}
    />
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Response.displayName = "Response";
