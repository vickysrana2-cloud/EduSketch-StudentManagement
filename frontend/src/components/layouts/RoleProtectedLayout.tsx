"use client";

import React from "react";
import { Role } from "@/types";
import { AuthGuard } from "@/components/providers/AuthGuard";

interface RoleProtectedLayoutProps {
  children: React.ReactNode;
  allowedRoles: Role[];
}

/**
 * Reusable Role-Protected Layout Wrapper for EMS Next.js Application
 * - Validates session against the NestJS backend
 * - Prevents flash of unauthenticated content via AuthGuard skeleton
 * - Restricts access to specified roles, showing access restricted state for unauthorized roles
 */
export function RoleProtectedLayout({
  children,
  allowedRoles,
}: RoleProtectedLayoutProps) {
  return <AuthGuard allowedRoles={allowedRoles}>{children}</AuthGuard>;
}
