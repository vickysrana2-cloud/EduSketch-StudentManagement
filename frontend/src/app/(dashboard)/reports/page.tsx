"use client";

import React from "react";
import { FileSpreadsheet, Download, Printer, BarChart3, FileText, CheckCircle2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { DoodleSpark, DoodleStar } from "@/components/ui/doodles";

const reportModules = [
  {
    title: "Student Roster Report",
    description: "Complete list of enrolled students, age distribution, contact emails, and class enrollments.",
    type: "CSV / Excel / PDF",
    color: "pink" as const,
    bg: "bg-[#FFF0F6] dark:bg-[#361726]",
    iconColor: "text-[#FF6FAE]",
  },
  {
    title: "Monthly Attendance Summary",
    description: "Detailed daily presence rates, absenteeism patterns, and monthly class attendance percentages.",
    type: "PDF / Excel",
    color: "green" as const,
    bg: "bg-[#EFFFF7] dark:bg-[#0F2D25]",
    iconColor: "text-[#48C78E]",
  },
  {
    title: "Academic Examination Transcripts",
    description: "Subject score marksheets, grade point averages, class rankings, and teacher remarks.",
    type: "Official PDF Marksheet",
    color: "purple" as const,
    bg: "bg-[#F4EEFF] dark:bg-[#231B3C]",
    iconColor: "text-[#8B6DFF]",
  },
  {
    title: "Faculty & Teacher Directory",
    description: "Teacher contact information, department subject assignments, and class load distribution.",
    type: "CSV / PDF",
    color: "yellow" as const,
    bg: "bg-[#FFFBE5] dark:bg-[#362E12]",
    iconColor: "text-[#FF9F43]",
  },
];

export default function ReportsPage() {
  const { toast } = useToast();

  const handleExport = (reportTitle: string, format: string) => {
    toast({
      type: "success",
      title: "Report Generated!",
      description: `${reportTitle} exported successfully in ${format} format.`,
    });
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Reports & Analytics <DoodleSpark className="h-6 w-6 text-[#FF9F43]" />
          </h1>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
            Export administrative summaries, PDF report cards, and attendance spreadsheets
          </p>
        </div>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportModules.map((module, idx) => (
          <div
            key={idx}
            className={`rounded-3xl ${module.bg} p-6 sketch-shadow space-y-4 hover:-translate-y-1 transition-all duration-300`}
          >
            <div className="flex items-start justify-between gap-3 pb-3">
              <div className="space-y-1">
                <h3 className="text-2xl font-bold font-handwriting text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FileSpreadsheet className={`h-6 w-6 ${module.iconColor}`} /> {module.title}
                </h3>
                <Badge variant={module.color}>{module.type}</Badge>
              </div>
            </div>

            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              {module.description}
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-3">
              <Button
                variant={module.color}
                size="sm"
                onClick={() => handleExport(module.title, "PDF")}
                className="font-handwriting text-sm gap-1.5"
              >
                <Download className="h-4 w-4" /> Export PDF
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport(module.title, "CSV")}
                className="font-handwriting text-sm gap-1.5"
              >
                <FileText className="h-4 w-4" /> Export CSV
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
