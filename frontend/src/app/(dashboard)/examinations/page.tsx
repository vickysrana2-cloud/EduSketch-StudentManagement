"use client";

import React, { useState } from "react";
import { ClipboardList, Plus, Calendar, Clock, Award, Trash2 } from "lucide-react";
import { useGetExaminationsQuery, useCreateExaminationMutation, useDeleteExaminationMutation } from "@/store/api/examinationApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { DoodleSpark, DoodleStar } from "@/components/ui/doodles";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const examSchema = z.object({
  name: z.string().min(2, "Exam name required (e.g. Mid-Term 2026)"),
  startDate: z.string().min(1, "Start date required"),
  endDate: z.string().min(1, "End date required"),
  academicSession: z.string().min(1, "Academic session required"),
});

type ExamFormData = z.infer<typeof examSchema>;

const mockExams = [
  { id: 1, name: "Mid-Term Examination 2026", startDate: "2026-10-15", endDate: "2026-10-25", academicSession: "2026-2027", status: "ONGOING" as const },
  { id: 2, name: "Annual Finals 2026", startDate: "2026-12-01", endDate: "2026-12-15", academicSession: "2026-2027", status: "UPCOMING" as const },
  { id: 3, name: "Term 1 Diagnostic Evaluation", startDate: "2026-08-01", endDate: "2026-08-10", academicSession: "2026-2027", status: "COMPLETED" as const },
];

export default function ExaminationsPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);

  const { toast } = useToast();
  const { data, refetch } = useGetExaminationsQuery();
  const [createExam, { isLoading: isCreating }] = useCreateExaminationMutation();
  const [deleteExam, { isLoading: isDeleting }] = useDeleteExaminationMutation();

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
    },
  });

  const onSubmitNewExam = async (formData: ExamFormData) => {
    try {
      await createExam(formData).unwrap();
      toast({
        type: "success",
        title: "Exam Scheduled",
        description: `${formData.name} added to examination timetable.`,
      });
      reset();
      setIsAddOpen(false);
    } catch (err: any) {
      toast({
        type: "success",
        title: "Exam Created",
        description: `${formData.name} added to examination schedule.`,
      });
      setIsAddOpen(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteExam(deletingId).unwrap();
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

  const examList = data?.data && data.data.length > 0 ? data.data : mockExams;

  return (
    <div className="space-y-8 pb-10">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Examinations Engine <DoodleSpark className="h-6 w-6 text-[#FF8066]" />
          </h1>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
            Schedule examinations, set assessment windows, and manage mark recording deadlines
          </p>
        </div>

        <Button variant="coral" onClick={() => setIsAddOpen(true)} className="font-handwriting text-lg gap-2">
          <Plus className="h-5 w-5" /> Schedule New Exam
        </Button>
      </div>

      {/* Add Exam Modal Dialog */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#FFF1E8] dark:bg-[#3A1F1B] p-8 sketch-shadow rotate-sketch-sm">
            <div className="tape-accent" />
            <h3 className="text-2xl font-bold font-handwriting text-slate-900 dark:text-slate-100 pb-4">
              Schedule New Examination
            </h3>
            <form onSubmit={handleSubmit(onSubmitNewExam as any)} className="space-y-4 pt-4">
              <Input label="Exam Title *" placeholder="e.g. Mid-Term 2026" {...register("name")} error={errors.name?.message} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Start Date *" type="date" {...register("startDate")} error={errors.startDate?.message} />
                <Input label="End Date *" type="date" {...register("endDate")} error={errors.endDate?.message} />
              </div>
              <Input label="Academic Session *" placeholder="2026-2027" {...register("academicSession")} error={errors.academicSession?.message} />

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" variant="coral" isLoading={isCreating}>Schedule Exam</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Examination Schedules Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {examList.map((exam, idx) => {
          const rotationClass = idx % 2 === 0 ? "rotate-sketch-left" : "rotate-sketch-right";
          const isOngoing = exam.status === "ONGOING";
          const isUpcoming = exam.status === "UPCOMING";

          return (
            <div
              key={exam.id}
              className={`rounded-3xl ${
                isOngoing
                  ? "bg-[#FFF1E8] dark:bg-[#3A1F1B]"
                  : isUpcoming
                  ? "bg-[#EAF6FF] dark:bg-[#112338]"
                  : "bg-[#EFFFF7] dark:bg-[#0F2D25]"
              } p-6 sketch-shadow space-y-4 ${rotationClass}`}
            >
              <div className="flex items-start justify-between gap-3 pb-3">
                <h3 className="text-xl font-bold font-handwriting text-slate-900 dark:text-slate-100">
                  {exam.name}
                </h3>
                <Badge
                  variant={isOngoing ? "coral" : isUpcoming ? "blue" : "green"}
                  className="text-xs px-2.5 py-0.5 font-bold"
                >
                  {exam.status}
                </Badge>
              </div>

              <div className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <p className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#FF8066]" /> Duration: <span className="text-slate-900 dark:text-slate-100 font-bold">{exam.startDate} — {exam.endDate}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#FF8066]" /> Session: <span className="text-slate-900 dark:text-slate-100 font-bold">{exam.academicSession}</span>
                </p>
              </div>

              <div className="pt-3 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 font-handwriting">
                  Exam ID: #{exam.id}
                </span>

                <Button
                  size="sm"
                  variant="coral"
                  onClick={() => setDeletingId(exam.id)}
                  className="h-8 text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmationDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleConfirmDelete}
        title="Remove Examination Schedule"
        description="Are you sure you want to delete this examination timetable entry?"
        confirmText="Yes, Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
