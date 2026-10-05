import React from "react";

export function DoodleCircle({ className = "w-10 h-10 text-emerald-500" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M30 6C45 5 54 18 53 32C52 46 39 55 25 54C11 53 5 39 7 24C9 9 24 6 42 7"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
