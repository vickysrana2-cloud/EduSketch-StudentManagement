"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldAlert,
  ArrowLeft,
  Loader2,
  Lock,
  LogOut,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser, setInitialized, logout } from "@/store/slices/authSlice";
import { useGetCurrentUserQuery, useLogoutMutation } from "@/store/api/authApi";
import { clearAccessToken } from "@/lib/auth-session";
import { Role } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export function getRoleDashboardPath(role: Role): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "/super-admin/dashboard";
    case "ADMIN":
      return "/admin/dashboard";
    case "TEACHER":
      return "/teacher/dashboard";
    case "STUDENT":
      return "/student/dashboard";
    default:
      return "/dashboard";
  }
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isInitialized } = useAppSelector(
    (state) => state.auth
  );
  const [isMounted, setIsMounted] = useState(false);
  const [logoutMutation, { isLoading: isLoggingOut }] = useLogoutMutation();

  // Backend session verification using HttpOnly cookie via /auth/me + silent refresh interceptor
  const {
    data: currentUserData,
    isLoading: isFetchingUser,
    isError: isUserError,
    isSuccess: isUserSuccess,
  } = useGetCurrentUserQuery(undefined, {
    skip: !isMounted,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync /auth/me response to Redux
  useEffect(() => {
    if (isUserSuccess && currentUserData) {
      const avatarUrl =
        (currentUserData as any).profileImage || currentUserData.avatar || null;
      dispatch(
        setUser({
          id: currentUserData.id,
          name: currentUserData.name,
          email: currentUserData.email,
          role: currentUserData.role,
          avatar: avatarUrl,
          profileImage: avatarUrl,
          institutionId:
            currentUserData.institutionId ||
            (currentUserData.institution as any)?.id ||
            null,
        })
      );
    } else if (isUserError) {
      dispatch(setInitialized(true));
    }
  }, [isUserSuccess, isUserError, currentUserData, dispatch]);

  // Redirect unauthenticated users
  useEffect(() => {
    if (isMounted && isInitialized && !isAuthenticated && !isFetchingUser) {
      router.push("/login");
    }
  }, [isMounted, isInitialized, isAuthenticated, isFetchingUser, router]);

  const handleSwitchAccount = async () => {
    try {
      await logoutMutation().unwrap();
    } catch {
      // Proceed with local logout regardless of network error
    } finally {
      clearAccessToken();
      dispatch(logout());
      router.push("/login");
    }
  };

  // Modernized Loading & Session Verification Screen
  if (!isMounted || !isInitialized || (isFetchingUser && !user)) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex flex-col items-center justify-center relative overflow-hidden select-none">
        {/* Ambient background glow */}
        <div className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-400 via-transparent to-transparent" />

        <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl text-center space-y-6 relative z-10 transition-all">
          {/* Animated Central Emblem */}
          <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-blue-500/20 dark:bg-blue-500/30 animate-ping opacity-75" />
            <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
              <GraduationCap className="h-8 w-8 animate-pulse" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Verifying Session Security
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
              Authenticating credentials and synchronizing access permissions with the backend...
            </p>
          </div>

          {/* Shimmering Progress Bar */}
          <div className="space-y-2">
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full animate-indeterminate" />
            </div>
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Checking tokens & role rights</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  // Polished Access Restricted / Unauthorized UI State
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const authorizedPath = getRoleDashboardPath(user.role);

    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="max-w-lg w-full rounded-3xl bg-white dark:bg-slate-900 p-8 sm:p-10 border border-slate-200/80 dark:border-slate-800/80 shadow-2xl text-center space-y-6">
          {/* Restricted Icon */}
          <div className="h-16 w-16 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center ring-8 ring-rose-50 dark:ring-rose-950/30">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              <Lock className="h-3 w-3" />
              <span>403 Forbidden Access</span>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white pt-1">
              Access Restricted
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
              Your account does not possess the required permission tier to view this resource.
            </p>
          </div>

          {/* Context Comparison Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-left space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Your Current Role:</span>
              <span className="px-2 py-0.5 rounded-md font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 uppercase">
                {user.role}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Required Role(s):</span>
              <div className="flex flex-wrap gap-1">
                {allowedRoles.map((role) => (
                  <span
                    key={role}
                    className="px-2 py-0.5 rounded-md font-bold bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 uppercase"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400">Signed In As:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                {user.email}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={authorizedPath} className="flex-1">
              <Button
                variant="default"
                className="w-full text-xs font-semibold gap-2 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20"
              >
                <ArrowLeft className="h-4 w-4" /> Go to Your Dashboard
              </Button>
            </Link>

            <Button
              variant="outline"
              onClick={handleSwitchAccount}
              disabled={isLoggingOut}
              className="text-xs font-semibold gap-2 h-11 rounded-xl text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <LogOut className="h-4 w-4" /> Switch Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
