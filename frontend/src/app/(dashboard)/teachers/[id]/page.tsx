"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ArrowLeft,
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  Award,
  BookOpen,
  Edit3,
  Trash2,
  Save,
  CheckCircle2,
  Clock,
  Briefcase,
  Users,
  Plus,
  ShieldCheck,
  X,
  Check,
} from "lucide-react";

import {
  useGetTeacherByIdQuery,
  useUpdateTeacherProfileMutation,
  useAssignTeacherResourcesMutation,
  useDeleteTeacherMutation,
} from "@/store/api/teacherApi";
import { useGetClassesQuery, useGetSubjectsQuery } from "@/store/api/academicApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useToast } from "@/components/ui/toast";

const teacherUpdateSchema = z.object({
  employeeId: z.string().min(2, "Employee ID required"),
  qualification: z.string().min(2, "Qualification required"),
  experienceYears: z.coerce.number().min(0).max(60),
});

type TeacherUpdateFormData = z.infer<typeof teacherUpdateSchema>;

const DEFAULT_AVAILABLE_CLASSES = [
  { id: "67272714207198bb6c30f410", name: "Grade 9 - Section A" },
  { id: "67272714207198bb6c30f411", name: "Grade 10 - Section A" },
  { id: "67272714207198bb6c30f412", name: "Grade 10 - Section B" },
  { id: "67272714207198bb6c30f413", name: "Grade 11 - Science" },
  { id: "67272714207198bb6c30f414", name: "Grade 12 - Commerce" },
];

const DEFAULT_AVAILABLE_SUBJECTS = [
  { id: "67272714207198bb6c30f420", name: "Mathematics" },
  { id: "67272714207198bb6c30f421", name: "Physics" },
  { id: "67272714207198bb6c30f422", name: "Chemistry" },
  { id: "67272714207198bb6c30f423", name: "Computer Science" },
  { id: "67272714207198bb6c30f424", name: "English Literature" },
];

