import { forwardRef, type HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  padding?: "none" | "sm" | "md";
}

const PADDING_CLASSES: Record<NonNullable<CardProps["padding"]>, string> = {
  none: "",
  sm: "p-3",
  md: "p-4",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { interactive, padding = "md", className, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-border bg-surface shadow-sm",
        PADDING_CLASSES[padding],
        interactive &&
          "outline-none transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-accent",
        className
      )}
      {...props}
    />
  );
});
