import React from "react";

import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "default" | "warning" | "success";
};

export function Badge({ className, tone = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-transparent px-3 py-1 text-xs font-semibold tracking-wide",
        tone === "default" && "border-ink/10 bg-white/80 text-ink",
        tone === "warning" && "border-[#c58b3b]/30 bg-[#f7e6cf] text-[#8a5c1b]",
        tone === "success" && "border-[#1f7a66]/30 bg-[#e0f0ea] text-[#0f3d33]",
        className
      )}
      {...props}
    />
  );
}
