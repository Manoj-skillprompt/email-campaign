import { type InputHTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-md border border-border bg-white px-4 py-[10px] text-sm text-foreground placeholder:text-foreground-subtle",
          "focus:outline-none focus:ring-2 focus:ring-primary/40",
          "aria-invalid:border-red-500",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
