import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-bold font-handwriting text-slate-900 dark:text-slate-100"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            "flex h-11 w-full rounded-xl border-[3px] border-black bg-white px-4 py-2 text-sm font-medium text-black placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black sketch-shadow-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-white dark:bg-black dark:text-white dark:placeholder:text-slate-400 dark:focus-visible:ring-white",
            error && "border-red-600 focus-visible:ring-red-600 dark:border-red-400",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-xs font-bold text-red-600 dark:text-red-400 mt-1">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
