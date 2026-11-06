"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { AuthGuard, getRoleDashboardPath } from "@/components/providers/AuthGuard";
import { Loader2 } from "lucide-react";

/**
 * Common entry route (/dashboard)
 * Automatically navigates the authenticated user to their role-specific dashboard:
 * - SUPER_ADMIN -> /super-admin/dashboard
 * - ADMIN -> /admin/dashboard
 * - TEACHER -> /teacher/dashboard
 * - STUDENT -> /student/dashboard
 */
export default function GenericDashboardRedirect() {
  const router = useRouter();
  const { user, isAuthenticated, isInitialized } = useAppSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (isInitialized && isAuthenticated && user?.role) {
      router.replace(getRoleDashboardPath(user.role));
    }
  }, [isInitialized, isAuthenticated, user, router]);

  return (
    <AuthGuard>
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 text-[#4D9FFF] animate-spin" />
        <p className="font-handwriting text-lg text-slate-600 dark:text-slate-300">
          Redirecting to your authorized dashboard...
        </p>
      </div>
    </AuthGuard>
  );
}
