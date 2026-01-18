import React from "react";

import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        // Size variants
        size === "sm" && "px-3 py-1.5 text-xs",
        size === "md" && "px-4 py-2.5 text-sm",
        size === "lg" && "px-6 py-3 text-base",
        // Color variants
        variant === "primary" &&
          "bg-forest text-white shadow-[0_8px_20px_rgba(15,61,51,0.2)] hover:bg-pine hover:shadow-[0_12px_28px_rgba(15,61,51,0.25)]",
        variant === "ghost" &&
          "bg-transparent text-ink hover:bg-ink/5",
        variant === "outline" &&
          "border border-ink/12 bg-white/70 text-ink shadow-[0_2px_8px_rgba(15,23,20,0.04)] hover:border-ink/20 hover:bg-white hover:shadow-[0_4px_12px_rgba(15,23,20,0.06)]",
        variant === "danger" &&
          "bg-red-600 text-white shadow-[0_8px_20px_rgba(220,38,38,0.2)] hover:bg-red-700 hover:shadow-[0_12px_28px_rgba(220,38,38,0.25)]",
        className
      )}
      {...props}
    />
  );
}
