import React from "react";

export function DoodleSpark({ className = "w-6 h-6 text-yellow-500" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 30 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M15 2V28M2 15H28M6 6L24 24M24 6L6 24"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
