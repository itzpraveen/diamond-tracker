import React from "react";

import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "warning" | "success" | "danger" | "info";
  size?: "sm" | "md";
};

export function Badge({
  className,
  variant = "default",
  size = "md",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        // Sizes
        size === "sm" && "px-2 py-0.5 text-[10px]",
        size === "md" && "px-2.5 py-1 text-xs",
        // Variants
        variant === "default" &&
          "border border-ink/10 bg-white/90 text-ink",
        variant === "warning" &&
          "border border-amber-200 bg-amber-50 text-amber-700",
        variant === "success" &&
          "border border-emerald-200 bg-emerald-50 text-emerald-700",
        variant === "danger" &&
          "border border-red-200 bg-red-50 text-red-700",
        variant === "info" &&
          "border border-sky-200 bg-sky-50 text-sky-700",
        className
      )}
      {...props}
    />
  );
}

// Status-specific badge with automatic coloring
type StatusBadgeProps = {
  status: string;
  className?: string;
  size?: "sm" | "md";
};

const statusVariants: Record<string, BadgeProps["variant"]> = {
  PURCHASED: "info",
  PACKED_READY: "info",
  DISPATCHED_TO_FACTORY: "warning",
  RECEIVED_AT_FACTORY: "warning",
  RETURNED_FROM_FACTORY: "info",
  RECEIVED_AT_SHOP: "info",
  ADDED_TO_STOCK: "success",
  HANDED_TO_DELIVERY: "warning",
  DELIVERED_TO_CUSTOMER: "success",
  ON_HOLD: "danger",
  CANCELLED: "danger",
  CREATED: "default",
  DISPATCHED: "warning",
  CLOSED: "success"
};

export function StatusBadge({ status, className, size }: StatusBadgeProps) {
  const variant = statusVariants[status] || "default";
  const label = status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <Badge variant={variant} size={size} className={className}>
      {label}
    </Badge>
  );
}
