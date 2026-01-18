import React from "react";

import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
};

export function Input({ className, error, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border bg-white/90 px-4 py-2.5 text-sm outline-none transition-all placeholder:text-slate/60",
        "focus:ring-2 focus:ring-offset-0",
        error
          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
          : "border-ink/10 focus:border-ink/20 focus:ring-gold/20",
        "disabled:cursor-not-allowed disabled:bg-sand/50 disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: boolean;
};

export function Textarea({ className, error, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border bg-white/90 px-4 py-2.5 text-sm outline-none transition-all placeholder:text-slate/60",
        "focus:ring-2 focus:ring-offset-0",
        "resize-none",
        error
          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
          : "border-ink/10 focus:border-ink/20 focus:ring-gold/20",
        "disabled:cursor-not-allowed disabled:bg-sand/50 disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  error?: boolean;
};

export function Select({ className, error, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "w-full appearance-none rounded-xl border bg-white/90 px-4 py-2.5 pr-10 text-sm outline-none transition-all",
        "focus:ring-2 focus:ring-offset-0",
        "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%235a6b63%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat",
        error
          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
          : "border-ink/10 focus:border-ink/20 focus:ring-gold/20",
        "disabled:cursor-not-allowed disabled:bg-sand/50 disabled:opacity-60",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
