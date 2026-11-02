"use client";

import React, { useState } from "react";
import { Award, Search, TrendingUp, CheckCircle, AlertTriangle, FileText, Star } from "lucide-react";
import { useGetResultsQuery } from "@/store/api/resultApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DoodleSpark, DoodleStar } from "@/components/ui/doodles";

const mockResults = [
  { id: 1, studentName: "Eleanor Vance", email: "eleanor@school.edu", class: "Class 10", totalMarks: 472, maxMarks: 500, percentage: 94.4, gpa: "4.0", grade: "A+", status: "PASSED" },
  { id: 2, name: "Leo Vance", studentName: "Leo Vance", email: "leo@school.edu", class: "Class 10", totalMarks: 435, maxMarks: 500, percentage: 87.0, gpa: "3.7", grade: "A", status: "PASSED" },
  { id: 3, studentName: "Sophia Martinez", email: "sophia@school.edu", class: "Class 10", totalMarks: 390, maxMarks: 500, percentage: 78.0, gpa: "3.2", grade: "B+", status: "PASSED" },
  { id: 4, studentName: "Lucas Scott", email: "lucas@school.edu", class: "Class 10", totalMarks: 295, maxMarks: 500, percentage: 59.0, gpa: "2.1", grade: "C", status: "NEEDS_IMPROVEMENT" },
  { id: 5, studentName: "Amara Johnson", email: "amara@school.edu", class: "Class 10", totalMarks: 460, maxMarks: 500, percentage: 92.0, gpa: "3.9", grade: "A+", status: "PASSED" },
];

export default function ResultsPage() {
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("ALL");
  const { data, isLoading } = useGetResultsQuery({});

  const resultList = data?.data && data.data.length > 0 ? data.data : mockResults;

  const filteredResults = (resultList as any[]).filter((r) => {
    const matchesSearch =
      (r.studentName || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.email || "").toLowerCase().includes(search.toLowerCase());
    const matchesClass = selectedClass === "ALL" || r.class === selectedClass;
    return matchesSearch && matchesClass;
  });

  const passCount = filteredResults.filter((r) => (r.percentage || 0) >= 60).length;
  const topScorer = [...filteredResults].sort((a, b) => (b.percentage || 0) - (a.percentage || 0))[0];

  return (
    <div className="space-y-8 pb-10">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Academic Results Engine <DoodleSpark className="h-6 w-6 text-[#36CFC9]" />
          </h1>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
            Student performance transcripts, GPA calculations, and class rank distributions
          </p>
        </div>

        <Button variant="blue" className="font-handwriting text-lg gap-2">
          <FileText className="h-5 w-5" /> Generate Transcript Summary
        </Button>
      </div>

      {/* Analytics Summary Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="rounded-3xl bg-[#EAF6FF] dark:bg-[#112338] p-6 sketch-shadow space-y-2">
          <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-[#36CFC9]">
            Pass Rate
          </p>
          <h3 className="text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100">
            {filteredResults.length > 0 ? Math.round((passCount / filteredResults.length) * 100) : 100}%
          </h3>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {passCount} of {filteredResults.length} students passed threshold
          </p>
        </div>

        <div className="rounded-3xl bg-[#FFF0F6] dark:bg-[#361726] p-6 sketch-shadow space-y-2">
          <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-[#FF6FAE]">
            Top Class Scorer
          </p>
          <h3 className="text-2xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Star className="h-5 w-5 text-[#FF6FAE]" /> {topScorer?.studentName || "Eleanor Vance"}
          </h3>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Score: <span className="font-extrabold text-[#FF6FAE]">{topScorer?.percentage || 94.4}% (GPA {topScorer?.gpa || "4.0"})</span>
          </p>
        </div>

        <div className="rounded-3xl bg-[#F4EEFF] dark:bg-[#231B3C] p-6 sketch-shadow space-y-2">
          <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-[#8B6DFF]">
            Average GPA
          </p>
          <h3 className="text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100">
            3.54
          </h3>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Based on Term 1 mid-year examinations
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#36CFC9]" />
          <input
            type="text"
            placeholder="🔍 Search student by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-[#141824] text-slate-900 dark:text-slate-100 text-sm font-medium focus:outline-none sketch-shadow-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="h-11 px-4 rounded-xl bg-white dark:bg-[#141824] text-slate-900 dark:text-slate-100 font-bold text-xs sketch-shadow-sm focus:outline-none"
          >
            <option value="ALL">All Classes</option>
            <option value="Class 10">Class 10</option>
            <option value="Class 11">Class 11</option>
          </select>
        </div>
      </div>

      {/* Results Table Card */}
      <div className="rounded-3xl bg-white dark:bg-[#141824] p-6 sketch-shadow space-y-4">
        <div className="flex items-center justify-between pb-3">
          <h2 className="text-2xl font-bold font-handwriting text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Result Roll & Transcripts <Award className="h-5 w-5 text-[#36CFC9]" />
          </h2>
          <span className="text-xs font-bold text-[#36CFC9] font-handwriting">
            {filteredResults.length} Student Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-separate border-spacing-y-2">
            <thead>
              <tr className="text-xs font-bold font-handwriting uppercase tracking-wider text-[#36CFC9]">
                <th className="px-4 py-2">Student Name</th>
                <th className="px-4 py-2">Class</th>
                <th className="px-4 py-2">Score</th>
                <th className="px-4 py-2">Percentage</th>
                <th className="px-4 py-2">GPA</th>
                <th className="px-4 py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((r: any) => (
                <tr
                  key={r.id}
                  className="bg-[#EAF6FF]/30 dark:bg-[#112338]/30 rounded-2xl hover:bg-[#EAF6FF] transition-all sketch-shadow-sm"
                >
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-2xl bg-[#36CFC9] text-white flex items-center justify-center font-bold font-handwriting text-sm shadow-xs">
                      {(r.studentName || "S").charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold font-handwriting text-base text-slate-900 dark:text-slate-100 leading-tight">{r.studentName}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{r.email || "student@school.edu"}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300">{r.class || "Class 10"}</td>
                  <td className="px-4 py-3 text-xs font-extrabold text-slate-900 dark:text-slate-100">{r.totalMarks || 450} / {r.maxMarks || 500}</td>
                  <td className="px-4 py-3 text-xs font-extrabold text-[#36CFC9]">{r.percentage || 90}%</td>
                  <td className="px-4 py-3 text-xs">
                    <Badge variant="blue">{r.grade || "A"} ({r.gpa || "3.8"})</Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-bold">
                    {(r.percentage || 90) >= 60 ? (
                      <span className="text-[#48C78E] font-handwriting text-base font-extrabold">Passed ✓</span>
                    ) : (
                      <span className="text-[#FF8066] font-handwriting text-base font-extrabold">Needs Review ⚠️</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

