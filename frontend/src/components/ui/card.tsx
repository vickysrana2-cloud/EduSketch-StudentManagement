import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "blue" | "purple" | "pink" | "yellow" | "green" | "coral";
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default:
        "bg-white text-slate-900 dark:bg-[#141824] dark:text-slate-100",
      blue:
        "bg-[#EAF6FF] text-slate-900 dark:bg-[#112338] dark:text-slate-100",
      purple:
        "bg-[#F4EEFF] text-slate-900 dark:bg-[#231B3C] dark:text-slate-100",
      pink:
        "bg-[#FFF0F6] text-slate-900 dark:bg-[#361726] dark:text-slate-100",
      yellow:
        "bg-[#FFFBE5] text-slate-900 dark:bg-[#362E12] dark:text-slate-100",
      green:
        "bg-[#EFFFF7] text-slate-900 dark:bg-[#0F2D25] dark:text-slate-100",
      coral:
        "bg-[#FFF1E8] text-slate-900 dark:bg-[#3A1F1B] dark:text-slate-100",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-3xl sketch-shadow transition-all duration-300 hover:shadow-[7px_8px_0px_0px_var(--border-color)] hover:-translate-y-0.5",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-bold font-handwriting leading-none tracking-tight text-slate-900 dark:text-slate-100",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-slate-600 dark:text-slate-300 font-medium", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};

