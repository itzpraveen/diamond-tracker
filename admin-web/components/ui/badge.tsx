import React from "react";

import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "default" | "warning" | "success";
};

export function Badge({ className, tone = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        tone === "default" && "bg-sand text-ink",
        tone === "warning" && "bg-amber/20 text-amber",
        tone === "success" && "bg-teal/20 text-teal",
        className
      )}
      {...props}
    />
  );
}
