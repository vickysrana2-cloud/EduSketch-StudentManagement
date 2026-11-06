"use client";

import React from "react";
import Link from "next/link";
import {
  GraduationCap,
  CalendarCheck,
  Award,
  BookOpen,
  ClipboardList,
  TrendingUp,
  FileText,
  ArrowRight,
} from "lucide-react";

import { useAppSelector } from "@/store/hooks";
import { RoleProtectedLayout } from "@/components/layouts/RoleProtectedLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DoodleSpark } from "@/components/ui/doodles";

export default function StudentDashboardPage() {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <RoleProtectedLayout allowedRoles={["STUDENT"]}>
      <div className="space-y-8 pb-10">
        {/* Welcome Notebook Banner */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[#EFFFF7] via-[#EAF6FF] to-[#FFFBE5] dark:from-[#112F24] dark:via-[#112338] dark:to-[#362E12] p-6 md:p-8 sketch-shadow rotate-sketch-sm overflow-hidden border border-emerald-200/60 dark:border-emerald-900/60">
          <div className="tape-accent" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <Badge variant="green" className="text-sm px-3 py-1 font-bold">
                  🎒 Student Learning Portal
                </Badge>
                <DoodleSpark className="h-5 w-5 text-emerald-500" />
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 leading-tight">
                Hey, {user?.name || "Student"}! 🌟
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base leading-relaxed font-medium">
                Keep up the great work this semester! Review your term attendance, view upcoming exam dates, and download your term progress report.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/results">
                <Button variant="green" size="lg" className="font-handwriting text-lg gap-2">
                  <Award className="h-5 w-5" />
                  My Report Card
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Student Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Class Cohort */}
          <div className="relative rounded-3xl bg-[#EAF6FF] dark:bg-[#112338] p-6 sketch-shadow hover:-translate-y-1 transition-all duration-300 rotate-sketch-left">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-[#4D9FFF] dark:text-[#8DD8FF]">
                  Enrolled Class
                </p>
                <h3 className="text-3xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 mt-1">
                  Grade 10-A
                </h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[#4D9FFF] text-white flex items-center justify-center sketch-shadow-sm shadow-[0_4px_12px_rgba(77,159,255,0.3)]">
                <BookOpen className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-4 flex items-center gap-1">
              Roll No: 2026-042
            </p>
          </div>

          {/* Attendance Record */}
          <div className="relative rounded-3xl bg-[#EFFFF7] dark:bg-[#112F24] p-6 sketch-shadow hover:-translate-y-1 transition-all duration-300 rotate-sketch-right">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-[#48C78E] dark:text-[#8DE5C1]">
                  My Attendance
                </p>
                <h3 className="text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 mt-1">
                  94.8%
                </h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[#48C78E] text-white flex items-center justify-center sketch-shadow-sm shadow-[0_4px_12px_rgba(72,199,142,0.3)]">
                <CalendarCheck className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-4 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> Well above 75% minimum
            </p>
          </div>

          {/* Current Academic Standing */}
          <div className="relative rounded-3xl bg-[#FFFBE5] dark:bg-[#362E12] p-6 sketch-shadow hover:-translate-y-1 transition-all duration-300 rotate-sketch-left">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-[#FFC83D] dark:text-[#FFE27A]">
                  Term Average
                </p>
                <h3 className="text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 mt-1">
                  88.5%
                </h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[#FFC83D] text-white flex items-center justify-center sketch-shadow-sm shadow-[0_4px_12px_rgba(255,200,61,0.3)]">
                <Award className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-4 flex items-center gap-1">
              Grade A (Distinction)
            </p>
          </div>

          {/* Upcoming Exams */}
          <div className="relative rounded-3xl bg-[#FFF0F6] dark:bg-[#361726] p-6 sketch-shadow hover:-translate-y-1 transition-all duration-300 rotate-sketch-right">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-[#FF6FAE] dark:text-[#FFB3D1]">
                  Upcoming Exam
                </p>
                <h3 className="text-3xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 mt-1">
                  Physics
                </h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[#FF6FAE] text-white flex items-center justify-center sketch-shadow-sm shadow-[0_4px_12px_rgba(255,111,174,0.3)]">
                <ClipboardList className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-4 flex items-center gap-1">
              Friday, 10:00 AM (Hall 2)
            </p>
          </div>
        </div>

        {/* Student Shortcuts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-3xl bg-white dark:bg-[#141824] p-6 sketch-shadow border border-slate-200/80 dark:border-slate-800/80 space-y-4">
            <h4 className="font-handwriting text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-500" /> Grade Reports & Results
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Access your historical marks, subject breakdown, teacher remarks, and semester grade point rankings.
            </p>
            <Link href="/results" className="inline-flex items-center text-xs font-bold text-emerald-600 hover:text-emerald-700 gap-1 font-handwriting">
              View Detailed Results <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="rounded-3xl bg-white dark:bg-[#141824] p-6 sketch-shadow border border-slate-200/80 dark:border-slate-800/80 space-y-4">
            <h4 className="font-handwriting text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-blue-500" /> Attendance Ledger
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Track your daily morning attendance records, leaves granted, and semester attendance certificate status.
            </p>
            <Link href="/attendance" className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-700 gap-1 font-handwriting">
              Review Attendance History <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </RoleProtectedLayout>
  );
}
