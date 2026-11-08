"use client";

import React, { useMemo } from "react";
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
  User,
  Clock,
  Sparkles,
  CheckCircle2,
  Calendar,
  BookMarked,
  MapPin,
  Shield,
} from "lucide-react";

import { useAppSelector } from "@/store/hooks";
import { RoleProtectedLayout } from "@/components/layouts/RoleProtectedLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/ui/user-avatar";
import { DoodleSpark } from "@/components/ui/doodles";
import { useGetMyStudentProfileQuery } from "@/store/api/studentApi";
import { useGetEnrollmentsQuery } from "@/store/api/enrollmentApi";
import { useGetSubjectsQuery } from "@/store/api/academicApi";

export default function StudentDashboardPage() {
  const { user } = useAppSelector((state) => state.auth);

  // ============================================================================
  // Live Data Queries
  // ============================================================================

  const { data: studentProfileResponse, isLoading: isProfileLoading } =
    useGetMyStudentProfileQuery();

  const student =
    (studentProfileResponse as any)?.data || (studentProfileResponse as any)?.student;

  const studentId = student?.id || student?._id;

  const { data: enrollmentsData, isLoading: isEnrollmentsLoading } =
    useGetEnrollmentsQuery(
      { studentId: studentId ? String(studentId) : undefined },
      { skip: !studentId }
    );

  const enrollments = enrollmentsData?.items || [];
  const activeEnrollment = useMemo(() => {
    return (
      enrollments.find((e) => e.status === "ACTIVE") ||
      enrollments[0] ||
      null
    );
  }, [enrollments]);

  // Query subjects for the student's enrolled class
  const classId = activeEnrollment?.classId;
  const { data: subjectsData, isLoading: isSubjectsLoading } = useGetSubjectsQuery(
    { classId: classId ? String(classId) : undefined },
    { skip: !classId }
  );

  const subjects =
    (subjectsData as any)?.items ||
    (Array.isArray(subjectsData) ? subjectsData : []);

  return (
    <RoleProtectedLayout allowedRoles={["STUDENT"]}>
      <div className="space-y-8 pb-10 max-w-7xl mx-auto">
        {/* Welcome Notebook Banner */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[#EFFFF7] via-[#EAF6FF] to-[#FFFBE5] dark:from-[#112F24] dark:via-[#112338] dark:to-[#362E12] p-6 md:p-8 sketch-shadow rotate-sketch-sm overflow-hidden border border-emerald-200/60 dark:border-emerald-900/60">
          <div className="tape-accent" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <UserAvatar
                src={student?.profileImage || user?.profileImage}
                name={student?.name || user?.name}
                size="xl"
                shape="rounded-2xl"
                variant="emerald"
                className="hidden sm:flex shadow-md ring-2 ring-emerald-200 dark:ring-emerald-900 shrink-0"
              />
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <Badge variant="green" className="text-sm px-3 py-1 font-bold">
                    🎒 Student Learning Portal
                  </Badge>
                  <DoodleSpark className="h-5 w-5 text-emerald-500" />
                </div>

                <h1 className="text-3xl md:text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 leading-tight">
                  Hey, {student?.name || user?.name || "Student"}! 🌟
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base leading-relaxed font-medium">
                  Academic progress portal. Live profile populated from <code>/student-profiles/me</code> and current classroom enrollments.
                </p>
              </div>
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

        {/* Real-time Student Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Enrolled Classroom */}
          <div className="relative rounded-3xl bg-[#EAF6FF] dark:bg-[#112338] p-6 sketch-shadow hover:-translate-y-1 transition-all duration-300 rotate-sketch-left border border-blue-200/80 dark:border-blue-900/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-[#4D9FFF] dark:text-[#8DD8FF]">
                  Enrolled Class
                </p>
                <h3 className="text-3xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 mt-1 truncate max-w-[170px]">
                  {isEnrollmentsLoading
                    ? "..."
                    : activeEnrollment?.className || student?.class || "Unassigned"}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[#4D9FFF] text-white flex items-center justify-center sketch-shadow-sm shadow-[0_4px_12px_rgba(77,159,255,0.3)]">
                <BookOpen className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-blue-200/60 dark:border-blue-800/40 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <span>Term: {activeEnrollment?.academicYear || "2026-2027"}</span>
              <Badge variant="outline" className="text-[10px]">
                {activeEnrollment?.status || "ACTIVE"}
              </Badge>
            </div>
          </div>

          {/* Roll Number & Admission No */}
          <div className="relative rounded-3xl bg-[#FFFBE5] dark:bg-[#362E12] p-6 sketch-shadow hover:-translate-y-1 transition-all duration-300 border border-amber-200/80 dark:border-amber-900/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-[#FFC83D] dark:text-[#FFE27A]">
                  Roll Number
                </p>
                <h3 className="text-3xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 mt-1">
                  #{activeEnrollment?.rollNumber || "01"}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[#FFC83D] text-white flex items-center justify-center sketch-shadow-sm shadow-[0_4px_12px_rgba(255,200,61,0.3)]">
                <GraduationCap className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-amber-200/60 dark:border-amber-800/40 text-xs text-slate-600 dark:text-slate-300 font-mono truncate">
              Adm No: <strong>{student?.admissionNumber || student?.admissionNo || "ADM-2026"}</strong>
            </div>
          </div>

          {/* Enrolled Subjects Count */}
          <div className="relative rounded-3xl bg-[#F4EEFF] dark:bg-[#231B3C] p-6 sketch-shadow hover:-translate-y-1 transition-all duration-300 border border-purple-200/80 dark:border-purple-900/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-[#8B6DFF] dark:text-[#C5A7FF]">
                  Course Subjects
                </p>
                <h3 className="text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 mt-1">
                  {isSubjectsLoading ? "..." : subjects.length || 6}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[#8B6DFF] text-white flex items-center justify-center sketch-shadow-sm shadow-[0_4px_12px_rgba(139,109,255,0.3)]">
                <BookMarked className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-purple-200/60 dark:border-purple-800/40 text-xs text-slate-600 dark:text-slate-300">
              <span>Classroom curriculum modules</span>
            </div>
          </div>

          {/* Student Attendance Rate (Mock + Demo Data Badge) */}
          <div className="relative rounded-3xl bg-[#EFFFF7] dark:bg-[#112F24] p-6 sketch-shadow hover:-translate-y-1 transition-all duration-300 rotate-sketch-right border border-emerald-200/80 dark:border-emerald-900/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-[#48C78E] dark:text-[#8DE5C1]">
                    My Attendance
                  </p>
                  <Badge variant="outline" className="text-[9px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300">
                    Demo data
                  </Badge>
                </div>
                <h3 className="text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 mt-1">
                  94.8%
                </h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[#48C78E] text-white flex items-center justify-center sketch-shadow-sm shadow-[0_4px_12px_rgba(72,199,142,0.3)]">
                <CalendarCheck className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/40 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1 font-semibold text-emerald-600">
              <TrendingUp className="h-3.5 w-3.5" /> 112 of 118 Sessions Attended
            </div>
          </div>
        </div>

        {/* Subjects & Enrollments History Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Real Enrolled Subjects (2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl bg-white dark:bg-[#141824] p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#4D9FFF]">
                    <BookMarked className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white font-handwriting">
                      Enrolled Curriculum Subjects
                    </h3>
                    <p className="text-xs text-slate-500">
                      Subjects mapped to your active class ({activeEnrollment?.className || "Grade Cohort"})
                    </p>
                  </div>
                </div>

                <Badge variant="blue" className="text-xs">
                  {subjects.length} Subjects
                </Badge>
              </div>

              {subjects.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 italic">
                  No subjects linked to this class yet. Your teachers will publish subjects shortly.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {subjects.map((sub: any) => (
                    <div
                      key={sub.id || sub._id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {sub.name}
                        </span>
                        <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 text-[10px] font-mono">
                          {sub.code}
                        </Badge>
                      </div>

                      <div className="text-xs text-slate-500 flex items-center justify-between pt-1">
                        <span>Term: {sub.academicYear}</span>
                        {sub.teachers && sub.teachers.length > 0 && (
                          <span className="truncate max-w-[120px]" title={sub.teachers[0].name}>
                            Teacher: {sub.teachers[0].name}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Academic Enrollment History */}
            <div className="rounded-3xl bg-white dark:bg-[#141824] p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-handwriting flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-500" />
                <span>Enrollment History Timeline</span>
              </h3>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {enrollments.map((enr) => (
                  <div key={enr.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white text-sm">
                        {enr.className}
                      </div>
                      <div className="text-slate-500">
                        Academic Year: <strong>{enr.academicYear}</strong> • Roll #{enr.rollNumber}
                      </div>
                    </div>
                    <Badge
                      className={`text-[10px] ${
                        enr.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {enr.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Timetable Widget & Profile Summary (1 Column) */}
          <div className="space-y-6">
            {/* Weekly Timetable Schedule (Mock + Demo Data Badge) */}
            <div className="rounded-3xl bg-white dark:bg-[#141824] p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-handwriting flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-emerald-500" />
                  <span>Today's Timetable</span>
                </h3>
                <Badge variant="outline" className="text-[9px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300">
                  Demo data
                </Badge>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40 space-y-0.5">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    <span>Mathematics</span>
                    <span className="font-mono text-[11px]">09:00 AM</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    Algebra & Quadratic Equations
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-0.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span>Physical Sciences</span>
                    <span className="font-mono text-[11px]">10:45 AM</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Electromagnetism Lab
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-0.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span>English Literature</span>
                    <span className="font-mono text-[11px]">01:30 PM</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Essay Writing & Vocabulary
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Link Card */}
            <div className="rounded-3xl bg-[#FAF9F6] dark:bg-[#141824] p-5 border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs">
              <h4 className="font-bold text-slate-700 dark:text-slate-300">
                Examination Report Cards
              </h4>
              <p className="text-slate-500">
                View your graded examination scores and download semester transcripts.
              </p>
              <Link href="/results">
                <Button variant="green" size="sm" className="w-full text-xs font-bold mt-1">
                  View My Results &rarr;
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </RoleProtectedLayout>
  );
}
