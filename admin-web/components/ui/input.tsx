import React from "react";

import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-ink/10 bg-white/80 px-3 py-2 text-sm outline-none transition focus:border-ink/30",
        className
      )}
      {...props}
    />
  );
}
