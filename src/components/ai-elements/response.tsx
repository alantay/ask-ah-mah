"use client";

import { cn } from "@/lib/utils";
import { type ComponentProps, memo } from "react";
import { Streamdown } from "streamdown";

type ResponseProps = ComponentProps<typeof Streamdown>;

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
        "[&_code]:font-mono [&_code]:not-italic [&_code]:text-[13px] [&_code]:bg-card [&_code]:border [&_code]:border-border [&_code]:rounded [&_code]:px-1",
        className
      )}
      {...props}
    />
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Response.displayName = "Response";
