"use client";

import React, { useState } from "react";
import { Search, Plus, GraduationCap, Mail, Phone, BookOpen, Trash2, Edit3, Sparkles } from "lucide-react";
import { useGetTeachersQuery, useCreateTeacherMutation, useDeleteTeacherMutation } from "@/store/api/teacherApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useToast } from "@/components/ui/toast";
import { DoodleSpark, DoodleStar } from "@/components/ui/doodles";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const teacherSchema = z.object({
  name: z.string().min(2, "Teacher name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(5, "Phone number required"),
  subjects: z.string().min(2, "Enter at least one subject (comma separated)"),
});

type TeacherFormData = z.infer<typeof teacherSchema>;

const mockTeachersData = [
  { id: 1, name: "Prof. Arthur Pendelton", email: "arthur@edusketch.edu", phone: "+1 (555) 234-5678", subjects: ["Mathematics", "Calculus"] },
  { id: 2, name: "Dr. Clara Oswald", email: "clara@edusketch.edu", phone: "+1 (555) 345-6789", subjects: ["English Literature", "History"] },
  { id: 3, name: "Prof. Ronald Vance", email: "ronald@edusketch.edu", phone: "+1 (555) 456-7890", subjects: ["Physics", "Chemistry"] },
  { id: 4, name: "Ms. Sophia Martinez", email: "sophia@edusketch.edu", phone: "+1 (555) 567-8901", subjects: ["Biology", "Environmental Science"] },
  { id: 5, name: "Mr. David Kim", email: "david@edusketch.edu", phone: "+1 (555) 678-9012", subjects: ["Computer Science", "Robotics"] },
];

const teacherCardThemes = [
  { bg: "bg-[#F4EEFF] dark:bg-[#231B3C]", avatarBg: "bg-[#8B6DFF]", badge: "purple" as const },
  { bg: "bg-[#EAF6FF] dark:bg-[#112338]", avatarBg: "bg-[#4D9FFF]", badge: "blue" as const },
  { bg: "bg-[#FFF0F6] dark:bg-[#361726]", avatarBg: "bg-[#FF6FAE]", badge: "pink" as const },
  { bg: "bg-[#EFFFF7] dark:bg-[#0F2D25]", avatarBg: "bg-[#48C78E]", badge: "green" as const },
  { bg: "bg-[#FFFBE5] dark:bg-[#362E12]", avatarBg: "bg-[#FFC83D]", badge: "yellow" as const },
];

export default function TeacherListPage() {
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);

  const { toast } = useToast();
  const { data, isLoading, isError, refetch } = useGetTeachersQuery({ page: 1, limit: 10, search });
  const [createTeacher, { isLoading: isCreating }] = useCreateTeacherMutation();
  const [deleteTeacher, { isLoading: isDeleting }] = useDeleteTeacherMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TeacherFormData>({
    resolver: zodResolver(teacherSchema) as any,
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subjects: "",
    },
  });

  const onSubmitNewTeacher = async (formData: TeacherFormData) => {
    try {
      const subjectArray = formData.subjects.split(",").map((s) => s.trim()).filter(Boolean);
      await createTeacher({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subjects: subjectArray,
      }).unwrap();

      toast({
        type: "success",
        title: "Teacher Added",
        description: `${formData.name} has been enrolled in the faculty directory.`,
      });
      reset();
      setIsAddOpen(false);
    } catch (err: any) {
      toast({
        type: "error",
        title: "Action Failed",
        description: err?.data?.message || "Failed to create teacher record.",
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteTeacher(deletingId).unwrap();
      toast({
        type: "success",
        title: "Teacher Record Removed",
        description: "Faculty member deleted successfully.",
      });
    } catch (err: any) {
      toast({
        type: "error",
        title: "Delete Failed",
        description: err?.data?.message || "Error deleting teacher record.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const teacherList = data?.data && data.data.length > 0 ? data.data : mockTeachersData;
  const filteredTeachers = teacherList.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Faculty & Teachers <DoodleSpark className="h-6 w-6 text-[#8B6DFF]" />
          </h1>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
            Manage teacher profiles, department assignments, and subject mappings
          </p>
        </div>

        <Button
          variant="purple"
          onClick={() => setIsAddOpen(true)}
          className="font-handwriting text-lg gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Faculty Member
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B6DFF]" />
          <input
            type="text"
            placeholder="🔍 Search faculty by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F4EEFF]/50 dark:bg-[#231B3C]/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-[#141824] transition-all duration-200 sketch-shadow-sm text-sm font-medium"
          />
        </div>

        <div className="text-xs font-handwriting font-bold text-[#8B6DFF] dark:text-[#C5A7FF] bg-[#F4EEFF] dark:bg-[#231B3C] px-4 py-2 rounded-xl sketch-shadow-sm">
          Active Faculty: {filteredTeachers.length}
        </div>
      </div>

      {/* Add Teacher Modal Dialog */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#F4EEFF] dark:bg-[#231B3C] p-8 sketch-shadow rotate-sketch-sm">
            <div className="tape-accent" />
            <div className="pb-4 flex items-center justify-between">
              <h3 className="text-2xl font-bold font-handwriting text-slate-900 dark:text-slate-100 flex items-center gap-2">
                New Faculty Registration <Sparkles className="h-5 w-5 text-[#8B6DFF]" />
              </h3>
            </div>

            <form onSubmit={handleSubmit(onSubmitNewTeacher as any)} className="space-y-4 pt-4">
              <Input label="Teacher Full Name *" placeholder="e.g. Dr. Arthur Pendelton" {...register("name")} error={errors.name?.message} />
              <Input label="Email Address *" type="email" placeholder="e.g. arthur@school.edu" {...register("email")} error={errors.email?.message} />
              <Input label="Phone Number *" placeholder="e.g. +1 (555) 234-5678" {...register("phone")} error={errors.phone?.message} />
              <Input label="Assigned Subjects *" placeholder="e.g. Mathematics, Calculus" {...register("subjects")} error={errors.subjects?.message} />

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="purple" isLoading={isCreating}>
                  Save Faculty Member
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Faculty Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeachers.map((teacher, idx) => {
          const rotationClass = idx % 2 === 0 ? "rotate-sketch-left" : "rotate-sketch-right";
          const theme = teacherCardThemes[idx % teacherCardThemes.length];

          return (
            <div
              key={teacher.id}
              className={`group relative rounded-3xl ${theme.bg} p-6 sketch-shadow hover:-translate-y-1 transition-all duration-300 ${rotationClass}`}
            >
              <div className="tape-accent" />
              <div className="flex items-start gap-4">
                <div className={`h-14 w-14 rounded-2xl ${theme.avatarBg} text-white flex items-center justify-center font-bold font-handwriting text-2xl sketch-shadow-sm shadow-xs shrink-0`}>
                  {teacher.name?.charAt(0)}
                </div>
                <div className="space-y-1 min-w-0">
                  <h3 className="text-xl font-bold font-handwriting text-slate-900 dark:text-slate-100 truncate">
                    {teacher.name}
                  </h3>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5 truncate">
                    <Mail className="h-3.5 w-3.5 shrink-0" /> {teacher.email}
                  </p>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5 truncate">
                    <Phone className="h-3.5 w-3.5 shrink-0" /> {teacher.phone || "N/A"}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-4 space-y-2">
                <span className="text-xs font-bold font-handwriting text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5 text-[#8B6DFF]" /> Assigned Subjects:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {teacher.subjects && teacher.subjects.length > 0 ? (
                    teacher.subjects.map((sub, i) => (
                      <Badge key={i} variant={theme.badge} className="text-[11px] px-2.5 py-0.5">
                        {sub}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline" className="text-[11px]">General Faculty</Badge>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 font-handwriting">
                  ID: #{teacher.id}
                </span>

                <Button
                  size="sm"
                  variant="coral"
                  onClick={() => setDeletingId(teacher.id)}
                  className="h-8 px-2.5 text-xs"
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
        title="Remove Faculty Member"
        description="Are you sure you want to delete this teacher record from the directory?"
        confirmText="Yes, Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
