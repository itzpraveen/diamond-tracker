import React from "react";

import { cn } from "@/lib/utils";

export function Table({
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-xl">
      <table className={cn("w-full text-sm", className)} {...props} />
    </div>
  );
}

export function THead({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        "bg-sand/40 text-left text-[10px] uppercase tracking-[0.2em] text-slate sm:text-[11px] sm:tracking-[0.24em]",
        className
      )}
      {...props}
    />
  );
}

export function TBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-ink/6", className)} {...props} />;
}

export function TR({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "transition-colors hover:bg-white/60",
        className
      )}
      {...props}
    />
  );
}

export function TH({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "whitespace-nowrap px-3 py-3 text-[10px] font-semibold first:pl-4 last:pr-4 sm:px-4 sm:text-[11px]",
        className
      )}
      {...props}
    />
  );
}

export function TD({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        "px-3 py-3 align-middle first:pl-4 last:pr-4 sm:px-4 sm:py-4",
        className
      )}
      {...props}
    />
  );
}

// Mobile-friendly card-based table alternative
type MobileTableCardProps = {
  children: React.ReactNode;
  className?: string;
};

export function MobileTableCard({ children, className }: MobileTableCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-ink/8 bg-white/90 p-4 shadow-[var(--shadow-sm)]",
        className
      )}
    >
      {children}
    </div>
  );
}

type MobileTableRowProps = {
  label: string;
  children: React.ReactNode;
  className?: string;
};

export function MobileTableRow({ label, children, className }: MobileTableRowProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 py-2", className)}>
      <span className="text-xs font-medium text-slate">{label}</span>
      <span className="text-right text-sm">{children}</span>
    </div>
  );
}
