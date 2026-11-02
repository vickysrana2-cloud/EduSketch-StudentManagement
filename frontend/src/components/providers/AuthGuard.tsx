"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { Role } from "@/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      router.push("/login");
    }
  }, [isMounted, isAuthenticated, router]);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#FAF7F0] dark:bg-[#0B0E14] p-8 flex items-center justify-center">
        <Skeleton className="h-64 w-full max-w-md rounded-3xl bg-[#EAF6FF]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Role check guard
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
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
          <div className="pt-2">
            <Link href="/dashboard">
              <Button variant="coral" className="font-handwriting text-base gap-2">
                <ArrowLeft className="h-4 w-4" /> Return to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
