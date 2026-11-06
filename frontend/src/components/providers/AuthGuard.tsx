"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser, setInitialized } from "@/store/slices/authSlice";
import { useGetCurrentUserQuery } from "@/store/api/authApi";
import { Role } from "@/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

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

  // Attempt backend session verification using HttpOnly cookie via /auth/me
  const {
    data: currentUserData,
    isLoading: isFetchingUser,
    isError: isUserError,
    isSuccess: isUserSuccess,
  } = useGetCurrentUserQuery(undefined, {
    skip: !isMounted || (isInitialized && !!user),
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync /auth/me response to Redux
  useEffect(() => {
    if (isUserSuccess && currentUserData) {
      dispatch(
        setUser({
          id: currentUserData.id,
          name: currentUserData.name,
          email: currentUserData.email,
          role: currentUserData.role,
          avatar: currentUserData.avatar,
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

  // Loading skeleton while verifying session: prevents content flashing
  if (!isMounted || !isInitialized || (isFetchingUser && !user)) {
    return (
      <div className="min-h-screen bg-[#FAF7F0] dark:bg-[#0B0E14] p-8 flex flex-col items-center justify-center space-y-6">
        <div className="w-full max-w-md p-8 rounded-3xl bg-white/80 dark:bg-[#112338]/80 backdrop-blur-md sketch-shadow border border-slate-200/60 dark:border-slate-800/60 text-center space-y-4">
          <Loader2 className="h-10 w-10 text-[#4D9FFF] animate-spin mx-auto" />
          <h3 className="font-handwriting text-2xl font-bold text-slate-900 dark:text-slate-100">
            Verifying Session...
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Securing access via Education Management System backend
          </p>
          <Skeleton className="h-4 w-3/4 mx-auto rounded-full bg-[#EAF6FF] dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  // Role authorization guard: prevent wrong role access
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const authorizedPath = getRoleDashboardPath(user.role);

    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl bg-[#FFF1E8] dark:bg-[#3A1F1B] p-8 sketch-shadow text-center space-y-4">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-[#FF8066] text-white flex items-center justify-center sketch-shadow-sm">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold font-handwriting text-slate-900 dark:text-slate-100">
            Access Restricted
          </h2>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
            Your current account role (<strong className="text-[#FF8066]">{user.role}</strong>) does not have permission to view this section.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
            <Link href={authorizedPath}>
              <Button variant="coral" className="font-handwriting text-base gap-2 w-full">
                <ArrowLeft className="h-4 w-4" /> Go to Your Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
