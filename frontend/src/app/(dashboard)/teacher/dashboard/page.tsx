"use client";

import React from "react";
import Link from "next/link";
import {
  BookOpen,
  CalendarCheck,
  Award,
  Users,
  Clock,
  Plus,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

import { useAppSelector } from "@/store/hooks";
import { RoleProtectedLayout } from "@/components/layouts/RoleProtectedLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DoodleSpark } from "@/components/ui/doodles";

export default function TeacherDashboardPage() {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <RoleProtectedLayout allowedRoles={["TEACHER"]}>
      <div className="space-y-8 pb-10">
        {/* Welcome Notebook Banner */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[#F4EEFF] via-[#FFF0F6] to-[#FFFBE5] dark:from-[#231B3C] dark:via-[#361726] dark:to-[#362E12] p-6 md:p-8 sketch-shadow rotate-sketch-sm overflow-hidden border border-violet-200/60 dark:border-violet-900/60">
          <div className="tape-accent" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <Badge variant="purple" className="text-sm px-3 py-1 font-bold">
                  👩‍🏫 Faculty Workspace
                </Badge>
                <DoodleSpark className="h-5 w-5 text-violet-500" />
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 leading-tight">
                Welcome back, {user?.name || "Professor"}! 📚
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base leading-relaxed font-medium">
                Academic classroom console. Take daily attendance, manage course syllabi, enter exam marks, and monitor your assigned cohorts.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/attendance">
                <Button variant="purple" size="lg" className="font-handwriting text-lg gap-2">
                  <CalendarCheck className="h-5 w-5" />
                  Take Attendance
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Teacher Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Assigned Classes */}
          <div className="relative rounded-3xl bg-[#F4EEFF] dark:bg-[#231B3C] p-6 sketch-shadow hover:-translate-y-1 transition-all duration-300 rotate-sketch-left">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  Assigned Classes
                </p>
                <h3 className="text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 mt-1">
                  4
                </h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center sketch-shadow-sm shadow-[0_4px_12px_rgba(139,109,255,0.3)]">
                <BookOpen className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-4 flex items-center gap-1">
              Grade 9A, 9B, 10A, 10C
            </p>
          </div>

          {/* Enrolled Cohort Students */}
          <div className="relative rounded-3xl bg-[#EAF6FF] dark:bg-[#112338] p-6 sketch-shadow hover:-translate-y-1 transition-all duration-300 rotate-sketch-right">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-[#4D9FFF] dark:text-[#8DD8FF]">
                  My Students
                </p>
                <h3 className="text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 mt-1">
                  142
                </h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[#4D9FFF] text-white flex items-center justify-center sketch-shadow-sm shadow-[0_4px_12px_rgba(77,159,255,0.3)]">
                <Users className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-4 flex items-center gap-1">
              Active across your subjects
            </p>
          </div>

          {/* Today's Lectures */}
          <div className="relative rounded-3xl bg-[#FFFBE5] dark:bg-[#362E12] p-6 sketch-shadow hover:-translate-y-1 transition-all duration-300 rotate-sketch-left">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-[#FFC83D] dark:text-[#FFE27A]">
                  Today's Periods
                </p>
                <h3 className="text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 mt-1">
                  3 / 4
                </h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[#FFC83D] text-white flex items-center justify-center sketch-shadow-sm shadow-[0_4px_12px_rgba(255,200,61,0.3)]">
                <Clock className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-4 flex items-center gap-1">
              Next: Physics Lab (2:00 PM)
            </p>
          </div>

          {/* Pending Grades */}
          <div className="relative rounded-3xl bg-[#EFFFF7] dark:bg-[#112F24] p-6 sketch-shadow hover:-translate-y-1 transition-all duration-300 rotate-sketch-right">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-[#48C78E] dark:text-[#8DE5C1]">
                  Grading Queue
                </p>
                <h3 className="text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 mt-1">
                  Done
                </h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[#48C78E] text-white flex items-center justify-center sketch-shadow-sm shadow-[0_4px_12px_rgba(72,199,142,0.3)]">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-4 flex items-center gap-1">
              Mid-term submissions finalized
            </p>
          </div>
        </div>

        {/* Quick Teacher Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-3xl bg-white dark:bg-[#141824] p-6 sketch-shadow border border-slate-200/80 dark:border-slate-800/80 space-y-4">
            <h4 className="font-handwriting text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-violet-500" /> Attendance Ledger
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Record present, absent, and excused statuses for students in your morning and afternoon sessions.
            </p>
            <Link href="/attendance" className="inline-flex items-center text-xs font-bold text-violet-600 hover:text-violet-700 gap-1 font-handwriting">
              Launch Attendance Register <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="rounded-3xl bg-white dark:bg-[#141824] p-6 sketch-shadow border border-slate-200/80 dark:border-slate-800/80 space-y-4">
            <h4 className="font-handwriting text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" /> Examination Marks
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Submit unit test scores, lab marks, and term assessment results for your enrolled subjects.
            </p>
            <Link href="/results" className="inline-flex items-center text-xs font-bold text-amber-600 hover:text-amber-700 gap-1 font-handwriting">
              Enter Student Grades <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </RoleProtectedLayout>
  );
}

