import React from "react";

export function DoodleUnderline({ className = "w-full h-3 text-amber-400" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="none"
    >
      <path
        d="M2.5 7.5C45.2 2.8 112.5 1.5 197.5 9.5M12.5 9.8C62.5 6.2 135 4.8 185.5 10.2"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
