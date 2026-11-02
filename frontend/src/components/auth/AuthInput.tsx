import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AuthInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon;
  error?: string;
  rightElement?: React.ReactNode;
  labelAction?: React.ReactNode;
}

export const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
  (
    {
      className,
      type = "text",
      label,
      icon: Icon,
      error,
      rightElement,
      labelAction,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `auth-input-${label.toLowerCase().replace(/\s+/g, "-")}`;

    return (
      <div className="w-full space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <label
            htmlFor={inputId}
            className="font-medium text-slate-700 dark:text-slate-300 select-none"
          >
            {label}
          </label>
          {labelAction}
        </div>

        <div className="relative flex items-center">
          {Icon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <Icon className="h-4 w-4" />
            </div>
          )}

          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              "w-full h-11 text-sm rounded-xl bg-white dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-200 dark:border-slate-800 transition-all duration-200 shadow-xs focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 focus:ring-2 focus:ring-slate-400/20 dark:focus:ring-slate-600/20 disabled:cursor-not-allowed disabled:opacity-50",
              Icon && "pl-10",
              rightElement ? "pr-11" : "pr-3.5",
              error &&
                "border-red-500/80 dark:border-red-500/80 focus:border-red-500 focus:ring-red-500/20 text-red-900 dark:text-red-200",
              className
            )}
            {...props}
          />

          {rightElement && (
            <div className="absolute right-2.5 flex items-center">
              {rightElement}
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs font-medium text-red-500 dark:text-red-400 animate-in fade-in duration-150">
            {error}
          </p>
        )}
      </div>
    );
  }
);

AuthInput.displayName = "AuthInput";

