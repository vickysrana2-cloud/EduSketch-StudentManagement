"use client";

import React from "react";
import { ShieldCheck, GraduationCap, BookOpen, Crown, Check } from "lucide-react";
import { Role } from "@/types";
import { cn } from "@/lib/utils";

export interface RoleOption {
  id: Role;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badgeClass: string;
  selectedBgClass: string;
  selectedBorderClass: string;
  iconColorClass: string;
  iconBgClass: string;
  checkBgClass: string;
}

export const ROLE_OPTIONS: RoleOption[] = [
  {
    id: "ADMIN",
    name: "Admin",
    description: "Manage institution operations.",
    icon: ShieldCheck,
    accentColor: "#2563EB",
    badgeClass: "text-blue-700 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-300",
    selectedBgClass: "bg-blue-50/70 dark:bg-blue-950/25",
    selectedBorderClass: "border-blue-500 ring-1 ring-blue-500/30 dark:border-blue-400",
    iconColorClass: "text-blue-600 dark:text-blue-400",
    iconBgClass: "bg-blue-100/80 dark:bg-blue-900/40",
    checkBgClass: "bg-blue-600 text-white",
  },
  {
    id: "STUDENT",
    name: "Student",
    description: "Access courses, attendance and academic records.",
    icon: GraduationCap,
    accentColor: "#16A34A",
    badgeClass: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300",
    selectedBgClass: "bg-emerald-50/70 dark:bg-emerald-950/25",
    selectedBorderClass: "border-emerald-500 ring-1 ring-emerald-500/30 dark:border-emerald-400",
    iconColorClass: "text-emerald-600 dark:text-emerald-400",
    iconBgClass: "bg-emerald-100/80 dark:bg-emerald-900/40",
    checkBgClass: "bg-emerald-600 text-white",
  },
  {
    id: "TEACHER",
    name: "Teacher",
    description: "Manage classes, attendance and student activities.",
    icon: BookOpen,
    accentColor: "#7C3AED",
    badgeClass: "text-violet-700 bg-violet-50 dark:bg-violet-950/60 dark:text-violet-300",
    selectedBgClass: "bg-violet-50/70 dark:bg-violet-950/25",
    selectedBorderClass: "border-violet-500 ring-1 ring-violet-500/30 dark:border-violet-400",
    iconColorClass: "text-violet-600 dark:text-violet-400",
    iconBgClass: "bg-violet-100/80 dark:bg-violet-900/40",
    checkBgClass: "bg-violet-600 text-white",
  },
  {
    id: "SUPER_ADMIN",
    name: "Super Admin",
    description: "Manage the entire platform and institutions.",
    icon: Crown,
    accentColor: "#D97706",
    badgeClass: "text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300",
    selectedBgClass: "bg-amber-50/70 dark:bg-amber-950/25",
    selectedBorderClass: "border-amber-500 ring-1 ring-amber-500/30 dark:border-amber-400",
    iconColorClass: "text-amber-600 dark:text-amber-400",
    iconBgClass: "bg-amber-100/80 dark:bg-amber-900/40",
    checkBgClass: "bg-amber-600 text-white",
  },
];

interface RoleSelectorProps {
  value: Role;
  onChange: (role: Role) => void;
  disabled?: boolean;
}

export function RoleSelector({ value, onChange, disabled }: RoleSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300 select-none">
          Select Account Role
        </label>
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          Choose your account type
        </span>
      </div>

      <div
        role="radiogroup"
        aria-label="Account role selection"
        className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
      >
        {ROLE_OPTIONS.map((role) => {
          const isSelected = value === role.id;
          const Icon = role.icon;

          return (
            <button
              key={role.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onChange(role.id)}
              className={cn(
                "group relative text-left p-3 rounded-xl border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900",
                isSelected
                  ? cn(role.selectedBorderClass, role.selectedBgClass, "shadow-xs")
                  : "border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-800/40",
                disabled && "opacity-50 cursor-not-allowed pointer-events-none"
              )}
            >
              {/* Selected Check Indicator */}
              {isSelected && (
                <div
                  className={cn(
                    "absolute top-2.5 right-2.5 h-4 w-4 rounded-full flex items-center justify-center text-[10px] shadow-xs animate-in zoom-in-50 duration-150",
                    role.checkBgClass
                  )}
                  aria-hidden="true"
                >
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
              )}

              <div className="flex items-start gap-2.5">
                <div
                  className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-200",
                    isSelected
                      ? cn(role.iconBgClass, role.iconColorClass)
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="space-y-0.5 min-w-0 pr-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {role.name}
                    </span>
                  </div>
                  <p className="text-[11px] leading-snug text-slate-500 dark:text-slate-400 line-clamp-2">
                    {role.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

