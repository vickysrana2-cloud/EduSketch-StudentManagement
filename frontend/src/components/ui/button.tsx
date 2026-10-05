import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      isLoading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-xl font-bold font-sans transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:translate-y-0.5 border-[3px] border-black dark:border-white sketch-shadow-sm";

    const variants = {
      default:
        "bg-black text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-200",
      destructive:
        "bg-black text-white hover:bg-slate-900 dark:bg-white dark:text-black",
      outline:
        "bg-white text-black hover:bg-slate-100 dark:bg-black dark:text-white dark:hover:bg-slate-900",
      secondary:
        "bg-slate-200 text-black hover:bg-slate-300 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700",
      ghost:
        "border-transparent sketch-shadow-none hover:bg-slate-200 dark:hover:bg-slate-800 text-black dark:text-white",
      link: "border-transparent sketch-shadow-none text-black underline-offset-4 hover:underline dark:text-white",
    };

    const sizes = {
      default: "h-11 px-5 py-2.5 text-sm",
      sm: "h-9 rounded-lg px-3 text-xs",
      lg: "h-12 rounded-2xl px-7 text-base",
      icon: "h-10 w-10 p-0",
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="h-4 w-4 animate-spin text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {children}
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
