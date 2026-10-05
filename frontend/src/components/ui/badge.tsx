import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "destructive" | "outline";
}

function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold font-handwriting transition-colors border-[3px] border-black dark:border-white sketch-shadow-sm";

  const variants = {
    default:
      "bg-black text-white dark:bg-white dark:text-black",
    secondary:
      "bg-white text-black dark:bg-black dark:text-white",
    success:
      "bg-white text-black dark:bg-black dark:text-white",
    warning:
      "bg-white text-black dark:bg-black dark:text-white",
    destructive:
      "bg-black text-white dark:bg-white dark:text-black",
    outline: "bg-white text-black dark:bg-black dark:text-white",
  };

  return (
    <div className={cn(baseStyles, variants[variant], className)} {...props} />
  );
}

export { Badge };
