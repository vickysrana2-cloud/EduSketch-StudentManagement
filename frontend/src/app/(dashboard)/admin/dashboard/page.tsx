"use client";

import React, { useMemo } from "react";
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
  UserCheck,
  Layers,
  Award,
  CheckCircle2,
  Calendar,
  Sparkles,
  Activity,
  FileSpreadsheet,
} from "lucide-react";

import { useAppSelector } from "@/store/hooks";
import { RoleProtectedLayout } from "@/components/layouts/RoleProtectedLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DoodleSpark } from "@/components/ui/doodles";
import { useGetStudentsQuery } from "@/store/api/studentApi";
import { useGetTeachersQuery } from "@/store/api/teacherApi";
import { useGetClassesQuery, useGetSubjectsQuery } from "@/store/api/academicApi";
import { useGetEnrollmentsQuery } from "@/store/api/enrollmentApi";

export default function AdminDashboardPage() {
  const { user } = useAppSelector((state) => state.auth);

  // ============================================================================
  // Live Data Queries (Stats derived from list endpoints)
  // ============================================================================

  const { data: studentsData, isLoading: isStudentsLoading } = useGetStudentsQuery({
    page: 1,
    limit: 1,
  });

  const { data: teachersData, isLoading: isTeachersLoading } = useGetTeachersQuery({
    page: 1,
    limit: 1,
  });

  const { data: classesData, isLoading: isClassesLoading } = useGetClassesQuery();
  const { data: subjectsData, isLoading: isSubjectsLoading } = useGetSubjectsQuery();

  const { data: enrollmentsData, isLoading: isEnrollmentsLoading } =
    useGetEnrollmentsQuery({
      page: 1,
      limit: 5,
    });

  // Calculate live totals from list response metadata
  const totalStudents =
    (studentsData as any)?.pagination?.totalRecords ??
    (studentsData as any)?.total ??
    (studentsData as any)?.data?.length ??
    0;

  const totalTeachers =
    (teachersData as any)?.pagination?.totalRecords ??
    (teachersData as any)?.total ??
    (teachersData as any)?.data?.length ??
    0;

  const totalClasses =
    (classesData as any)?.total ??
    (classesData as any)?.items?.length ??
    (Array.isArray(classesData) ? classesData.length : 0);

  const totalSubjects =
    (subjectsData as any)?.total ??
    (subjectsData as any)?.items?.length ??
    (Array.isArray(subjectsData) ? subjectsData.length : 0);

  const recentEnrollments = enrollmentsData?.items || [];

  return (
    <RoleProtectedLayout allowedRoles={["ADMIN"]}>
      <div className="space-y-8 pb-10 max-w-7xl mx-auto">
        {/* Welcome Notebook Banner */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[#EAF6FF] via-[#F4EEFF] to-[#FFF0F6] dark:from-[#112338] dark:via-[#231B3C] dark:to-[#361726] p-6 md:p-8 sketch-shadow rotate-sketch-sm overflow-hidden border border-blue-200/60 dark:border-blue-900/60">
          <div className="tape-accent" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <Badge variant="blue" className="text-sm px-3 py-1 font-bold">
                  🏫 Institutional Administration Console
                </Badge>
                <DoodleSpark className="h-5 w-5 text-[#FF6FAE]" />
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 leading-tight">
                Welcome back, {user?.name || "Administrator"}! 👋
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base leading-relaxed font-medium">
                Live institutional operations for {(user as any)?.institution?.name || "your institution"}. Total statistics calculated in real-time from active records.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/students/new">
                <Button variant="blue" size="lg" className="font-handwriting text-lg gap-2">
                  <Plus className="h-5 w-5" />
                  New Admission
                </Button>
              </Link>
              <Link href="/academics">
                <Button
                  variant="outline"
                  size="lg"
                  className="font-handwriting text-lg gap-2 bg-white/80 dark:bg-slate-900"
                >
                  <BookOpen className="h-5 w-5" />
                  Academics
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Real-time Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Students Count */}
          <div className="relative rounded-3xl bg-[#EAF6FF] dark:bg-[#112338] p-6 sketch-shadow hover:-translate-y-1 transition-all duration-300 rotate-sketch-left border border-blue-200/80 dark:border-blue-900/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-[#4D9FFF] dark:text-[#8DD8FF]">
                  Enrolled Students
                </p>
                <h3 className="text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 mt-1">
                  {isStudentsLoading ? "..." : totalStudents}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[#4D9FFF] text-white flex items-center justify-center sketch-shadow-sm shadow-[0_4px_12px_rgba(77,159,255,0.3)]">
                <Users className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-blue-200/60 dark:border-blue-800/40 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-3.5 w-3.5" /> Live student roster
              </span>
              <Link href="/students" className="hover:underline font-bold text-blue-600">
                View &rarr;
              </Link>
            </div>
          </div>

          {/* Faculty Members Count */}
          <div className="relative rounded-3xl bg-[#F4EEFF] dark:bg-[#231B3C] p-6 sketch-shadow hover:-translate-y-1 transition-all duration-300 rotate-sketch-right border border-purple-200/80 dark:border-purple-900/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-[#8B6DFF] dark:text-[#C5A7FF]">
                  Faculty Teachers
                </p>
                <h3 className="text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 mt-1">
                  {isTeachersLoading ? "..." : totalTeachers}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[#8B6DFF] text-white flex items-center justify-center sketch-shadow-sm shadow-[0_4px_12px_rgba(139,109,255,0.3)]">
                <GraduationCap className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-purple-200/60 dark:border-purple-800/40 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-purple-600 dark:text-purple-400">
                Instructors & Mentors
              </span>
              <Link href="/teachers" className="hover:underline font-bold text-purple-600">
                View &rarr;
              </Link>
            </div>
          </div>

          {/* Classrooms Count */}
          <div className="relative rounded-3xl bg-[#FFFBE5] dark:bg-[#362E12] p-6 sketch-shadow hover:-translate-y-1 transition-all duration-300 border border-amber-200/80 dark:border-amber-900/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-[#FFC83D] dark:text-[#FFE27A]">
                  Active Classes
                </p>
                <h3 className="text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 mt-1">
                  {isClassesLoading ? "..." : totalClasses}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[#FFC83D] text-white flex items-center justify-center sketch-shadow-sm shadow-[0_4px_12px_rgba(255,200,61,0.3)]">
                <BookOpen className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <span>{totalSubjects} Curriculum Subjects</span>
              <Link href="/academics" className="hover:underline font-bold text-amber-600">
                Manage &rarr;
              </Link>
            </div>
          </div>

          {/* Today's Attendance Metric (Mock + Demo Data Badge) */}
          <div className="relative rounded-3xl bg-[#EFFFF7] dark:bg-[#112F24] p-6 sketch-shadow hover:-translate-y-1 transition-all duration-300 border border-emerald-200/80 dark:border-emerald-900/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-[#48C78E] dark:text-[#8DE5C1]">
                    Today's Attendance
                  </p>
                  <Badge variant="outline" className="text-[9px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300">
                    Demo data
                  </Badge>
                </div>
                <h3 className="text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 mt-1">
                  96.4%
                </h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[#48C78E] text-white flex items-center justify-center sketch-shadow-sm shadow-[0_4px_12px_rgba(72,199,142,0.3)]">
                <CalendarCheck className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <span className="text-emerald-600 font-semibold">96% Present • 4% Absent</span>
              <Link href="/attendance" className="hover:underline font-bold text-emerald-600">
                Log &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Enrollments & Quick Actions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Enrollments (2 Columns) */}
          <div className="lg:col-span-2 rounded-3xl bg-white dark:bg-[#141824] p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#4D9FFF]">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white font-handwriting">
                    Recent Student Enrollments
                  </h3>
                  <p className="text-xs text-slate-500">
                    Latest student class placements and roll assignments
                  </p>
                </div>
              </div>

              <Link
                href="/enrollments"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Enrollments List */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {isEnrollmentsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="py-3 flex items-center justify-between animate-pulse">
                    <div className="space-y-1.5">
                      <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
                      <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                    <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
                  </div>
                ))
              ) : recentEnrollments.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 italic">
                  No active enrollments recorded yet. Click "New Admission" to admit a student.
                </div>
              ) : (
                recentEnrollments.map((enr) => (
                  <div
                    key={enr.id}
                    className="py-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-900/30 rounded-xl px-2 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-900 dark:text-white text-sm">
                        {enr.studentName}
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 text-xs">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {enr.className}
                        </span>
                        <span>•</span>
                        <span>Roll #{enr.rollNumber}</span>
                        <span>•</span>
                        <span>{enr.academicYear}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        className={`text-[10px] ${
                          enr.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {enr.status}
                      </Badge>
                      <Link
                        href={`/students/${enr.studentId}`}
                        className="p-1 text-slate-400 hover:text-blue-600"
                        title="View Student"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions Panel (1 Column) */}
          <div className="space-y-6">
            <div className="rounded-3xl bg-white dark:bg-[#141824] p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-handwriting flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                <span>Admin Quick Actions</span>
              </h3>

              <div className="space-y-2.5">
                <Link
                  href="/students/new"
                  className="flex items-center justify-between p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-100/70 border border-blue-200/60 dark:border-blue-900/40 transition-colors text-xs font-bold text-blue-800 dark:text-blue-200 group"
                >
                  <div className="flex items-center gap-2.5">
                    <Plus className="h-4 w-4 text-blue-600" />
                    <span>Admit New Student</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/teachers"
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/70 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-slate-200/60 dark:border-slate-800 transition-colors text-xs font-semibold text-slate-800 dark:text-slate-200 group"
                >
                  <div className="flex items-center gap-2.5">
                    <GraduationCap className="h-4 w-4 text-purple-500" />
                    <span>Manage Teachers & Faculty</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/academics"
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/70 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200/60 dark:border-slate-800 transition-colors text-xs font-semibold text-slate-800 dark:text-slate-200 group"
                >
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="h-4 w-4 text-amber-500" />
                    <span>Classes & Curriculum Subjects</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/enrollments"
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/70 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200/60 dark:border-slate-800 transition-colors text-xs font-semibold text-slate-800 dark:text-slate-200 group"
                >
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="h-4 w-4 text-blue-500" />
                    <span>Promote & Enroll Cohorts</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/audit-logs"
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/70 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200/60 dark:border-slate-800 transition-colors text-xs font-semibold text-slate-800 dark:text-slate-200 group"
                >
                  <div className="flex items-center gap-2.5">
                    <Activity className="h-4 w-4 text-amber-500" />
                    <span>Security Audit Logs</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Academic Calendar Widget (Mock + Demo Data Badge) */}
            <div className="rounded-3xl bg-[#FAF9F6] dark:bg-[#141824] p-5 border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-indigo-500" />
                  Upcoming Term Events
                </span>
                <Badge variant="outline" className="text-[9px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300">
                  Demo data
                </Badge>
              </div>

              <div className="space-y-2 text-slate-600 dark:text-slate-400 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                  <span>Mid-Term Examinations</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Dec 15 - 22</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                  <span>Parent-Teacher Meeting</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Jan 10, 2027</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleProtectedLayout>
  );
}
