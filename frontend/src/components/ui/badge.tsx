import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "secondary"
    | "success"
    | "warning"
    | "destructive"
    | "outline"
    | "blue"
    | "purple"
    | "pink"
    | "yellow"
    | "green"
    | "coral";
}

function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold font-handwriting transition-all duration-200 sketch-shadow-sm";

  const variants = {
    default:
      "bg-[#EAF6FF] text-[#4D9FFF] dark:bg-[#112338] dark:text-[#8DD8FF]",
    secondary:
      "bg-[#F4EEFF] text-[#8B6DFF] dark:bg-[#231B3C] dark:text-[#C5A7FF]",
    success:
      "bg-[#EFFFF7] text-[#48C78E] dark:bg-[#0F2D25] dark:text-[#8DE5C1]",
    warning:
      "bg-[#FFFBE5] text-[#FF9F43] dark:bg-[#362E12] dark:text-[#FFE27A]",
    destructive:
      "bg-[#FFF1E8] text-[#FF8066] dark:bg-[#3A1F1B] dark:text-[#FFC49B]",
    outline:
      "bg-slate-100 text-slate-800 dark:bg-[#1e2538] dark:text-slate-200",

    blue: "bg-[#EAF6FF] text-[#4D9FFF] dark:bg-[#112338] dark:text-[#8DD8FF]",
    purple: "bg-[#F4EEFF] text-[#8B6DFF] dark:bg-[#231B3C] dark:text-[#C5A7FF]",
    pink: "bg-[#FFF0F6] text-[#FF6FAE] dark:bg-[#361726] dark:text-[#FFB3D1]",
    yellow: "bg-[#FFFBE5] text-[#FFC83D] dark:bg-[#362E12] dark:text-[#FFE27A]",
    green: "bg-[#EFFFF7] text-[#48C78E] dark:bg-[#0F2D25] dark:text-[#8DE5C1]",
    coral: "bg-[#FFF1E8] text-[#FF8066] dark:bg-[#3A1F1B] dark:text-[#FFC49B]",
  };

  return (
    <div className={cn(baseStyles, variants[variant], className)} {...props} />
  );
}

export { Badge };

