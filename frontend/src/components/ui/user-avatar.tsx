"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface UserAvatarProps {
  src?: string | null;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "custom";
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
  shape?: "circle" | "rounded-xl" | "rounded-2xl" | "rounded-3xl";
  variant?: "indigo" | "purple" | "blue" | "emerald" | "amber" | "slate";
}

const SIZE_STYLES: Record<string, string> = {
  xs: "h-7 w-7 text-[11px]",
  sm: "h-9 w-9 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-xl",
  "2xl": "h-24 w-24 text-3xl",
  custom: "",
};

const SHAPE_STYLES: Record<string, string> = {
  circle: "rounded-full",
  "rounded-xl": "rounded-xl",
  "rounded-2xl": "rounded-2xl",
  "rounded-3xl": "rounded-3xl",
};

const VARIANT_GRADIENTS: Record<string, string> = {
  indigo: "from-blue-600 to-indigo-600 text-white",
  purple: "from-purple-600 to-indigo-600 text-white",
  blue: "from-blue-500 to-cyan-600 text-white",
  emerald: "from-emerald-500 to-teal-600 text-white",
  amber: "from-amber-500 to-orange-600 text-white",
  slate: "from-slate-600 to-slate-800 text-white",
};

export function UserAvatar({
  src,
  name,
  size = "md",
  className,
  imageClassName,
  fallbackClassName,
  shape = "circle",
  variant = "indigo",
}: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);

  // Reset error state when the src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const initials = React.useMemo(() => {
    if (!name || !name.trim()) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }, [name]);

  const sizeStyle = SIZE_STYLES[size] || SIZE_STYLES.md;
  const shapeStyle = SHAPE_STYLES[shape] || SHAPE_STYLES.circle;
  const gradientStyle = VARIANT_GRADIENTS[variant] || VARIANT_GRADIENTS.indigo;

  const validSrc = typeof src === "string" && src.trim().length > 0 ? src.trim() : null;

  if (validSrc && !hasError) {
    return (
      <img
        src={validSrc}
        alt={name || "User Avatar"}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className={cn(
          "object-cover shrink-0 select-none",
          sizeStyle,
          shapeStyle,
          className,
          imageClassName
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "shrink-0 select-none bg-gradient-to-tr flex items-center justify-center font-bold shadow-xs",
        sizeStyle,
        shapeStyle,
        gradientStyle,
        className,
        fallbackClassName
      )}
      aria-label={name || "User Avatar"}
    >
      {initials}
    </div>
  );
}

