"use client";

import React, { useState, useEffect } from "react";
import { ClipboardList, Plus, Calendar, Clock, Award, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { DoodleSpark, DoodleStar } from "@/components/ui/doodles";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  getMockExaminations,
  createMockExamination,
  deleteMockExamination,
  MockExam,
} from "@/services/mockAcademicApi";

const examSchema = z.object({
  name: z.string().min(2, "Exam name required (e.g. Mid-Term 2026)"),
  startDate: z.string().min(1, "Start date required"),
  endDate: z.string().min(1, "End date required"),
  academicSession: z.string().min(1, "Academic session required"),
  status: z.enum(["UPCOMING", "ONGOING", "COMPLETED"]).default("UPCOMING"),
});

type ExamFormData = z.infer<typeof examSchema>;

export default function ExaminationsPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [exams, setExams] = useState<MockExam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExamFormData>({
    resolver: zodResolver(examSchema) as any,
    defaultValues: {
      name: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 10 * 86400000).toISOString().split("T")[0],
      academicSession: "2026-2027",
      status: "UPCOMING",
    },
  });

  const loadExams = async () => {
    setIsLoading(true);
    try {
      const data = await getMockExaminations();
      setExams(data);
    } catch (err) {
      toast({
        type: "error",
        title: "Load Failed",
        description: "Could not fetch examination schedules.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const onSubmitNewExam = async (formData: ExamFormData) => {
    setIsSubmitting(true);
    try {
      const created = await createMockExamination(formData);
      setExams((prev) => [created, ...prev]);
      toast({
        type: "success",
        title: "Exam Scheduled",
        description: `${formData.name} added to examination timetable.`,
      });
      reset();
      setIsAddOpen(false);
    } catch (err: any) {
      toast({
        type: "error",
        title: "Creation Failed",
        description: "Could not add examination schedule.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteMockExamination(deletingId);
      setExams((prev) => prev.filter((e) => e.id !== deletingId));
      toast({
        type: "success",
        title: "Exam Schedule Deleted",
        description: "Examination schedule removed.",
      });
    } catch (err: any) {
      toast({
        type: "error",
        title: "Delete Failed",
        description: "Could not remove examination schedule.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Examinations Hub <DoodleSpark className="h-6 w-6 text-[#FF8066]" />
            </h1>
            <Badge
              variant="outline"
              className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 font-bold px-2.5 py-0.5 text-xs uppercase tracking-wide"
            >
              Demo data
            </Badge>
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
            Manage assessment schedules, term examinations, and session-wide testing dates
          </p>
        </div>

        <Button
          variant="coral"
          onClick={() => setIsAddOpen(true)}
          className="font-handwriting text-lg gap-2"
        >
          <Plus className="h-5 w-5" /> Schedule New Exam
        </Button>
      </div>

      {/* Demo Notice Banner */}
      <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong>Simulated Academic Module:</strong> Exam scheduling controller endpoints will be connected in future backend sprints. Powered by <code>mockAcademicApi.ts</code>.
          </span>
        </div>
        <Badge variant="outline" className="border-amber-400 text-amber-700 dark:text-amber-300 shrink-0">
          Demo data
        </Badge>
      </div>

      {/* Examinations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full p-8 text-center text-slate-500 font-handwriting text-lg animate-pulse">
            Loading examination calendar...
          </div>
        ) : (
          exams.map((exam) => (
            <div
              key={exam.id}
              className="rounded-3xl bg-white dark:bg-[#141824] p-6 sketch-shadow space-y-4 relative group border border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Badge
                    variant={
                      exam.status === "ONGOING"
                        ? "green"
                        : exam.status === "UPCOMING"
                        ? "yellow"
                        : "coral"
                    }
                  >
                    {exam.status}
                  </Badge>
                  <h3 className="text-2xl font-bold font-handwriting text-slate-900 dark:text-slate-100 mt-2">
                    {exam.name}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setDeletingId(exam.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                  title="Remove Examination"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#FF8066]" />
                  <span>
                    {exam.startDate} – {exam.endDate}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-[#FFC83D]" />
                  <span>Session: {exam.academicSession}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-[#8B6DFF]" />
                  <span>Cohorts Enrolled: {exam.totalClasses} classes</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Ref: {exam.id}</span>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-[10px]">
                  Demo data
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Exam Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#141824] p-6 sm:p-8 sketch-shadow space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold font-handwriting text-slate-900 dark:text-slate-100">
                  Schedule New Examination
                </h3>
                <p className="text-xs text-slate-500">Configure session testing dates</p>
              </div>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-xs">
                Demo data
              </Badge>
            </div>

            <form onSubmit={handleSubmit(onSubmitNewExam)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold font-handwriting mb-1 text-slate-800 dark:text-slate-200">
                  Examination Name
                </label>
                <Input
                  {...register("name")}
                  placeholder="e.g. Mid-Term 2026 or Spring Evaluation"
                />
                {errors.name && (
                  <p className="text-xs text-red-500 font-semibold mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold font-handwriting mb-1 text-slate-800 dark:text-slate-200">
                    Start Date
                  </label>
                  <Input type="date" {...register("startDate")} />
                  {errors.startDate && (
                    <p className="text-xs text-red-500 font-semibold mt-1">
                      {errors.startDate.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold font-handwriting mb-1 text-slate-800 dark:text-slate-200">
                    End Date
                  </label>
                  <Input type="date" {...register("endDate")} />
                  {errors.endDate && (
                    <p className="text-xs text-red-500 font-semibold mt-1">
                      {errors.endDate.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold font-handwriting mb-1 text-slate-800 dark:text-slate-200">
                    Academic Session
                  </label>
                  <Input {...register("academicSession")} placeholder="2026-2027" />
                  {errors.academicSession && (
                    <p className="text-xs text-red-500 font-semibold mt-1">
                      {errors.academicSession.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold font-handwriting mb-1 text-slate-800 dark:text-slate-200">
                    Initial Status
                  </label>
                  <select
                    {...register("status")}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  >
                    <option value="UPCOMING">UPCOMING</option>
                    <option value="ONGOING">ONGOING</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="coral"
                  isLoading={isSubmitting}
                  className="font-handwriting"
                >
                  Save Schedule
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Deletion */}
      <ConfirmationDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Examination Schedule"
        description="Are you sure you want to remove this examination session? All associated class schedules will be cleared."
        confirmText="Delete Exam"
        variant="destructive"
      />
    </div>
  );
}
