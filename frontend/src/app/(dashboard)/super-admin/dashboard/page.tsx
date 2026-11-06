"use client";

import React from "react";
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
} from "lucide-react";

import { useAppSelector } from "@/store/hooks";
import { RoleProtectedLayout } from "@/components/layouts/RoleProtectedLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DoodleSpark, DoodleStar } from "@/components/ui/doodles";

export default function SuperAdminDashboardPage() {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <RoleProtectedLayout allowedRoles={["SUPER_ADMIN"]}>
      <div className="space-y-8 pb-10">
        {/* Welcome Notebook Banner */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[#FFFBE5] via-[#FFF1E8] to-[#EAF6FF] dark:from-[#362E12] dark:via-[#3A1F1B] dark:to-[#112338] p-6 md:p-8 sketch-shadow rotate-sketch-sm overflow-hidden border border-amber-200/60 dark:border-amber-900/60">
          <div className="tape-accent" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
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
                Multi-tenant SaaS control panel. Oversee all registered schools, colleges, subscription plans, and platform-wide security audit trails.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/super-admin/institutions">
                <Button variant="coral" size="lg" className="font-handwriting text-lg gap-2">
                  <Plus className="h-5 w-5" />
                  New Institution
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* High-Level SaaS Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Institutions */}
          <div className="relative rounded-3xl bg-[#FFFBE5] dark:bg-[#362E12] p-6 sketch-shadow hover:-translate-y-1 transition-all duration-300 rotate-sketch-left">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Total Institutions
                </p>
                <h3 className="text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 mt-1">
                  12
                </h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center sketch-shadow-sm shadow-[0_4px_12px_rgba(245,158,11,0.3)]">
                <Building2 className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-4 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> 100% active operational tenants
            </p>
          </div>

          {/* Platform Total Users */}
          <div className="relative rounded-3xl bg-[#EAF6FF] dark:bg-[#112338] p-6 sketch-shadow hover:-translate-y-1 transition-all duration-300 rotate-sketch-right">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-[#4D9FFF] dark:text-[#8DD8FF]">
                  Platform Users
                </p>
                <h3 className="text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 mt-1">
                  1,480
                </h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[#4D9FFF] text-white flex items-center justify-center sketch-shadow-sm shadow-[0_4px_12px_rgba(77,159,255,0.3)]">
                <Users className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-4 flex items-center gap-1">
              Admins, Teachers, Students
            </p>
          </div>

          {/* Active Subscriptions */}
          <div className="relative rounded-3xl bg-[#EFFFF7] dark:bg-[#163326] p-6 sketch-shadow hover:-translate-y-1 transition-all duration-300 rotate-sketch-left">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Active Plans
                </p>
                <h3 className="text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 mt-1">
                  100%
                </h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center sketch-shadow-sm shadow-[0_4px_12px_rgba(16,185,129,0.3)]">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-4 flex items-center gap-1">
              Enterprise & Premium Tier
            </p>
          </div>

          {/* Audit Health */}
          <div className="relative rounded-3xl bg-[#FFF0F6] dark:bg-[#361726] p-6 sketch-shadow hover:-translate-y-1 transition-all duration-300 rotate-sketch-right">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-[#FF6FAE] dark:text-[#FFB3D1]">
                  Audit Compliance
                </p>
                <h3 className="text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 mt-1">
                  Secure
                </h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[#FF6FAE] text-white flex items-center justify-center sketch-shadow-sm shadow-[0_4px_12px_rgba(255,111,174,0.3)]">
                <Activity className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-4 flex items-center gap-1">
              Centralized logging active
            </p>
          </div>
        </div>

        {/* Super Admin Quick Operations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-3xl bg-white dark:bg-[#141824] p-6 sketch-shadow border border-slate-200/80 dark:border-slate-800/80 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold">
                <Building2 className="h-5 w-5" />
              </div>
              <h4 className="font-handwriting text-xl font-bold text-slate-900 dark:text-slate-100">
                Tenant Institutions
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Provision new schools, update subscription licenses, and manage institutional status across universities and academies.
            </p>
            <div className="pt-2">
              <Link href="/institutions">
                <Button variant="outline" size="sm" className="w-full gap-2 font-handwriting">
                  Manage Institutions <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="rounded-3xl bg-white dark:bg-[#141824] p-6 sketch-shadow border border-slate-200/80 dark:border-slate-800/80 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center font-bold">
                <KeyRound className="h-5 w-5" />
              </div>
              <h4 className="font-handwriting text-xl font-bold text-slate-900 dark:text-slate-100">
                Roles & Permissions
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure fine-grained capabilities, map permissions to hierarchy levels, and audit effective system access.
            </p>
            <div className="pt-2">
              <Link href="/settings">
                <Button variant="outline" size="sm" className="w-full gap-2 font-handwriting">
                  Access Permissions <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="rounded-3xl bg-white dark:bg-[#141824] p-6 sketch-shadow border border-slate-200/80 dark:border-slate-800/80 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center font-bold">
                <Activity className="h-5 w-5" />
              </div>
              <h4 className="font-handwriting text-xl font-bold text-slate-900 dark:text-slate-100">
                Security Audit Trail
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Review authentication logs, privilege escalations, tenant switches, and token revocations across all sessions.
            </p>
            <div className="pt-2">
              <Link href="/reports">
                <Button variant="outline" size="sm" className="w-full gap-2 font-handwriting">
                  View Audit Logs <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </RoleProtectedLayout>
  );
}
