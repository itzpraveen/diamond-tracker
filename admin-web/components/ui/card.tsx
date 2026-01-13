import React from "react";

import { cn } from "@/lib/utils";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow)] backdrop-blur",
        className
      )}
      {...props}
    />
  );
}
