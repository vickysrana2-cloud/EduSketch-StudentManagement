"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  Plus,
  TrendingUp,
  Clock,
  ArrowRight,
} from "lucide-react";

import { useAppSelector } from "@/store/hooks";
import { RoleProtectedLayout } from "@/components/layouts/RoleProtectedLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DoodleSpark } from "@/components/ui/doodles";
import { useGetStudentsQuery } from "@/store/api/studentApi";

export default function AdminDashboardPage() {
  const { user } = useAppSelector((state) => state.auth);
  const { data: studentsData } = useGetStudentsQuery({ page: 1, limit: 5 });

  const totalStudents = studentsData?.pagination?.totalRecords || 128;

  return (
    <RoleProtectedLayout allowedRoles={["ADMIN"]}>
      <div className="space-y-8 pb-10">
        {/* Welcome Notebook Banner */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[#EAF6FF] via-[#F4EEFF] to-[#FFF0F6] dark:from-[#112338] dark:via-[#231B3C] dark:to-[#361726] p-6 md:p-8 sketch-shadow rotate-sketch-sm overflow-hidden border border-blue-200/60 dark:border-blue-900/60">
          <div className="tape-accent" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <Badge variant="blue" className="text-sm px-3 py-1 font-bold">
                  🏫 Institutional Administration
                </Badge>
                <DoodleSpark className="h-5 w-5 text-[#FF6FAE]" />
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 leading-tight">
                Welcome, {user?.name || "Administrator"}! 👋
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base leading-relaxed font-medium">
                Campus management dashboard. Oversee academic terms, student admissions, faculty allocations, and institutional records.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/students/new">
                <Button variant="blue" size="lg" className="font-handwriting text-lg gap-2">
                  <Plus className="h-5 w-5" />
                  New Admission
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Students */}
          <div className="relative rounded-3xl bg-[#EAF6FF] dark:bg-[#112338] p-6 sketch-shadow hover:-translate-y-1 transition-all duration-300 rotate-sketch-left">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-[#4D9FFF] dark:text-[#8DD8FF]">
                  Enrolled Students
                </p>
                <h3 className="text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 mt-1">
                  {totalStudents}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[#4D9FFF] text-white flex items-center justify-center sketch-shadow-sm shadow-[0_4px_12px_rgba(77,159,255,0.3)]">
                <Users className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-4 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-[#48C78E]" /> Verified academic profiles
            </p>
          </div>

          {/* Faculty Members */}
          <div className="relative rounded-3xl bg-[#F4EEFF] dark:bg-[#231B3C] p-6 sketch-shadow hover:-translate-y-1 transition-all duration-300 rotate-sketch-right">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-[#8B6DFF] dark:text-[#C5A7FF]">
                  Faculty Teachers
                </p>
                <h3 className="text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 mt-1">
                  24
                </h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[#8B6DFF] text-white flex items-center justify-center sketch-shadow-sm shadow-[0_4px_12px_rgba(139,109,255,0.3)]">
                <GraduationCap className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-4 flex items-center gap-1">
              Active departmental leads
            </p>
          </div>

          {/* Academic Classes */}
          <div className="relative rounded-3xl bg-[#FFFBE5] dark:bg-[#362E12] p-6 sketch-shadow hover:-translate-y-1 transition-all duration-300 rotate-sketch-left">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-[#FFC83D] dark:text-[#FFE27A]">
                  Active Classes
                </p>
                <h3 className="text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 mt-1">
                  18
                </h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[#FFC83D] text-white flex items-center justify-center sketch-shadow-sm shadow-[0_4px_12px_rgba(255,200,61,0.3)]">
                <BookOpen className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-4 flex items-center gap-1">
              Sections A through D
            </p>
          </div>

          {/* Attendance Today */}
          <div className="relative rounded-3xl bg-[#EFFFF7] dark:bg-[#112F24] p-6 sketch-shadow hover:-translate-y-1 transition-all duration-300 rotate-sketch-right">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-[#48C78E] dark:text-[#8DE5C1]">
                  Attendance Rate
                </p>
                <h3 className="text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 mt-1">
                  96.4%
                </h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[#48C78E] text-white flex items-center justify-center sketch-shadow-sm shadow-[0_4px_12px_rgba(72,199,142,0.3)]">
                <CalendarCheck className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-4 flex items-center gap-1">
              Daily morning check-in
            </p>
          </div>
        </div>

        {/* Action Shortcuts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-3xl bg-white dark:bg-[#141824] p-6 sketch-shadow border border-slate-200/80 dark:border-slate-800/80 space-y-4">
            <h4 className="font-handwriting text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" /> Student Directory
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Search, filter, edit student profiles, and update guardian and contact information.
            </p>
            <Link href="/students" className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-700 gap-1 font-handwriting">
              Go to Student Directory <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="rounded-3xl bg-white dark:bg-[#141824] p-6 sketch-shadow border border-slate-200/80 dark:border-slate-800/80 space-y-4">
            <h4 className="font-handwriting text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-purple-500" /> Teachers & Staff
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage teacher designations, department assignments, and subject allocation schedules.
            </p>
            <Link href="/teachers" className="inline-flex items-center text-xs font-bold text-purple-600 hover:text-purple-700 gap-1 font-handwriting">
              Go to Faculty Management <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </RoleProtectedLayout>
  );
}

