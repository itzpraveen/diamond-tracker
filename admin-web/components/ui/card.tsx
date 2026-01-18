import React from "react";

import { cn } from "@/lib/utils";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "elevated" | "outlined";
  padding?: "none" | "sm" | "md" | "lg";
};

export function Card({
  className,
  variant = "default",
  padding = "md",
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] transition-shadow",
        // Variants
        variant === "default" &&
          "border border-ink/8 bg-white/92 shadow-[var(--shadow)] backdrop-blur",
        variant === "elevated" &&
          "border border-ink/6 bg-white/95 shadow-[var(--shadow-lg)] backdrop-blur",
        variant === "outlined" &&
          "border border-ink/12 bg-white/80",
        // Padding
        padding === "none" && "p-0",
        padding === "sm" && "p-4",
        padding === "md" && "p-5 sm:p-6",
        padding === "lg" && "p-6 sm:p-8",
        className
      )}
      {...props}
    />
  );
}

type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>;

export function CardHeader({ className, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn("mb-4 space-y-1", className)}
      {...props}
    />
  );
}

type CardTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

export function CardTitle({ className, ...props }: CardTitleProps) {
  return (
    <h3
      className={cn("text-lg font-semibold font-display sm:text-xl", className)}
      {...props}
    />
  );
}

type CardDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

export function CardDescription({ className, ...props }: CardDescriptionProps) {
  return (
    <p
      className={cn("text-sm text-slate", className)}
      {...props}
    />
  );
}

type CardLabelProps = React.HTMLAttributes<HTMLParagraphElement>;

export function CardLabel({ className, ...props }: CardLabelProps) {
  return (
    <p
      className={cn("text-[10px] uppercase tracking-[0.3em] text-slate sm:text-xs", className)}
      {...props}
    />
  );
}
