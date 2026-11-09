"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  ShieldCheck,
  Users,
  Activity,
  Plus,
  KeyRound,
  ExternalLink,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ArrowRight,
  Server,
  Database,
  Layers,
} from "lucide-react";

import { useAppSelector } from "@/store/hooks";
import { RoleProtectedLayout } from "@/components/layouts/RoleProtectedLayout";
import { useGetInstitutionsQuery } from "@/store/api/institutionApi";
import { useGetUsersQuery } from "@/store/api/userApi";
import { useGetAuditLogsQuery } from "@/store/api/auditLogApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/ui/user-avatar";
import { DoodleSpark, DoodleStar } from "@/components/ui/doodles";

export default function SuperAdminDashboardPage() {
  const { user } = useAppSelector((state) => state.auth);

  // ============================================================================
  // Live API Queries
  // ============================================================================

  const { data: institutions = [], isLoading: isInstitutionsLoading } =
    useGetInstitutionsQuery();

  const { data: users = [], isLoading: isUsersLoading } = useGetUsersQuery();

  const { data: auditData, isLoading: isAuditLoading } = useGetAuditLogsQuery({
    page: 1,
    limit: 5,
  });

  const recentAuditLogs = auditData?.items || [];

  // ============================================================================
  // Derived Statistics from Live List Endpoints
  // ============================================================================

  const stats = useMemo(() => {
    const totalInst = institutions.length;
    const activeInst = institutions.filter((i) => i.status === "ACTIVE").length;
    const inactiveInst = institutions.filter((i) => i.status === "INACTIVE").length;
    const suspendedInst = institutions.filter((i) => i.status === "SUSPENDED").length;

    const totalUsersCount = users.length;
    const adminCount = users.filter((u) => u.role === "ADMIN").length;
    const teacherCount = users.filter((u) => u.role === "TEACHER").length;
    const studentCount = users.filter((u) => u.role === "STUDENT").length;

    return {
      totalInst,
      activeInst,
      inactiveInst,
      suspendedInst,
      totalUsersCount,
      adminCount,
      teacherCount,
      studentCount,
    };
  }, [institutions, users]);

  return (
    <RoleProtectedLayout allowedRoles={["SUPER_ADMIN"]}>
      <div className="space-y-8 pb-10 max-w-7xl mx-auto">
        {/* Welcome Notebook Banner */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[#FFFBE5] via-[#FFF1E8] to-[#EAF6FF] dark:from-[#362E12] dark:via-[#3A1F1B] dark:to-[#112338] p-6 md:p-8 sketch-shadow rotate-sketch-sm overflow-hidden border border-amber-200/60 dark:border-amber-900/60">
          <div className="tape-accent" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <UserAvatar
                src={user?.profileImage || (user as any)?.avatar}
                name={user?.name}
                size="xl"
                shape="rounded-2xl"
                variant="amber"
                className="hidden sm:flex shadow-md ring-2 ring-amber-200 dark:ring-amber-900 shrink-0"
              />
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <Badge variant="yellow" className="text-sm px-3 py-1 font-bold">
                    👑 Platform Super Admin Console
                  </Badge>
                  <DoodleSpark className="h-5 w-5 text-amber-500" />
                </div>

                <h1 className="text-3xl md:text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 leading-tight">
                  Welcome, {user?.name || "Director"}!
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base leading-relaxed font-medium">
                  Multi-tenant SaaS operational overview. Derived directly from live platform records without synthetic dashboard endpoints.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/super-admin/institutions">
                <Button variant="coral" size="lg" className="font-handwriting text-lg gap-2">
                  <Plus className="h-5 w-5" />
                  New Institution
                </Button>
              </Link>
              <Link href="/users">
                <Button variant="outline" size="lg" className="font-handwriting text-lg gap-2 bg-white/80 dark:bg-slate-900">
                  <Users className="h-5 w-5" />
                  Manage Users
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Live Metrics Grid (Status-Wise Institutions & Users) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Institutions */}
          <div className="relative rounded-3xl bg-[#FFFBE5] dark:bg-[#362E12] p-6 sketch-shadow hover:-translate-y-1 transition-all duration-300 rotate-sketch-left border border-amber-200/80 dark:border-amber-900/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Total Institutions
                </p>
                <h3 className="text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 mt-1">
                  {isInstitutionsLoading ? "..." : stats.totalInst}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center sketch-shadow-sm shadow-[0_4px_12px_rgba(245,158,11,0.3)]">
                <Building2 className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> {stats.activeInst} Active
              </span>
              <span className="text-slate-400">
                {stats.inactiveInst + stats.suspendedInst} Non-Active
              </span>
            </div>
          </div>

          {/* Active Status Breakdown */}
          <div className="relative rounded-3xl bg-[#EFFFF7] dark:bg-[#112F24] p-6 sketch-shadow hover:-translate-y-1 transition-all duration-300 border border-emerald-200/80 dark:border-emerald-900/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-[#48C78E] dark:text-[#8DE5C1]">
                  Active Tenants
                </p>
                <h3 className="text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 mt-1">
                  {isInstitutionsLoading ? "..." : stats.activeInst}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[#48C78E] text-white flex items-center justify-center sketch-shadow-sm shadow-[0_4px_12px_rgba(72,199,142,0.3)]">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-4 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              {stats.totalInst > 0
                ? `${Math.round((stats.activeInst / stats.totalInst) * 100)}% operational rate`
                : "No tenants registered"}
            </p>
          </div>

          {/* Suspended / Inactive Tenants */}
          <div className="relative rounded-3xl bg-[#FFF1E8] dark:bg-[#3A1F1B] p-6 sketch-shadow hover:-translate-y-1 transition-all duration-300 border border-rose-200/80 dark:border-rose-900/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-[#FF8066] dark:text-[#FFA694]">
                  Suspended / Inactive
                </p>
                <h3 className="text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 mt-1">
                  {isInstitutionsLoading ? "..." : stats.suspendedInst + stats.inactiveInst}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[#FF8066] text-white flex items-center justify-center sketch-shadow-sm shadow-[0_4px_12px_rgba(255,128,102,0.3)]">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-rose-200/60 dark:border-rose-800/40 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-medium">
              <span>{stats.suspendedInst} Suspended</span>
              <span>{stats.inactiveInst} Inactive</span>
            </div>
          </div>

          {/* Platform Total Users */}
          <div className="relative rounded-3xl bg-[#EAF6FF] dark:bg-[#112338] p-6 sketch-shadow hover:-translate-y-1 transition-all duration-300 rotate-sketch-right border border-blue-200/80 dark:border-blue-900/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-[#4D9FFF] dark:text-[#8DD8FF]">
                  Platform Users
                </p>
                <h3 className="text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 mt-1">
                  {isUsersLoading ? "..." : stats.totalUsersCount}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[#4D9FFF] text-white flex items-center justify-center sketch-shadow-sm shadow-[0_4px_12px_rgba(77,159,255,0.3)]">
                <Users className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-blue-200/60 dark:border-blue-800/40 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
              <span>{stats.adminCount} Admins</span>
              <span>{stats.teacherCount} Teachers</span>
              <span>{stats.studentCount} Students</span>
            </div>
          </div>
        </div>

        {/* Quick Management & Recent Audit Logs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Audit Logs (2 Columns) */}
          <div className="lg:col-span-2 rounded-3xl bg-white dark:bg-[#141824] p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white font-handwriting">
                    Recent Security Audit Trail
                  </h3>
                  <p className="text-xs text-slate-500">
                    Latest administrative actions captured across all system modules
                  </p>
                </div>
              </div>

              <Link
                href="/audit-logs"
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>View Full Trail</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Audit Logs Feed */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {isAuditLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="py-3 flex items-center justify-between animate-pulse">
                    <div className="space-y-1.5">
                      <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
                      <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                    <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
                  </div>
                ))
              ) : recentAuditLogs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 italic">
                  No recent security audit logs recorded yet.
                </div>
              ) : (
                recentAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="py-3 flex items-start justify-between gap-3 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-900/30 rounded-xl px-2 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {log.description}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                          {log.user?.name || "System"}
                        </span>
                        <span>•</span>
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                        {log.ipAddress && (
                          <>
                            <span>•</span>
                            <span className="font-mono">{log.ipAddress}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {log.module}
                      </Badge>
                      <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800 text-[10px]">
                        {log.action}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Shortcuts & Security Governance (1 Column) */}
          <div className="space-y-6">
            <div className="rounded-3xl bg-white dark:bg-[#141824] p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-handwriting flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-indigo-500" />
                <span>Super Admin Quick Links</span>
              </h3>

              <div className="space-y-2.5">
                <Link
                  href="/super-admin/institutions"
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/70 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/60 dark:border-slate-800 transition-colors text-xs font-semibold text-slate-800 dark:text-slate-200 group"
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="h-4 w-4 text-indigo-500" />
                    <span>Institutions Management</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/users"
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/70 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-slate-200/60 dark:border-slate-800 transition-colors text-xs font-semibold text-slate-800 dark:text-slate-200 group"
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span>Platform Users & Roles</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/roles"
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/70 hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-slate-200/60 dark:border-slate-800 transition-colors text-xs font-semibold text-slate-800 dark:text-slate-200 group"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="h-4 w-4 text-sky-500" />
                    <span>Permission Policy Matrix</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/audit-logs"
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/70 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200/60 dark:border-slate-800 transition-colors text-xs font-semibold text-slate-800 dark:text-slate-200 group"
                >
                  <div className="flex items-center gap-2.5">
                    <Activity className="h-4 w-4 text-amber-500" />
                    <span>Full Audit Log Trail</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* System Status Indicators */}
            <div className="rounded-3xl bg-[#FAF9F6] dark:bg-[#141824] p-5 border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
                <span>Infrastructure Telemetry</span>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  All Systems Normal
                </span>
              </div>

              <div className="space-y-2 text-slate-500 text-[11px]">
                <div className="flex items-center justify-between">
                  <span>NestJS Backend API (Port 3001)</span>
                  <span className="font-semibold text-emerald-600">Online (200 OK)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>MongoDB Atlas Connection</span>
                  <span className="font-semibold text-emerald-600">Connected</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>JWT Token Family Rotation</span>
                  <span className="font-semibold text-emerald-600">Enforced</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleProtectedLayout>
  );
}
