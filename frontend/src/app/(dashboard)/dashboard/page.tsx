"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  BookOpen,
  CheckCircle,
  Plus,
  TrendingUp,
  Clock,
} from "lucide-react";

import { useAppSelector } from "@/store/hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DoodleSpark, DoodleStar } from "@/components/ui/doodles";
import { useGetStudentsQuery } from "@/store/api/studentApi";

export default function DashboardPage() {
  const { user } = useAppSelector((state) => state.auth);
  const { data: studentsData } = useGetStudentsQuery({ page: 1, limit: 5 });

  const totalStudents = studentsData?.pagination?.totalRecords || 128;

  return (
    <div className="space-y-8 pb-10">
      {/* Hero Welcome Notebook Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#EAF6FF] via-[#F4EEFF] to-[#FFF0F6] dark:from-[#112338] dark:via-[#231B3C] dark:to-[#361726] p-6 md:p-8 sketch-shadow rotate-sketch-sm overflow-hidden">
        <div className="tape-accent" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge variant="blue" className="text-sm px-3 py-1 font-bold">
                ✏️ Academic Session 2026
              </Badge>
              <DoodleSpark className="h-5 w-5 text-[#FF6FAE]" />
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 leading-tight">
              Welcome back, {user?.name || "Admin"}! 👋
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base leading-relaxed font-medium">
              Here is your daily sketchbook overview. Manage classes, record marks, and track student attendance seamlessly.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/students/new">
              <Button variant="blue" size="lg" className="font-handwriting text-lg gap-2">
                <Plus className="h-5 w-5" />
                Add Student
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid with Children Color System */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Students */}
        <div className="relative rounded-3xl bg-[#EAF6FF] dark:bg-[#112338] p-6 sketch-shadow hover:-translate-y-1 transition-all duration-300 rotate-sketch-left">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-[#4D9FFF] dark:text-[#8DD8FF]">
                Total Students
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
            <TrendingUp className="h-3.5 w-3.5 text-[#48C78E]" /> +12 new enrollments
          </p>
        </div>

        {/* Faculty Members */}
        <div className="relative rounded-3xl bg-[#F4EEFF] dark:bg-[#231B3C] p-6 sketch-shadow hover:-translate-y-1 transition-all duration-300 rotate-sketch-right">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-[#8B6DFF] dark:text-[#C5A7FF]">
                Faculty Members
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
            100% active assignments
          </p>
        </div>

        {/* Total Classes */}
        <div className="relative rounded-3xl bg-[#FFFBE5] dark:bg-[#362E12] p-6 sketch-shadow hover:-translate-y-1 transition-all duration-300 rotate-sketch-left">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-[#FF9F43] dark:text-[#FFE27A]">
                Total Classes
              </p>
              <h3 className="text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 mt-1">
                16
              </h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-[#FFC83D] text-slate-900 flex items-center justify-center sketch-shadow-sm shadow-[0_4px_12px_rgba(255,200,61,0.3)]">
              <BookOpen className="h-6 w-6" />
            </div>
          </div>
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-4 flex items-center gap-1">
            Sections A through D
          </p>
        </div>

        {/* Attendance Rate */}
        <div className="relative rounded-3xl bg-[#EFFFF7] dark:bg-[#0F2D25] p-6 sketch-shadow hover:-translate-y-1 transition-all duration-300 rotate-sketch-right">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-[#48C78E] dark:text-[#8DE5C1]">
                Today's Attendance
              </p>
              <h3 className="text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 mt-1">
                94.8%
              </h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-[#48C78E] text-white flex items-center justify-center sketch-shadow-sm shadow-[0_4px_12px_rgba(72,199,142,0.3)]">
              <CheckCircle className="h-6 w-6" />
            </div>
          </div>
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-4 flex items-center gap-1">
            350 students present
          </p>
        </div>
      </div>

      {/* Main Grid: Recent Students Sketch Notebook & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Students Table Notebook */}
        <div className="lg:col-span-2 rounded-3xl bg-[#FFF0F6] dark:bg-[#361726] p-6 sketch-shadow space-y-6">
          <div className="flex items-center justify-between pb-4">
            <div>
              <h2 className="text-2xl font-bold font-handwriting text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Recent Students <DoodleStar className="h-5 w-5 text-[#FF6FAE]" />
              </h2>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Latest student profiles in system database
              </p>
            </div>
            <Link href="/students">
              <Button variant="pink" size="sm" className="text-xs font-bold">
                View All →
              </Button>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-separate border-spacing-y-2">
              <thead>
                <tr className="text-xs font-bold font-handwriting uppercase tracking-wider text-[#FF6FAE] dark:text-[#FFB3D1]">
                  <th className="px-4 py-2">Student</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Age</th>
                  <th className="px-4 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="space-y-2">
                {studentsData?.data?.slice(0, 5).map((s) => (
                  <tr
                    key={s.id}
                    className="bg-white dark:bg-[#141824] rounded-2xl hover:bg-[#FFF0F6]/50 dark:hover:bg-[#361726]/50 transition-all duration-200 sketch-shadow-sm"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[#FF6FAE] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        {s.name?.charAt(0)}
                      </div>
                      {s.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs font-medium">{s.email}</td>
                    <td className="px-4 py-3 text-xs">
                      <Badge variant="pink">
                        {s.age} yrs
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/students/${s.id}`}>
                        <Button size="sm" variant="ghost" className="h-8 text-xs font-bold text-[#FF6FAE] hover:text-[#ED599B]">
                          View details →
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Sketch Notes & Tasks */}
        <div className="rounded-3xl bg-[#FFF1E8] dark:bg-[#3A1F1B] p-6 sketch-shadow space-y-6 rotate-sketch-sm">
          <div className="pb-4">
            <h2 className="text-2xl font-bold font-handwriting text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Quick Reminders <Clock className="h-5 w-5 text-[#FF8066]" />
            </h2>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Pending administrative actions
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#141824] text-slate-900 dark:text-slate-100 text-xs space-y-1 sketch-shadow-sm">
              <span className="font-bold uppercase tracking-wider font-handwriting text-sm text-[#FF8066]">📌 Attendance Alert</span>
              <p className="font-medium text-slate-600 dark:text-slate-300">Section B mid-term attendance verification is due by 4:00 PM today.</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#141824] text-slate-900 dark:text-slate-100 text-xs space-y-1 sketch-shadow-sm">
              <span className="font-bold uppercase tracking-wider font-handwriting text-sm text-[#FF8066]">📝 Examination Schedule</span>
              <p className="font-medium text-slate-600 dark:text-slate-300">Mathematics finals timetable published for Class 10 students.</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#141824] text-slate-900 dark:text-slate-100 text-xs space-y-1 sketch-shadow-sm">
              <span className="font-bold uppercase tracking-wider font-handwriting text-sm text-[#FF8066]">🎓 Report Cards</span>
              <p className="font-medium text-slate-600 dark:text-slate-300">Term 1 result certificates generated for review.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

