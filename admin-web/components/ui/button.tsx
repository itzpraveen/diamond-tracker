import React from "react";

import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition",
        variant === "primary" && "bg-ink text-white hover:bg-teal",
        variant === "ghost" && "bg-transparent text-ink hover:bg-sand",
        variant === "outline" && "border border-ink/10 text-ink hover:border-ink/30",
        className
      )}
      {...props}
    />
  );
}
