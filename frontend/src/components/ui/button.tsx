import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "blue"
    | "purple"
    | "pink"
    | "yellow"
    | "green"
    | "coral";
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
      "inline-flex items-center justify-center rounded-xl font-bold font-sans transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:translate-y-0.5 sketch-shadow-sm hover:-translate-y-0.5";

    const variants = {
      default:
        "bg-[#4D9FFF] text-white hover:bg-[#3B8EEB] dark:bg-[#4D9FFF] dark:text-white shadow-[0_4px_12px_rgba(77,159,255,0.3)]",
      destructive:
        "bg-[#FF8066] text-white hover:bg-[#E56C53] dark:bg-[#FF8066] dark:text-white shadow-[0_4px_12px_rgba(255,128,102,0.3)]",
      outline:
        "bg-slate-100 text-slate-800 hover:bg-[#EAF6FF] dark:bg-[#1e2538] dark:text-white dark:hover:bg-[#252f48]",
      secondary:
        "bg-[#F4EEFF] text-[#8B6DFF] hover:bg-[#EAE0FF] dark:bg-[#231B3C] dark:text-[#C5A7FF]",
      ghost:
        "sketch-shadow-none hover:bg-[#EAF6FF] dark:hover:bg-[#112338] text-slate-700 dark:text-slate-200",
      link: "sketch-shadow-none text-[#4D9FFF] underline-offset-4 hover:underline dark:text-[#8DD8FF]",
      
      // Dedicated Vibrant Children Colors
      blue:
        "bg-[#4D9FFF] text-white hover:bg-[#3B8EEB] shadow-[0_4px_12px_rgba(77,159,255,0.35)]",
      purple:
        "bg-[#8B6DFF] text-white hover:bg-[#7859F5] shadow-[0_4px_12px_rgba(139,109,255,0.35)]",
      pink:
        "bg-[#FF6FAE] text-white hover:bg-[#ED599B] shadow-[0_4px_12px_rgba(255,111,174,0.35)]",
      yellow:
        "bg-[#FFC83D] text-slate-900 hover:bg-[#EBB429] shadow-[0_4px_12px_rgba(255,200,61,0.35)]",
      green:
        "bg-[#48C78E] text-white hover:bg-[#36B27B] shadow-[0_4px_12px_rgba(72,199,142,0.35)]",
      coral:
        "bg-[#FF8066] text-white hover:bg-[#E66B51] shadow-[0_4px_12px_rgba(255,128,102,0.35)]",
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

