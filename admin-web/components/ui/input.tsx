import React from "react";

import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full rounded-2xl border border-ink/10 bg-white/90 px-4 py-2.5 text-sm outline-none transition placeholder:text-slate/70 focus:border-ink/30 focus:ring-2 focus:ring-gold/30",
        className
      )}
      {...props}
    />
  );
}
