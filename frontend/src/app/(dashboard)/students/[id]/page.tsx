"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Plus,
  BookOpen,
  Award,
  Save,
} from "lucide-react";

import {
  useGetStudentByIdQuery,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
} from "@/store/api/studentApi";
import {
  useAddMarkMutation,
  useUpdateMarkMutation,
  useDeleteMarkMutation,
} from "@/store/api/marksApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useToast } from "@/components/ui/toast";
import { Mark } from "@/types";

const studentUpdateSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  age: z.coerce.number().min(3).max(100),
});

const markSchema = z.object({
  subject: z.string().min(2, "Subject name required"),
  marks: z.coerce
    .number()
    .min(0, "Marks must be non-negative")
    .max(100, "Maximum mark is 100"),
});

type StudentUpdateData = z.infer<typeof studentUpdateSchema>;
type MarkFormData = z.infer<typeof markSchema>;

export default function StudentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = (params?.id as string) || "";

  const { data, isLoading, isError, refetch } = useGetStudentByIdQuery(id);
  const student = data?.student;

  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [isDeletingStudent, setIsDeletingStudent] = useState(false);
  const [editingMarkId, setEditingMarkId] = useState<number | string | null>(null);

  const [updateStudent, { isLoading: isUpdatingStudent }] = useUpdateStudentMutation();
  const [deleteStudent, { isLoading: isDeletingStudentMutation }] = useDeleteStudentMutation();
  const [addMark, { isLoading: isAddingMark }] = useAddMarkMutation();
  const [updateMark, { isLoading: isUpdatingMark }] = useUpdateMarkMutation();
  const [deleteMark] = useDeleteMarkMutation();

  // Student Edit Form
  const {
    register: registerStudent,
    handleSubmit: handleSubmitStudent,
    formState: { errors: studentErrors },
  } = useForm<StudentUpdateData>({
    resolver: zodResolver(studentUpdateSchema) as any,
    values: {
      name: student?.name || "",
      email: student?.email || "",
      age: student?.age || 18,
    },
  });

  // Add Mark Form
  const {
    register: registerMark,
    handleSubmit: handleSubmitMark,
    reset: resetMark,
    formState: { errors: markErrors },
  } = useForm<MarkFormData>({
    resolver: zodResolver(markSchema) as any,
    defaultValues: {
      subject: "",
      marks: 85,
    },
  });

  // Edit Mark Form
  const {
    register: registerEditMark,
    handleSubmit: handleSubmitEditMark,
    setValue: setEditMarkValue,
  } = useForm<MarkFormData>({
    resolver: zodResolver(markSchema) as any,
  });

  const onUpdateStudent = async (formData: StudentUpdateData) => {
    try {
      await updateStudent({ id, ...formData }).unwrap();
      toast({
        type: "success",
        title: "Student Updated",
        description: "Student profile updated successfully.",
      });
      setIsEditingStudent(false);
    } catch (err: any) {
      toast({
        type: "error",
        title: "Update Failed",
        description: err?.data?.message || "Failed to update student profile.",
      });
    }
  };

  const onDeleteStudent = async () => {
    try {
      await deleteStudent(id).unwrap();
      toast({
        type: "success",
        title: "Student Deleted",
        description: "Student deleted successfully.",
      });
      router.push("/students");
    } catch (err: any) {
      toast({
        type: "error",
        title: "Delete Failed",
        description: err?.data?.message || "Failed to delete student.",
      });
    }
  };

  const onAddMark = async (formData: MarkFormData) => {
    try {
      await addMark({ studentId: id, ...formData }).unwrap();
      toast({
        type: "success",
        title: "Mark Recorded",
        description: `Score recorded for ${formData.subject}.`,
      });
      resetMark();
    } catch (err: any) {
      toast({
        type: "error",
        title: "Failed to Add Mark",
        description: err?.data?.message || "Error adding subject mark.",
      });
    }
  };

  const handleStartEditMark = (mark: Mark) => {
    setEditingMarkId(mark.id);
    setEditMarkValue("subject", mark.subject);
    setEditMarkValue("marks", mark.marks);
  };

  const onUpdateMark = async (formData: MarkFormData) => {
    if (!editingMarkId) return;
    try {
      await updateMark({ markId: editingMarkId, studentId: id, ...formData }).unwrap();
      toast({
        type: "success",
        title: "Mark Updated",
        description: "Academic score updated successfully.",
      });
      setEditingMarkId(null);
    } catch (err: any) {
      toast({
        type: "error",
        title: "Update Failed",
        description: err?.data?.message || "Failed to update mark.",
      });
    }
  };

  const onDeleteMark = async (markId: number | string) => {
    try {
      await deleteMark({ markId, studentId: id }).unwrap();
      toast({
        type: "success",
        title: "Mark Deleted",
        description: "Subject score removed.",
      });
    } catch (err: any) {
      toast({
        type: "error",
        title: "Delete Failed",
        description: err?.data?.message || "Failed to delete mark.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-8">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
        <Skeleton className="h-48 w-full rounded-3xl" />
      </div>
    );
  }

  if (isError || !student) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <ErrorState
          title="Student Not Found"
          message="Could not retrieve requested student record."
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Navigation Top */}
      <div className="flex items-center justify-between">
        <Link
          href="/students"
          className="inline-flex items-center gap-2 text-sm font-bold text-black dark:text-white hover:underline transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Students
        </Link>
      </div>

      {/* Student Profile Card */}
      <div className="relative rounded-3xl border-[3px] border-black dark:border-white bg-white dark:bg-black p-8 sketch-shadow rotate-sketch-sm">
        <div className="tape-accent" />

        {isEditingStudent ? (
          <form onSubmit={handleSubmitStudent(onUpdateStudent as any)} className="space-y-4">
            <h2 className="text-2xl font-bold font-handwriting text-black dark:text-white">
              Edit Student Profile
            </h2>
            <Input label="Full Name" {...registerStudent("name")} error={studentErrors.name?.message} />
            <Input label="Email Address" type="email" {...registerStudent("email")} error={studentErrors.email?.message} />
            <Input label="Age" type="number" {...registerStudent("age")} error={studentErrors.age?.message} />

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                isLoading={isUpdatingStudent}
                className="font-handwriting text-base"
              >
                <Save className="h-4 w-4 mr-2" /> Save Changes
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditingStudent(false)}
                className="font-handwriting text-base"
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 rounded-2xl bg-black text-white dark:bg-white dark:text-black border-[3px] border-black dark:border-white flex items-center justify-center font-bold font-handwriting text-3xl sketch-shadow-sm">
                  {student.name?.charAt(0)}
                </div>
                <div>
                  <h1 className="text-3xl font-extrabold font-handwriting text-black dark:text-white leading-tight">
                    {student.name}
                  </h1>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{student.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Badge variant="warning">
                  Age: {student.age} years
                </Badge>
                <Badge variant="secondary">
                  ID: #{student.id}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => setIsEditingStudent(true)}
                variant="outline"
                className="font-handwriting text-base gap-2"
              >
                <Edit3 className="h-4 w-4" /> Edit Profile
              </Button>
              <Button
                onClick={() => setIsDeletingStudent(true)}
                variant="destructive"
                className="font-handwriting text-base gap-2"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Mark Form */}
      <div className="rounded-3xl border-[3px] border-black dark:border-white bg-white dark:bg-black p-8 sketch-shadow space-y-6">
        <div className="pb-4 border-b-[3px] border-black dark:border-white">
          <h2 className="text-2xl font-bold font-handwriting text-black dark:text-white flex items-center gap-2">
            Record Academic Mark <BookOpen className="h-5 w-5 text-black dark:text-white" />
          </h2>
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Add subject exam scores out of 100.
          </p>
        </div>

        <form onSubmit={handleSubmitMark(onAddMark as any)} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <Input label="Subject Name *" placeholder="e.g. Mathematics" {...registerMark("subject")} error={markErrors.subject?.message} />
          <Input label="Score (0-100) *" type="number" placeholder="Enter score" {...registerMark("marks")} error={markErrors.marks?.message} />

          <Button
            type="submit"
            isLoading={isAddingMark}
            className="font-handwriting text-lg h-11 gap-2"
          >
            <Plus className="h-5 w-5" /> Add Score
          </Button>
        </form>
      </div>

      {/* Marks List */}
      <div className="rounded-3xl border-[3px] border-black dark:border-white bg-white dark:bg-black p-8 sketch-shadow space-y-6">
        <div className="pb-4 border-b-[3px] border-black dark:border-white">
          <h2 className="text-2xl font-bold font-handwriting text-black dark:text-white flex items-center gap-2">
            Academic Performance <Award className="h-5 w-5 text-black dark:text-white" />
          </h2>
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Current subject marks recorded for this student
          </p>
        </div>

        {!student.marks || student.marks.length === 0 ? (
          <p className="text-sm font-handwriting text-slate-700 dark:text-slate-300 py-4 text-center">
            No subject marks recorded yet. Add a score above.
          </p>
        ) : (
          <div className="space-y-3">
            {student.marks.map((mark) => (
              <div
                key={mark.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border-[3px] border-black dark:border-white bg-white dark:bg-black sketch-shadow-sm gap-4"
              >
                {editingMarkId === mark.id ? (
                  <form onSubmit={handleSubmitEditMark(onUpdateMark as any)} className="flex-1 flex flex-wrap items-center gap-3">
                    <Input className="h-9 w-40" {...registerEditMark("subject")} />
                    <Input className="h-9 w-28" type="number" {...registerEditMark("marks")} />

                    <Button type="submit" size="sm" isLoading={isUpdatingMark}>
                      Save
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setEditingMarkId(null)}>
                      Cancel
                    </Button>
                  </form>
                ) : (
                  <>
                    <div>
                      <h4 className="text-lg font-bold font-handwriting text-black dark:text-white">
                        {mark.subject}
                      </h4>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Score: <span className="font-extrabold text-black dark:text-white">{mark.marks} / 100</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStartEditMark(mark)}
                        className="h-8 text-xs font-bold"
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDeleteMark(mark.id)}
                        className="h-8 text-xs"
                      >
                        Delete
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeletingStudent}
        onClose={() => setIsDeletingStudent(false)}
        onConfirm={onDeleteStudent}
        title="Delete Student Record"
        description="Are you sure you want to permanently delete this student record and all associated academic marks?"
        confirmText="Yes, Delete Permanently"
        isLoading={isDeletingStudentMutation}
      />
    </div>
  );
}
