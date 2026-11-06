"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User as UserIcon,
  LayoutDashboard,
  Settings,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import { clearAccessToken } from "@/lib/auth-session";
import { authService } from "@/services/auth.service";
import { useToast } from "@/components/ui/toast";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Role } from "@/types";
import { getRoleDashboardPath } from "@/components/providers/AuthGuard";

const ROLE_BADGE_STYLES: Record<
  Role,
  { bg: string; text: string; border: string; label: string }
> = {
  SUPER_ADMIN: {
    bg: "bg-purple-100 dark:bg-purple-950/70",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-300 dark:border-purple-800",
    label: "Super Admin",
  },
  ADMIN: {
    bg: "bg-blue-100 dark:bg-blue-950/70",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-300 dark:border-blue-800",
    label: "Administrator",
  },
  TEACHER: {
    bg: "bg-amber-100 dark:bg-amber-950/70",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-300 dark:border-amber-800",
    label: "Faculty / Teacher",
  },
  STUDENT: {
    bg: "bg-emerald-100 dark:bg-emerald-950/70",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-300 dark:border-emerald-800",
    label: "Student",
  },
};

export function UserProfileMenu() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authService.logout();
    } catch {
      // Proceed with local logout regardless of network error
    } finally {
      clearAccessToken();
      dispatch(logout());
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
      setIsOpen(false);

      toast({
        type: "info",
        title: "Signed Out",
        description: "Your session has ended safely.",
      });

      router.push("/login");
    }
  };

  const userRole = (user?.role as Role) || "ADMIN";
  const roleStyle = ROLE_BADGE_STYLES[userRole] || ROLE_BADGE_STYLES.ADMIN;
  const dashboardPath = getRoleDashboardPath(userRole);

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <>
      <div className="relative" ref={menuRef}>
        {/* Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          {/* Avatar Icon */}
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white dark:ring-slate-900">
            {initial}
          </div>

          {/* User Name & Role (Desktop) */}
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-tight truncate max-w-[120px]">
              {user?.name || "User Account"}
            </p>
            <span
              className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${roleStyle.bg} ${roleStyle.text}`}
            >
              {roleStyle.label}
            </span>
          </div>

          <ChevronDown
            className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200/80 dark:border-slate-800/80 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* User Profile Header Card */}
            <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {user?.name || "Active User"}
                </p>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${roleStyle.border} ${roleStyle.bg} ${roleStyle.text}`}
                >
                  {userRole}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {user?.email || "user@ems.edu"}
              </p>
              <div className="flex items-center gap-1.5 pt-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                <ShieldCheck className="h-3 w-3" />
                <span>Session Verified & Active</span>
              </div>
            </div>

            {/* Navigation Actions */}
            <div className="py-1.5 space-y-0.5">
              <Link
                href={dashboardPath}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <LayoutDashboard className="h-4 w-4 text-blue-500" />
                <span>My Dashboard</span>
              </Link>

              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Settings className="h-4 w-4 text-slate-500" />
                <span>Account & Security Settings</span>
              </Link>
            </div>

            {/* Logout Action */}
            <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsLogoutModalOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        title="Sign Out"
        description="Are you sure you want to end your active session on this device? Your refresh token will be revoked on the server."
        confirmText="Yes, Sign Out"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isLoggingOut}
      />
    </>
  );
}

