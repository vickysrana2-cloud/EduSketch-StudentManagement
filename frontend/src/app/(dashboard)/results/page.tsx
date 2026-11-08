"use client";

import React, { useState, useEffect } from "react";
import {
  Award,
  Search,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  FileText,
  Star,
  Sparkles,
  Edit3,
  X,
  Printer,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { DoodleSpark, DoodleStar } from "@/components/ui/doodles";
import {
  getMockResults,
  getMockStudentReportCard,
  getMockMarksByExamAndClass,
  submitMockStudentMarks,
  MockResultItem,
  MockStudentMarkEntry,
} from "@/services/mockAcademicApi";

export default function ResultsPage() {
  const [activeTab, setActiveTab] = useState<"results" | "marks">("results");
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [results, setResults] = useState<MockResultItem[]>([]);
  const [marksData, setMarksData] = useState<MockStudentMarkEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<any | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSavingMarks, setIsSavingMarks] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    Promise.all([
      getMockResults(),
      getMockMarksByExamAndClass("ex-01", "Class 10-A"),
    ])
      .then(([resData, marks]) => {
        if (!isMounted) return;
        setResults(resData);
        setMarksData(marks);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenReportCard = async (studentId: string) => {
    try {
      const card = await getMockStudentReportCard(studentId);
      setSelectedStudentForReport(card);
      setIsReportOpen(true);
    } catch (err) {
      toast({
        type: "error",
        title: "Report Error",
        description: "Failed to generate student report card.",
      });
    }
  };

  const handleMarkChange = (studentIndex: number, subjectIndex: number, newScore: number) => {
    setMarksData((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[studentIndex].subjectScores[subjectIndex].marksObtained = Math.min(
        copy[studentIndex].subjectScores[subjectIndex].maxMarks,
        Math.max(0, newScore || 0)
      );
      return copy;
    });
  };

  const handleSaveMarks = async () => {
    setIsSavingMarks(true);
    try {
      await submitMockStudentMarks({
        examId: "ex-01",
        classId: "Class 10-A",
        marksData,
      });
      toast({
        type: "success",
        title: "Marks Saved",
        description: "Subject scores updated in marksheet ledger.",
      });
    } catch (err) {
      toast({
        type: "error",
        title: "Submission Error",
        description: "Could not save marks.",
      });
    } finally {
      setIsSavingMarks(false);
    }
  };

  const filteredResults = results.filter((r) => {
    const matchesSearch =
      r.studentName.toLowerCase().includes(search.toLowerCase()) ||
      r.rollNumber.includes(search);
    const matchesClass = selectedClass === "ALL" || r.className === selectedClass;
    return matchesSearch && matchesClass;
  });

  const passCount = filteredResults.filter((r) => r.status !== "FAILED").length;
  const topScorer = [...filteredResults].sort((a, b) => b.percentage - a.percentage)[0];

  return (
    <div className="space-y-8 pb-10">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Academic Results Engine <DoodleSpark className="h-6 w-6 text-[#36CFC9]" />
            </h1>
            <Badge
              variant="outline"
              className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 font-bold px-2.5 py-0.5 text-xs uppercase tracking-wide"
            >
              Demo data
            </Badge>
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
            Student performance transcripts, GPA calculations, and class marks entry
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl sketch-shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab("results")}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-handwriting transition-all ${
              activeTab === "results"
                ? "bg-white dark:bg-[#141824] text-slate-900 dark:text-slate-100 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Class Results & Transcripts
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("marks")}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-handwriting transition-all ${
              activeTab === "marks"
                ? "bg-white dark:bg-[#141824] text-slate-900 dark:text-slate-100 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Subject Marks Entry
          </button>
        </div>
      </div>

      {/* Demo Notice Banner */}
      <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong>Simulated Academic Module:</strong> Results and Marks endpoints are under active backend design. Connected to <code>mockAcademicApi.ts</code>.
          </span>
        </div>
        <Badge variant="outline" className="border-amber-400 text-amber-700 dark:text-amber-300 shrink-0">
          Demo data
        </Badge>
      </div>

      {activeTab === "results" ? (
        <>
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
                <Star className="h-5 w-5 text-[#FF6FAE]" /> {topScorer?.studentName || "Ananya Patel"}
              </h3>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Score:{" "}
                <span className="font-extrabold text-[#FF6FAE]">
                  {topScorer?.percentage || 95.25}% (GPA {topScorer?.gpa || "4.0"})
                </span>
              </p>
            </div>

            <div className="rounded-3xl bg-[#F4EEFF] dark:bg-[#231B3C] p-6 sketch-shadow space-y-2">
              <p className="text-xs font-bold font-handwriting uppercase tracking-wider text-[#8B6DFF]">
                Average GPA
              </p>
              <h3 className="text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100">
                3.62
              </h3>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Based on Mid-Term Examinations 2026
              </p>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#36CFC9]" />
              <input
                type="text"
                placeholder="🔍 Search student or roll number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-[#141824] border border-slate-200 dark:border-slate-800 text-xs font-bold sketch-shadow-sm focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Filter Cohort:</span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="h-10 px-3 rounded-xl bg-white dark:bg-[#141824] border border-slate-200 dark:border-slate-800 text-xs font-bold sketch-shadow-sm focus:outline-none"
              >
                <option value="ALL">All Cohorts</option>
                <option value="Class 10-A">Class 10-A</option>
                <option value="Class 10-B">Class 10-B</option>
              </select>
            </div>
          </div>

          {/* Results Table */}
          <div className="rounded-3xl bg-white dark:bg-[#141824] p-6 sketch-shadow overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3">Rank</th>
                  <th className="pb-3">Student</th>
                  <th className="pb-3">Class</th>
                  <th className="pb-3">Total Score</th>
                  <th className="pb-3">Percentage</th>
                  <th className="pb-3">GPA / Grade</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Report Card</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredResults.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-4 font-bold font-handwriting text-base">
                      #{item.rank}
                    </td>
                    <td className="py-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {item.studentName}
                      </div>
                      <div className="text-[11px] text-slate-400">Roll: {item.rollNumber}</div>
                    </td>
                    <td className="py-4 font-medium text-slate-600 dark:text-slate-300">
                      {item.className}
                    </td>
                    <td className="py-4 font-semibold text-slate-700 dark:text-slate-200">
                      {item.totalMarksObtained} / {item.totalMaximumMarks}
                    </td>
                    <td className="py-4 font-extrabold text-[#36CFC9]">
                      {item.percentage}%
                    </td>
                    <td className="py-4">
                      <span className="font-bold">{item.gpa}</span>{" "}
                      <Badge variant="blue" className="ml-1 text-[10px]">
                        {item.grade}
                      </Badge>
                    </td>
                    <td className="py-4">
                      <Badge
                        variant={
                          item.status === "DISTINCTION"
                            ? "pink"
                            : item.status === "PASSED"
                            ? "green"
                            : "coral"
                        }
                      >
                        {item.status}
                      </Badge>
                    </td>
                    <td className="py-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenReportCard(item.id)}
                        className="text-xs font-handwriting gap-1"
                      >
                        <FileText className="h-3.5 w-3.5" /> View Card
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Marks Entry Workspace */
        <div className="rounded-3xl bg-white dark:bg-[#141824] p-6 sm:p-8 sketch-shadow space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-2xl font-bold font-handwriting text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Subject Marks Ledger <Edit3 className="h-5 w-5 text-[#36CFC9]" />
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Cohort: Class 10-A • Mid-Term Examinations 2026
              </p>
            </div>

            <Button
              variant="blue"
              onClick={handleSaveMarks}
              isLoading={isSavingMarks}
              className="font-handwriting text-base gap-2"
            >
              Save Marks Ledger
            </Button>
          </div>

          <div className="space-y-4">
            {marksData.map((student, sIdx) => (
              <div
                key={student.studentId}
                className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-[#36CFC9] text-white flex items-center justify-center font-bold text-xs font-handwriting">
                      {student.rollNumber}
                    </div>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {student.studentName}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    Roll: {student.rollNumber}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {student.subjectScores.map((subj, subIdx) => (
                    <div
                      key={subj.subjectName}
                      className="p-3 rounded-xl bg-white dark:bg-[#141824] border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-2"
                    >
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                        {subj.subjectName}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="number"
                          value={subj.marksObtained}
                          onChange={(e) =>
                            handleMarkChange(sIdx, subIdx, parseInt(e.target.value) || 0)
                          }
                          className="w-14 h-8 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-center font-bold text-xs border border-slate-200 dark:border-slate-700"
                        />
                        <span className="text-[11px] text-slate-400">/{subj.maxMarks}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report Card Modal */}
      {isReportOpen && selectedStudentForReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-[#141824] p-6 sm:p-8 sketch-shadow space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold font-handwriting text-slate-900 dark:text-slate-100">
                    Official Student Transcript
                  </h3>
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-[10px]">
                    Demo data
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedStudentForReport.studentName} • Roll {selectedStudentForReport.rollNumber} • {selectedStudentForReport.className}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsReportOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Marks</span>
                <p className="text-lg font-extrabold font-handwriting text-slate-900 dark:text-slate-100">
                  {selectedStudentForReport.totalMarksObtained} / {selectedStudentForReport.totalMaximumMarks}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-[#EFFFF7] dark:bg-[#0F2D25]">
                <span className="text-[10px] font-bold text-[#48C78E] uppercase">GPA</span>
                <p className="text-lg font-extrabold font-handwriting text-[#48C78E]">
                  {selectedStudentForReport.gpa} ({selectedStudentForReport.grade})
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-[#FFF0F6] dark:bg-[#361726]">
                <span className="text-[10px] font-bold text-[#FF6FAE] uppercase">Class Rank</span>
                <p className="text-lg font-extrabold font-handwriting text-[#FF6FAE]">
                  #{selectedStudentForReport.rank}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Subject Performance Breakdown
              </h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                {selectedStudentForReport.subjectBreakdown?.map((item: any) => (
                  <div
                    key={item.subject}
                    className="flex items-center justify-between p-3 text-xs bg-white dark:bg-[#141824]"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {item.subject}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-600 dark:text-slate-400">
                        {item.score} / {item.max}
                      </span>
                      <Badge variant="blue" className="text-[10px]">
                        {item.grade}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedStudentForReport.remarks && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300 italic">
                “{selectedStudentForReport.remarks}”
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3">
              <Button variant="outline" onClick={() => setIsReportOpen(false)}>
                Close
              </Button>
              <Button
                variant="blue"
                onClick={() => {
                  toast({
                    type: "success",
                    title: "Printing Transcript",
                    description: "Sent to printer queue.",
                  });
                }}
                className="font-handwriting gap-1.5"
              >
                <Printer className="h-4 w-4" /> Print Transcript
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
