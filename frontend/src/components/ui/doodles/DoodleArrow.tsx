import React from "react";

export function DoodleArrow({ className = "w-8 h-8 text-slate-700 dark:text-slate-300" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 50 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M5 25C18 12 32 18 42 22M42 22C36 17 32 12 30 8M42 22C37 26 34 32 32 38"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
