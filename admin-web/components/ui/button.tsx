import React from "react";

import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" &&
          "bg-forest text-white shadow-[0_14px_30px_rgba(15,61,51,0.25)] hover:bg-pine hover:shadow-[0_18px_40px_rgba(15,61,51,0.3)]",
        variant === "ghost" && "bg-transparent text-ink hover:bg-black/5",
        variant === "outline" &&
          "border border-ink/15 bg-white/70 text-ink hover:border-ink/30 hover:bg-white",
        className
      )}
      {...props}
    />
  );
}
