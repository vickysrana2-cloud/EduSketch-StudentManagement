import React from "react";

export function DoodleStar({ className = "w-6 h-6 text-amber-500" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M20 3L24.5 14.5L37 16L27.5 24L30.5 36.5L20 30L9.5 36.5L12.5 24L3 16L15.5 14.5L20 3Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
