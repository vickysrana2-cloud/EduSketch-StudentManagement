"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Plus, ArrowLeft, ArrowRight, Trash2, Eye } from "lucide-react";
import { useGetStudentsQuery, useDeleteStudentMutation } from "@/store/api/studentApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useToast } from "@/components/ui/toast";
import { DoodleSpark } from "@/components/ui/doodles";

const cardThemes = [
  { bg: "bg-[#FFF0F6] dark:bg-[#361726]", avatarBg: "bg-[#FF6FAE]", text: "text-[#FF6FAE]", badge: "pink" as const },
  { bg: "bg-[#EAF6FF] dark:bg-[#112338]", avatarBg: "bg-[#4D9FFF]", text: "text-[#4D9FFF]", badge: "blue" as const },
  { bg: "bg-[#F4EEFF] dark:bg-[#231B3C]", avatarBg: "bg-[#8B6DFF]", text: "text-[#8B6DFF]", badge: "purple" as const },
  { bg: "bg-[#EFFFF7] dark:bg-[#0F2D25]", avatarBg: "bg-[#48C78E]", text: "text-[#48C78E]", badge: "green" as const },
  { bg: "bg-[#FFFBE5] dark:bg-[#362E12]", avatarBg: "bg-[#FFC83D]", text: "text-[#FF9F43]", badge: "yellow" as const },
  { bg: "bg-[#FFF1E8] dark:bg-[#3A1F1B]", avatarBg: "bg-[#FF8066]", text: "text-[#FF8066]", badge: "coral" as const },
];

export default function StudentListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<number | string | null>(null);

  const { toast } = useToast();
  const { data, isLoading, isError, refetch } = useGetStudentsQuery({
    page,
    limit: 6,
    search,
  });

  const [deleteStudent, { isLoading: isDeleting }] = useDeleteStudentMutation();

  const handleConfirmDelete = async () => {
    if (!deletingId) return;

    try {
      await deleteStudent(deletingId).unwrap();
      toast({
        type: "success",
        title: "Student Deleted",
        description: "Student record has been deleted successfully.",
      });
    } catch (err: any) {
      toast({
        type: "error",
        title: "Delete Failed",
        description: err?.data?.message || "Failed to delete student record.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const students = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-8 pb-10">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Student Roster <DoodleSpark className="h-6 w-6 text-[#FF6FAE]" />
          </h1>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
            Manage academic profiles, enrollments, and performance records
          </p>
        </div>

        <Link href="/students/new">
          <Button variant="pink" className="font-handwriting text-lg gap-2">
            <Plus className="h-5 w-5" />
            Add New Student
          </Button>
        </Link>
      </div>

      {/* Search Bar & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4D9FFF]" />
          <input
            type="text"
            placeholder="🔍 Search by student name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#EAF6FF]/50 dark:bg-[#112338]/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-[#141824] transition-all duration-200 sketch-shadow-sm text-sm font-medium"
          />
        </div>

        {pagination && (
          <div className="text-xs font-handwriting font-bold text-[#8B6DFF] dark:text-[#C5A7FF] bg-[#F4EEFF] dark:bg-[#231B3C] px-4 py-2 rounded-xl sketch-shadow-sm">
            Total Records: {pagination.totalRecords}
          </div>
        )}
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-3xl p-6 space-y-4 bg-white dark:bg-[#141824]">
              <Skeleton className="h-6 w-3/4 rounded-lg bg-[#EAF6FF]" />
              <Skeleton className="h-4 w-1/2 rounded-lg bg-[#EAF6FF]" />
              <Skeleton className="h-10 w-full rounded-xl bg-[#EAF6FF]" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={refetch} message="Failed to load student list from backend service." />
      ) : students.length === 0 ? (
        <EmptyState
          title="No Students Found"
          description={search ? `No student records matching "${search}".` : "There are currently no students in the database."}
          actionLabel="+ Add First Student"
          onAction={() => window.location.href = "/students/new"}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((student, idx) => {
            const rotationClass = idx % 2 === 0 ? "rotate-sketch-left" : "rotate-sketch-right";
            const theme = cardThemes[idx % cardThemes.length];

            return (
              <div
                key={student.id}
                className={`group relative rounded-3xl ${theme.bg} p-6 sketch-shadow hover:-translate-y-1 transition-all duration-300 ${rotationClass}`}
              >
                <div className="tape-accent" />
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-12 w-12 rounded-2xl ${theme.avatarBg} text-white flex items-center justify-center font-bold font-handwriting text-xl sketch-shadow-sm shadow-xs`}>
                      {student.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold font-handwriting text-slate-900 dark:text-slate-100 leading-tight">
                        {student.name}
                      </h3>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-300 break-all mt-0.5">
                        {student.email}
                      </p>
                    </div>
                  </div>

                  <Badge variant={theme.badge}>
                    Age: {student.age}
                  </Badge>
                </div>

                <div className="mt-6 pt-4 flex items-center justify-between">
                  <span className={`text-xs font-bold ${theme.text} uppercase tracking-wider font-handwriting`}>
                    ID: #{student.id}
                  </span>

                  <div className="flex items-center gap-2">
                    <Link href={`/students/${student.id}`}>
                      <Button size="sm" variant={theme.badge} className="h-9 px-3 gap-1.5 text-xs font-bold">
                        <Eye className="h-3.5 w-3.5" />
                        Details
                      </Button>
                    </Link>

                    <Button
                      size="sm"
                      variant="coral"
                      onClick={() => setDeletingId(student.id)}
                      className="h-9 px-2.5 text-xs"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Bar */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-6">
          <Button
            variant="blue"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="gap-2 font-handwriting text-base"
          >
            <ArrowLeft className="h-4 w-4" /> Previous
          </Button>

          <span className="px-4 py-2 rounded-xl bg-[#4D9FFF] text-white font-bold font-handwriting text-sm sketch-shadow-sm shadow-[0_2px_8px_rgba(77,159,255,0.3)]">
            Page {pagination.currentPage} / {pagination.totalPages}
          </span>

          <Button
            variant="blue"
            disabled={page === pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="gap-2 font-handwriting text-base"
          >
            Next <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Confirmation Dialog for Deleting Student */}
      <ConfirmationDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Student Record"
        description="Are you sure you want to delete this student record? This action cannot be undone."
        confirmText="Yes, Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}

