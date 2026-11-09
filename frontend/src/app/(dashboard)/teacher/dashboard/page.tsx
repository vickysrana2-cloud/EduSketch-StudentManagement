"use client";

import React, { useMemo } from "react";
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
  GraduationCap,
  Sparkles,
  Layers,
  Calendar,
  Briefcase,
  BookMarked,
} from "lucide-react";

import { useAppSelector } from "@/store/hooks";
import { RoleProtectedLayout } from "@/components/layouts/RoleProtectedLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/ui/user-avatar";
import { DoodleSpark } from "@/components/ui/doodles";
import { useGetMyTeacherProfileQuery } from "@/store/api/teacherApi";
import { useGetClassesQuery, useGetSubjectsQuery } from "@/store/api/academicApi";

export default function TeacherDashboardPage() {
  const { user } = useAppSelector((state) => state.auth);

  // ============================================================================
  // Live API Queries
  // ============================================================================

  const { data: teacherProfileResponse, isLoading: isProfileLoading } =
    useGetMyTeacherProfileQuery();

  const teacher = (teacherProfileResponse as any)?.data || (teacherProfileResponse as any)?.teacher;

  const { data: classesData, isLoading: isClassesLoading } = useGetClassesQuery();
  const { data: subjectsData, isLoading: isSubjectsLoading } = useGetSubjectsQuery();

  const allClasses = (classesData as any)?.items || (Array.isArray(classesData) ? classesData : []);
  const allSubjects = (subjectsData as any)?.items || (Array.isArray(subjectsData) ? subjectsData : []);

  // Filter assigned classes
  const assignedClasses = useMemo(() => {
    if (!teacher) return [];
    const assignedIds = new Set(
      Array.isArray(teacher.assignedClassIds)
        ? teacher.assignedClassIds.map((id: any) => String(id))
        : []
    );

    return allClasses.filter(
      (c: any) =>
        assignedIds.has(String(c.id || c._id)) ||
        c.classTeacherId === teacher.id ||
        (Array.isArray(teacher.assignedClasses) &&
          teacher.assignedClasses.includes(c.name))
    );
  }, [teacher, allClasses]);

  // Filter assigned subjects
  const assignedSubjects = useMemo(() => {
    if (!teacher) return [];
    const assignedSubIds = new Set(
      Array.isArray(teacher.assignedSubjectIds)
        ? teacher.assignedSubjectIds.map((id: any) => String(id))
        : []
    );

    return allSubjects.filter(
      (s: any) =>
        assignedSubIds.has(String(s.id || s._id)) ||
        (Array.isArray(s.teachers) &&
          s.teachers.some((t: any) => t.id === teacher.id || t.name === teacher.name)) ||
        (Array.isArray(teacher.specialization) &&
          teacher.specialization.includes(s.name))
    );
  }, [teacher, allSubjects]);

  return (
    <RoleProtectedLayout allowedRoles={["TEACHER"]}>
      <div className="space-y-8 pb-10 max-w-7xl mx-auto">
        {/* Welcome Notebook Banner */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[#F4EEFF] via-[#FFF0F6] to-[#FFFBE5] dark:from-[#231B3C] dark:via-[#361726] dark:to-[#362E12] p-6 md:p-8 sketch-shadow rotate-sketch-sm overflow-hidden border border-violet-200/60 dark:border-violet-900/60">
          <div className="tape-accent" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <UserAvatar
                src={teacher?.profileImage || user?.profileImage || (user as any)?.avatar}
                name={teacher?.name || user?.name}
                size="xl"
                shape="rounded-2xl"
                variant="purple"
                className="hidden sm:flex shadow-md ring-2 ring-violet-200 dark:ring-violet-900 shrink-0"
              />
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <Badge variant="purple" className="text-sm px-3 py-1 font-bold">
                    👩‍🏫 Faculty Workspace
                  </Badge>
                  <DoodleSpark className="h-5 w-5 text-violet-500" />
                </div>

                <h1 className="text-3xl md:text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 leading-tight">
                  Welcome back, {teacher?.name || user?.name || "Professor"}! 📚
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base leading-relaxed font-medium">
                  Academic classroom workspace. Assigned cohorts and curriculum modules are populated directly from your active faculty profile (<code>/teacher-profiles/me</code>).
                </p>
              </div>
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

        {/* Real-time Faculty Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Assigned Classes */}
          <div className="relative rounded-3xl bg-[#F4EEFF] dark:bg-[#231B3C] p-6 sketch-shadow hover:-translate-y-1 transition-all duration-300 rotate-sketch-left border border-purple-200/80 dark:border-purple-900/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  Assigned Classes
                </p>
                <h3 className="text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 mt-1">
                  {isProfileLoading ? "..." : assignedClasses.length || teacher?.assignedClasses?.length || 0}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center sketch-shadow-sm shadow-[0_4px_12px_rgba(139,109,255,0.3)]">
                <BookOpen className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-purple-200/60 dark:border-purple-800/40 text-xs font-semibold text-slate-600 dark:text-slate-300">
              {assignedClasses.length > 0
                ? assignedClasses.map((c: any) => c.name).slice(0, 3).join(", ")
                : "No cohorts assigned yet"}
            </div>
          </div>

          {/* Assigned Curriculum Subjects */}
          <div className="relative rounded-3xl bg-[#EAF6FF] dark:bg-[#112338] p-6 sketch-shadow hover:-translate-y-1 transition-all duration-300 border border-blue-200/80 dark:border-blue-900/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-[#4D9FFF] dark:text-[#8DD8FF]">
                  Assigned Subjects
                </p>
                <h3 className="text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 mt-1">
                  {isProfileLoading ? "..." : assignedSubjects.length || teacher?.specialization?.length || 0}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[#4D9FFF] text-white flex items-center justify-center sketch-shadow-sm shadow-[0_4px_12px_rgba(77,159,255,0.3)]">
                <BookMarked className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-blue-200/60 dark:border-blue-800/40 text-xs text-slate-600 dark:text-slate-300 font-medium truncate">
              {teacher?.specialization?.length > 0
                ? teacher.specialization.join(", ")
                : "Active teaching load"}
            </div>
          </div>

          {/* Faculty Credentials Card */}
          <div className="relative rounded-3xl bg-[#FFFBE5] dark:bg-[#362E12] p-6 sketch-shadow hover:-translate-y-1 transition-all duration-300 border border-amber-200/80 dark:border-amber-900/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-[#FFC83D] dark:text-[#FFE27A]">
                  Faculty Experience
                </p>
                <h3 className="text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 mt-1">
                  {teacher?.experienceYears ?? 5} <span className="text-lg">Years</span>
                </h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[#FFC83D] text-white flex items-center justify-center sketch-shadow-sm shadow-[0_4px_12px_rgba(255,200,61,0.3)]">
                <Briefcase className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-amber-200/60 dark:border-amber-800/40 text-xs text-slate-600 dark:text-slate-300 truncate">
              Emp ID: <strong>{teacher?.employeeId || "FAC-001"}</strong> • {teacher?.qualification || "M.Ed Faculty"}
            </div>
          </div>

          {/* Class Attendance Rate (Mock + Demo Data Badge) */}
          <div className="relative rounded-3xl bg-[#EFFFF7] dark:bg-[#112F24] p-6 sketch-shadow hover:-translate-y-1 transition-all duration-300 rotate-sketch-right border border-emerald-200/80 dark:border-emerald-900/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-[#48C78E] dark:text-[#8DE5C1]">
                    Class Attendance
                  </p>
                  <Badge variant="outline" className="text-[9px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300">
                    Demo data
                  </Badge>
                </div>
                <h3 className="text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 mt-1">
                  95.8%
                </h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[#48C78E] text-white flex items-center justify-center sketch-shadow-sm shadow-[0_4px_12px_rgba(72,199,142,0.3)]">
                <CalendarCheck className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <span className="text-emerald-600 font-semibold">Average cohort attendance</span>
              <Link href="/attendance" className="hover:underline font-bold text-emerald-600">
                Log &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Assigned Classes & Subjects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assigned Classes & Subjects Detail (2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Assigned Classes Cards */}
            <div className="rounded-3xl bg-white dark:bg-[#141824] p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white font-handwriting">
                      My Assigned Classes
                    </h3>
                    <p className="text-xs text-slate-500">
                      Cohorts allocated to you from <code>/teacher-profiles/me</code>
                    </p>
                  </div>
                </div>
              </div>

              {assignedClasses.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 italic">
                  No active classes linked to your teacher profile yet. Please ask your administrator to allocate cohorts.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {assignedClasses.map((c: any) => (
                    <div
                      key={c.id || c._id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2 hover:border-purple-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900 dark:text-white font-handwriting">
                          {c.name}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          Grade {c.grade} • Sec {c.section}
                        </Badge>
                      </div>

                      <div className="text-xs text-slate-500 space-y-0.5">
                        <div>Room: <strong>{c.roomNumber || "Campus Wing A"}</strong></div>
                        <div>Capacity: <strong>{c.capacity || 40} Students</strong></div>
                        <div>Term: <strong>{c.academicYear}</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assigned Subjects Cards */}
            <div className="rounded-3xl bg-white dark:bg-[#141824] p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600">
                    <BookMarked className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white font-handwriting">
                      Assigned Subjects & Curriculum
                    </h3>
                    <p className="text-xs text-slate-500">
                      Curriculum courses you instruct and evaluate
                    </p>
                  </div>
                </div>
              </div>

              {assignedSubjects.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 italic">
                  {teacher?.specialization?.length > 0 ? (
                    <div className="flex flex-wrap gap-2 justify-center">
                      {teacher.specialization.map((spec: string, idx: number) => (
                        <Badge key={idx} variant="blue" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    "No specific subject records mapped to your teacher profile yet."
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {assignedSubjects.map((s: any) => (
                    <div
                      key={s.id || s._id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {s.name}
                        </span>
                        <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 text-[10px] font-mono">
                          {s.code}
                        </Badge>
                      </div>

                      <div className="text-xs text-slate-500">
                        {s.className ? (
                          <span>Target: <strong>{s.className}</strong></span>
                        ) : (
                          <span>Academic Term: <strong>{s.academicYear}</strong></span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Daily Schedule Widget (Mock + Demo Data Badge) (1 Column) */}
          <div className="space-y-6">
            <div className="rounded-3xl bg-white dark:bg-[#141824] p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-handwriting flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-violet-500" />
                  <span>Today's Class Schedule</span>
                </h3>
                <Badge variant="outline" className="text-[9px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300">
                  Demo data
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-violet-50/60 dark:bg-violet-950/40 border border-violet-200/60 dark:border-violet-900/40 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-violet-900 dark:text-violet-200">
                    <span>Period 1: Mathematics</span>
                    <span className="font-mono text-[11px]">09:00 - 09:45 AM</span>
                  </div>
                  <div className="text-xs text-violet-700 dark:text-violet-300">
                    Grade 10-A • Room 204
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span>Period 3: Physics Laboratory</span>
                    <span className="font-mono text-[11px]">11:00 - 11:45 AM</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Grade 9-B • Science Lab
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span>Period 5: Tutorial & Mentorship</span>
                    <span className="font-mono text-[11px]">02:00 - 02:45 PM</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Grade 10-C • Room 102
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Link Card */}
            <div className="rounded-3xl bg-[#FAF9F6] dark:bg-[#141824] p-5 border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs">
              <h4 className="font-bold text-slate-700 dark:text-slate-300">
                Faculty Grading & Records
              </h4>
              <p className="text-slate-500">
                Need to submit examination scores or publish term marks for your cohorts?
              </p>
              <Link href="/results">
                <Button variant="outline" size="sm" className="w-full text-xs font-bold mt-1">
                  Go to Results & Grading &rarr;
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </RoleProtectedLayout>
  );
}
