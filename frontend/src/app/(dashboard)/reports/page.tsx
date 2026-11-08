"use client";

import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Download,
  Printer,
  BarChart3,
  FileText,
  CheckCircle2,
  Filter,
  Sparkles,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { DoodleSpark, DoodleStar } from "@/components/ui/doodles";
import {
  getMockReportsCatalog,
  generateMockReport,
  MockReportType,
} from "@/services/mockAcademicApi";

export default function ReportsPage() {
  const [reports, setReports] = useState<MockReportType[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    getMockReportsCatalog()
      .then((data) => {
        if (isMounted) setReports(data);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleExport = async (report: MockReportType, format: string) => {
    setGeneratingId(`${report.id}-${format}`);
    try {
      const res = await generateMockReport(report.id, format);
      toast({
        type: "success",
        title: "Report Generated!",
        description: `${report.title} exported as ${res.fileName}.`,
      });
    } catch (err) {
      toast({
        type: "error",
        title: "Generation Failed",
        description: "Could not export report file.",
      });
    } finally {
      setGeneratingId(null);
    }
  };

  const filteredReports = reports.filter(
    (r) => categoryFilter === "ALL" || r.category === categoryFilter
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Reports & Analytics <DoodleSpark className="h-6 w-6 text-[#FF9F43]" />
            </h1>
            <Badge
              variant="outline"
              className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 font-bold px-2.5 py-0.5 text-xs uppercase tracking-wide"
            >
              Demo data
            </Badge>
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
            Export administrative summaries, PDF report cards, and attendance spreadsheets
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
          {["ALL", "Administrative", "Attendance", "Academic", "Financial"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-handwriting transition-all ${
                categoryFilter === cat
                  ? "bg-white dark:bg-[#141824] text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Demo Notice Banner */}
      <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong>Simulated Academic Module:</strong> Asynchronous PDF/CSV reporting microservices are currently simulated via <code>mockAcademicApi.ts</code>.
          </span>
        </div>
        <Badge variant="outline" className="border-amber-400 text-amber-700 dark:text-amber-300 shrink-0">
          Demo data
        </Badge>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-full p-8 text-center text-slate-500 font-handwriting text-lg animate-pulse">
            Loading institutional reports catalogue...
          </div>
        ) : (
          filteredReports.map((report) => (
            <div
              key={report.id}
              className="rounded-3xl bg-white dark:bg-[#141824] border border-slate-100 dark:border-slate-800 p-6 sketch-shadow space-y-4 hover:-translate-y-1 transition-all duration-300 relative group"
            >
              <div className="flex items-start justify-between gap-3 pb-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] font-bold">
                      {report.category}
                    </Badge>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-[10px]">
                      Demo data
                    </Badge>
                  </div>
                  <h3 className="text-2xl font-bold font-handwriting text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FileSpreadsheet className="h-6 w-6 text-[#FF9F43]" /> {report.title}
                  </h3>
                </div>
              </div>

              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                {report.description}
              </p>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Last Generated: {report.lastGenerated}
                </span>
                <span className="font-semibold text-slate-500">{report.format}</span>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Button
                  variant="coral"
                  size="sm"
                  isLoading={generatingId === `${report.id}-PDF`}
                  onClick={() => handleExport(report, "PDF")}
                  className="font-handwriting text-xs gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" /> Export PDF
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  isLoading={generatingId === `${report.id}-Excel`}
                  onClick={() => handleExport(report, "Excel")}
                  className="font-handwriting text-xs gap-1.5"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" /> Export Spreadsheet
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