export default function TeacherDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = (params?.id as string) || "";

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [newSubjectInput, setNewSubjectInput] = useState("");

  const { data, isLoading, isError, refetch } = useGetTeacherByIdQuery(id);
  const teacher = data?.teacher || data?.data;

  const { data: realClasses } = useGetClassesQuery();
  const { data: realSubjects } = useGetSubjectsQuery({});

  const [updateProfile, { isLoading: isUpdating }] = useUpdateTeacherProfileMutation();
  const [assignResources, { isLoading: isAssigning }] = useAssignTeacherResourcesMutation();
  const [deleteTeacher, { isLoading: isDeletingTeacher }] = useDeleteTeacherMutation();

  // State for Assignment Modal
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  // Synchronize initial selections when modal opens
  const openAssignModal = () => {
    setSelectedClassIds(teacher?.assignedClassIds || []);
    setSelectedSubjectIds(teacher?.assignedSubjectIds || []);
    setIsAssignModalOpen(true);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TeacherUpdateFormData>({
    resolver: zodResolver(teacherUpdateSchema) as any,
    values: {
      employeeId: teacher?.employeeId || "",
      qualification: teacher?.qualification || "M.Ed / B.Sc Faculty",
      experienceYears: teacher?.experienceYears || 5,
    },
  });

  const onUpdateProfile = async (formData: TeacherUpdateFormData) => {
    try {
      await updateProfile({
        id,
        employeeId: formData.employeeId,
        qualification: formData.qualification,
        experienceYears: formData.experienceYears,
      }).unwrap();

      toast({
        type: "success",
        title: "Profile Updated",
        description: "Faculty details updated successfully.",
      });
      setIsEditing(false);
    } catch (err: any) {
      toast({
        type: "error",
        title: "Update Failed",
        description: err?.data?.message || "Failed to update teacher profile.",
      });
    }
  };

  const handleAddSubject = async () => {
    if (!newSubjectInput.trim()) return;
    try {
      const currentSubjects = teacher?.subjects || [];
      const updated = Array.from(new Set([...currentSubjects, newSubjectInput.trim()]));
      await updateProfile({
        id,
        specialization: updated,
      }).unwrap();

      toast({
        type: "success",
        title: "Subject Added",
        description: `Assigned ${newSubjectInput.trim()} to instructor curriculum.`,
      });
      setNewSubjectInput("");
    } catch (err: any) {
      toast({
        type: "error",
        title: "Assignment Failed",
        description: err?.data?.message || "Could not update assigned subjects.",
      });
    }
  };

  const handleRemoveSubject = async (subToRemove: string) => {
    try {
      const currentSubjects = teacher?.subjects || [];
      const updated = currentSubjects.filter((s: string) => s !== subToRemove);
      await updateProfile({
        id,
        specialization: updated,
      }).unwrap();

      toast({
        type: "info",
        title: "Subject Removed",
        description: `Unassigned ${subToRemove}.`,
      });
    } catch (err: any) {
      toast({
        type: "error",
        title: "Action Failed",
        description: err?.data?.message || "Could not remove subject.",
      });
    }
  };

  const onSaveAssignments = async () => {
    try {
      await assignResources({
        id,
        assignedClassIds: selectedClassIds,
        assignedSubjectIds: selectedSubjectIds,
      }).unwrap();

      toast({
        type: "success",
        title: "Assignments Updated",
        description: "Classes and subjects allocated successfully to this faculty member.",
      });
      setIsAssignModalOpen(false);
    } catch (err: any) {
      toast({
        type: "error",
        title: "Assignment Failed",
        description: err?.data?.message || "Failed to save assigned resources.",
      });
    }
  };

  const onDeleteConfirm = async () => {
    try {
      await deleteTeacher(id).unwrap();
      toast({
        type: "success",
        title: "Faculty Record Deleted",
        description: "Instructor profile has been removed.",
      });
      router.push("/teachers");
    } catch (err: any) {
      toast({
        type: "error",
        title: "Delete Failed",
        description: err?.data?.message || "Failed to delete instructor record.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12 max-w-6xl mx-auto">
        <Skeleton className="h-8 w-48 rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 rounded-3xl bg-slate-200 dark:bg-slate-800" />
          <Skeleton className="lg:col-span-2 h-96 rounded-3xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  if (isError || !teacher) {
    return (
      <div className="py-12 max-w-xl mx-auto text-center space-y-4">
        <ErrorState
          onRetry={refetch}
          message="Faculty profile not found or could not be loaded."
        />
        <Link href="/teachers">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Faculty Directory
          </Button>
        </Link>
      </div>
    );
  }

  const initial = teacher.name?.charAt(0)?.toUpperCase() || "T";
  const employeeId = teacher.employeeId || "EMP-" + String(teacher.id).slice(-4).toUpperCase();
  const isActive = (teacher.status || "active").toLowerCase() === "active";

  const availableClasses =
    realClasses?.data && realClasses.data.length > 0
      ? realClasses.data.map((c) => ({ id: String(c.id), name: c.name }))
      : DEFAULT_AVAILABLE_CLASSES;

  const availableSubjects =
    realSubjects?.data && realSubjects.data.length > 0
      ? realSubjects.data.map((s) => ({ id: String(s.id), name: s.name }))
      : DEFAULT_AVAILABLE_SUBJECTS;

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Link href="/teachers" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-purple-600 transition">
          <ArrowLeft className="h-4 w-4" /> Back to Faculty Directory
        </Link>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="default"
            onClick={openAssignModal}
            className="h-9 px-3 gap-1.5 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20"
          >
            <Users className="h-3.5 w-3.5" />
            <span>Assign Classes & Subjects</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
            className="h-9 px-3 gap-1.5 text-xs font-semibold rounded-xl text-purple-600 border-purple-200 dark:border-purple-900/60 hover:bg-purple-50 dark:hover:bg-purple-950/40"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>{isEditing ? "Cancel Edit" : "Edit Details"}</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsDeleting(true)}
            className="h-9 px-3 gap-1.5 text-xs font-semibold text-rose-600 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Faculty Bio Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-6 text-center space-y-4">
            {/* Avatar */}
            <div className="h-24 w-24 mx-auto rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-3xl shadow-lg shadow-purple-500/20 ring-4 ring-white dark:ring-slate-900">
              {initial}
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {teacher.name}
              </h2>
              <p className="text-xs text-slate-500 font-mono font-semibold">
                {employeeId}
              </p>
              <div className="pt-1 flex items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>{isActive ? "Active Faculty" : "Inactive"}</span>
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                  {teacher.experienceYears ? `${teacher.experienceYears} yrs exp` : "Senior Faculty"}
                </span>
              </div>
            </div>

            {/* Quick Contacts */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-left space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-purple-500 shrink-0" />
                <span className="truncate">{teacher.email || "faculty@school.edu"}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>{teacher.phone || "+1 (555) 234-5678"}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Calendar className="h-4 w-4 text-amber-500 shrink-0" />
                <span>
                  Joining Date: {teacher.joiningDate ? new Date(teacher.joiningDate).toLocaleDateString() : "Fall Semester 2024"}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Award className="h-4 w-4 text-blue-500 shrink-0" />
                <span className="truncate">Qualification: {teacher.qualification || "M.Ed, B.Sc"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Qualifications, Assigned Classes & Subjects */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit Form (Collapsible) */}
          {isEditing && (
            <div className="rounded-3xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/60 p-6 space-y-4 shadow-sm animate-in fade-in duration-200">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-purple-600" />
                <span>Update Academic Credentials</span>
              </h3>

              <form onSubmit={handleSubmit(onUpdateProfile)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Employee ID"
                    {...register("employeeId")}
                    error={errors.employeeId?.message}
                  />
                  <Input
                    label="Qualification"
                    placeholder="M.Ed, Ph.D, B.Sc"
                    {...register("qualification")}
                    error={errors.qualification?.message}
                  />
                  <Input
                    label="Years of Experience"
                    type="number"
                    {...register("experienceYears")}
                    error={errors.experienceYears?.message}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="default"
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
                    disabled={isUpdating}
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{isUpdating ? "Saving..." : "Save Changes"}</span>
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Assigned Classes Card */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Assigned Classes & Sections
                </h3>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={openAssignModal}
                className="h-8 px-2.5 text-xs text-purple-600 rounded-lg"
              >
                + Assign Class
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {teacher.assignedClasses && teacher.assignedClasses.length > 0 ? (
                teacher.assignedClasses.map((cls: string, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-900/60 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-xs text-purple-900 dark:text-purple-200">
                        {cls}
                      </p>
                      <p className="text-[10px] text-purple-600 dark:text-purple-400">
                        Class Instructor
                      </p>
                    </div>
                    <GraduationCap className="h-4 w-4 text-purple-500" />
                  </div>
                ))
              ) : (
                [
                  { name: "Grade 10 - Section A", students: 32 },
                  { name: "Grade 11 - Section B", students: 28 },
                ].map((demo, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-xs text-slate-900 dark:text-white">
                        {demo.name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {demo.students} Enrolled Students
                      </p>
                    </div>
                    <GraduationCap className="h-4 w-4 text-slate-400" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Assigned Subjects & Specializations Card */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Taught Subjects & Curriculums
                </h3>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={openAssignModal}
                className="h-8 px-2.5 text-xs text-indigo-600 rounded-lg"
              >
                Manage Subjects
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {teacher.subjects && teacher.subjects.length > 0 ? (
                teacher.subjects.map((subj: string, idx: number) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/60"
                  >
                    <span>{subj}</span>
                    <button
                      onClick={() => handleRemoveSubject(subj)}
                      className="hover:text-rose-500 transition ml-1"
                      title="Remove Subject"
                    >
                      ×
                    </button>
                  </span>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No subject courses assigned yet.</p>
              )}
            </div>

            {/* Quick Add Subject */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <input
                type="text"
                placeholder="Assign new subject (e.g. Advanced Calculus)..."
                value={newSubjectInput}
                onChange={(e) => setNewSubjectInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSubject();
                  }
                }}
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
              <Button
                size="sm"
                variant="default"
                onClick={handleAddSubject}
                className="h-9 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Assign</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ASSIGN CLASSES & SUBJECTS MODAL */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Assign Classes & Subjects
                </h3>
                <p className="text-xs text-slate-500">
                  Select classes and subjects to allocate to {teacher.name}.
                </p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Classes Section */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Assign Classes
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableClasses.map((cls) => {
                  const isChecked = selectedClassIds.includes(cls.id);
                  return (
                    <label
                      key={cls.id}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition select-none ${
                        isChecked
                          ? "bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-200"
                          : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedClassIds(selectedClassIds.filter((cid) => cid !== cls.id));
                          } else {
                            setSelectedClassIds([...selectedClassIds, cls.id]);
                          }
                        }}
                        className="rounded text-purple-600 focus:ring-purple-500/20"
                      />
                      <span className="font-semibold">{cls.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Subjects Section */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Assign Subjects
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableSubjects.map((sub) => {
                  const isChecked = selectedSubjectIds.includes(sub.id);
                  return (
                    <label
                      key={sub.id}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition select-none ${
                        isChecked
                          ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200"
                          : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedSubjectIds(selectedSubjectIds.filter((sid) => sid !== sub.id));
                          } else {
                            setSelectedSubjectIds([...selectedSubjectIds, sub.id]);
                          }
                        }}
                        className="rounded text-indigo-600 focus:ring-indigo-500/20"
                      />
                      <span className="font-semibold">{sub.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAssignModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={onSaveAssignments}
                disabled={isAssigning}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isAssigning ? "Saving..." : "Save Assignments"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleting}
        onClose={() => setIsDeleting(false)}
        onConfirm={onDeleteConfirm}
        title="Delete Faculty Profile"
        description="Are you sure you want to delete this instructor profile? They will be unlinked from all assigned classes and subject curricula."
        confirmText="Yes, Delete"
        isLoading={isDeletingTeacher}
      />
    </div>
  );
}
