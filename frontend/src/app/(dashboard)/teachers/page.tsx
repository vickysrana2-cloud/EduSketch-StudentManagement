"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Plus,
  GraduationCap,
  Mail,
  Phone,
  BookOpen,
  Trash2,
  Edit3,
  Eye,
  Filter,
  LayoutGrid,
  List,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Award,
} from "lucide-react";
import {
  useGetTeachersQuery,
  useCreateTeacherMutation,
  useDeleteTeacherMutation,
} from "@/store/api/teacherApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useToast } from "@/components/ui/toast";
import { DoodleSpark } from "@/components/ui/doodles";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const teacherSchema = z.object({
  name: z.string().min(2, "Teacher name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(5, "Phone number required"),
  specialization: z.string().min(2, "Specialization or subject required"),
});

type TeacherFormData = z.infer<typeof teacherSchema>;

const SPECIALIZATION_OPTIONS = [
  "ALL",
  "Mathematics",
  "Sciences",
  "Computer Science",
  "Languages",
  "Humanities",
  "Arts",
];

const STATUS_OPTIONS = ["ALL", "ACTIVE", "INACTIVE"];

export default function TeacherListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [, startTransition] = useTransition();

  // Read pagination and filters from URL query parameters
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const initialLimit = parseInt(searchParams.get("limit") || "10", 10);
  const initialSearch = searchParams.get("search") || "";
  const initialSpecialization = searchParams.get("specialization") || "ALL";
  const initialStatus = searchParams.get("status") || "ALL";

  const [page, setPage] = useState(initialPage > 0 ? initialPage : 1);
  const [limit, setLimit] = useState(initialLimit > 0 ? initialLimit : 10);
  const [search, setSearch] = useState(initialSearch);
  const [selectedSpecialization, setSelectedSpecialization] = useState(initialSpecialization);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);

  // Sync state changes with URL query parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (limit !== 10) params.set("limit", String(limit));
    if (search.trim()) params.set("search", search.trim());
    if (selectedSpecialization !== "ALL") params.set("specialization", selectedSpecialization);
    if (selectedStatus !== "ALL") params.set("status", selectedStatus);

    const queryString = params.toString();
    startTransition(() => {
      router.replace(queryString ? `?${queryString}` : "/teachers", { scroll: false });
    });
  }, [page, limit, search, selectedSpecialization, selectedStatus, router]);

  const { data, isLoading, isError, refetch } = useGetTeachersQuery({
    page,
    limit,
    search,
    specialization: selectedSpecialization !== "ALL" ? selectedSpecialization : undefined,
    status: selectedStatus !== "ALL" ? selectedStatus : undefined,
  });

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
      specialization: "",
    },
  });

  const onSubmitNewTeacher = async (formData: TeacherFormData) => {
    try {
      const specializations = formData.specialization
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      await createTeacher({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        specialization: specializations,
        subjects: specializations,
      }).unwrap();

      toast({
        type: "success",
        title: "Faculty Member Onboarded",
        description: `${formData.name} has been enrolled in the faculty directory.`,
      });
      reset();
      setIsAddOpen(false);
    } catch (err: any) {
      toast({
        type: "error",
        title: "Action Failed",
        description: err?.data?.message || "Failed to create teacher profile.",
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteTeacher(deletingId).unwrap();
      toast({
        type: "success",
        title: "Faculty Record Removed",
        description: "Teacher record has been deleted successfully.",
      });
    } catch (err: any) {
      toast({
        type: "error",
        title: "Delete Failed",
        description: err?.data?.message || "Failed to delete teacher record.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const teachers = data?.data || [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages || 1;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400">
              <GraduationCap className="h-5 w-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100">
              Faculty Directory
            </h1>
            <DoodleSpark className="h-5 w-5 text-[#8B6DFF]" />
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Manage academic instructors, departmental specializations, and class assignments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Toggle */}
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("card")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                viewMode === "card"
                  ? "bg-white dark:bg-slate-900 text-purple-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
              title="Card View"
            >
              <LayoutGrid className="h-4 w-4" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                viewMode === "table"
                  ? "bg-white dark:bg-slate-900 text-purple-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
              title="Table View"
            >
              <List className="h-4 w-4" />
              <span>Table</span>
            </button>
          </div>

          <Link href="/teachers/new">
            <Button
              variant="default"
              className="bg-purple-600 hover:bg-purple-700 text-white gap-2 font-handwriting text-base h-10 px-4 rounded-xl shadow-md shadow-purple-500/20"
            >
              <Plus className="h-4 w-4" />
              <span>Onboard Faculty</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Add Teacher Collapsible Form */}
      {isAddOpen && (
        <div className="rounded-3xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/60 p-6 space-y-4 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="h-4 w-4 text-purple-600" />
              <span>New Faculty Onboarding</span>
            </h3>
            <span className="text-xs text-purple-600 font-medium">Add Academic Staff</span>
          </div>

          <form onSubmit={handleSubmit(onSubmitNewTeacher)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Input
                label="Full Name"
                placeholder="Dr. Eleanor Vance"
                {...register("name")}
                error={errors.name?.message}
              />
              <Input
                label="Institutional Email"
                type="email"
                placeholder="e.vance@school.edu"
                {...register("email")}
                error={errors.email?.message}
              />
              <Input
                label="Phone Number"
                placeholder="+1 (555) 000-0000"
                {...register("phone")}
                error={errors.phone?.message}
              />
              <Input
                label="Specializations / Subjects"
                placeholder="e.g. Physics, Chemistry"
                {...register("specialization")}
                error={errors.specialization?.message}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
                disabled={isCreating}
              >
                <span>{isCreating ? "Onboarding..." : "Register Faculty"}</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by instructor name, employee ID, or subject..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Specialization Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Department:</span>
              <select
                value={selectedSpecialization}
                onChange={(e) => {
                  setSelectedSpecialization(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 border-none text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
              >
                {SPECIALIZATION_OPTIONS.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec === "ALL" ? "All Departments" : spec}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="hidden sm:inline">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 border-none text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st === "ALL" ? "All Statuses" : st}
                  </option>
                ))}
              </select>
            </div>

            {/* Items Per Page */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="hidden sm:inline">Show:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 border-none text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>

        {pagination && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500">
            <span>
              Showing{" "}
              <strong className="text-slate-700 dark:text-slate-300">
                {teachers.length}
              </strong>{" "}
              of{" "}
              <strong className="text-slate-700 dark:text-slate-300">
                {pagination.totalRecords}
              </strong>{" "}
              registered faculty members
            </span>
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedSpecialization("ALL");
                  setSelectedStatus("ALL");
                  setPage(1);
                }}
                className="text-purple-600 hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-3xl p-6 space-y-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80">
              <Skeleton className="h-6 w-3/4 rounded-lg bg-slate-200 dark:bg-slate-800" />
              <Skeleton className="h-4 w-1/2 rounded-lg bg-slate-200 dark:bg-slate-800" />
              <Skeleton className="h-10 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          onRetry={refetch}
          message="Failed to load faculty directory from backend. Please verify your connection."
        />
      ) : teachers.length === 0 ? (
        <EmptyState
          title="No Faculty Members Found"
          description={
            search || selectedSpecialization !== "ALL" || selectedStatus !== "ALL"
              ? "No faculty records matching your specified filters."
              : "There are currently no teachers enrolled in this institution."
          }
          actionLabel="+ Onboard First Teacher"
          onAction={() => router.push("/teachers/new")}
        />
      ) : viewMode === "table" ? (
        /* Table View */
        <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800/80 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th scope="col" className="py-3.5 px-4 sm:px-6">Instructor</th>
                  <th scope="col" className="py-3.5 px-4">Employee ID</th>
                  <th scope="col" className="py-3.5 px-4">Specialization</th>
                  <th scope="col" className="py-3.5 px-4">Status</th>
                  <th scope="col" className="py-3.5 px-4 hidden md:table-cell">Contact Phone</th>
                  <th scope="col" className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {teachers.map((teacher) => {
                  const initial = teacher.name?.charAt(0)?.toUpperCase() || "T";
                  const isActive = (teacher.status || "active").toLowerCase() === "active";
                  const employeeId = teacher.employeeId || "EMP-" + String(teacher.id).slice(-4).toUpperCase();

                  return (
                    <tr
                      key={teacher.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Avatar & Name */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            src={
                              teacher.profileImage ||
                              (typeof teacher.userId === "object" ? teacher.userId?.profileImage : null)
                            }
                            name={teacher.name}
                            size="md"
                            variant="purple"
                          />
                          <div>
                            <Link
                              href={`/teachers/${teacher.id}`}
                              className="font-bold text-slate-900 dark:text-slate-100 hover:text-purple-600 transition"
                            >
                              {teacher.name}
                            </Link>
                            <p className="text-[11px] text-slate-500 truncate max-w-[160px] sm:max-w-xs">
                              {teacher.email || "No email assigned"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Employee ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-slate-700 dark:text-slate-300">
                        {employeeId}
                      </td>

                      {/* Specializations / Subjects */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {teacher.subjects && teacher.subjects.length > 0 ? (
                            teacher.subjects.slice(0, 2).map((subj, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-md font-semibold text-[10px] bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
                              >
                                {subj}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-xs">General Faculty</span>
                          )}
                          {teacher.subjects && teacher.subjects.length > 2 && (
                            <span className="text-[10px] text-slate-400 self-center">
                              +{teacher.subjects.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isActive
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {isActive ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          <span>{isActive ? "Active" : "Inactive"}</span>
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 hidden md:table-cell text-slate-500 text-xs font-mono">
                        {teacher.phone || "+1 (555) 000-0000"}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/teachers/${teacher.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2.5 text-xs font-semibold gap-1 text-purple-600 border-purple-200 dark:border-purple-900/60 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Profile</span>
                            </Button>
                          </Link>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeletingId(teacher.id)}
                            className="h-8 px-2 text-xs font-semibold text-rose-600 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                            title="Delete Teacher"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.map((teacher) => {
            const initial = teacher.name?.charAt(0)?.toUpperCase() || "T";
            const isActive = (teacher.status || "active").toLowerCase() === "active";
            const employeeId = teacher.employeeId || "EMP-" + String(teacher.id).slice(-4).toUpperCase();

            return (
              <div
                key={teacher.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-5 space-y-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      src={
                        teacher.profileImage ||
                        (typeof teacher.userId === "object" ? teacher.userId?.profileImage : null)
                      }
                      name={teacher.name}
                      size="lg"
                      variant="purple"
                    />
                    <div>
                      <Link
                        href={`/teachers/${teacher.id}`}
                        className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:text-purple-600 transition"
                      >
                        {teacher.name}
                      </Link>
                      <p className="text-xs text-slate-500 font-mono">
                        {employeeId}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Subjects & Qualification */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Specializations & Subjects
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {teacher.subjects && teacher.subjects.length > 0 ? (
                      teacher.subjects.map((sub, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
                        >
                          {sub}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">Not assigned yet</span>
                    )}
                  </div>
                </div>

                {/* Contact Info Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <div className="space-y-1 truncate max-w-[150px]">
                    <p className="flex items-center gap-1 truncate text-[11px]">
                      <Mail className="h-3 w-3 text-purple-500 shrink-0" />
                      <span>{teacher.email}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Link href={`/teachers/${teacher.id}`}>
                      <Button size="sm" variant="outline" className="h-8 px-2.5 text-xs text-purple-600 rounded-lg">
                        <Eye className="h-3.5 w-3.5 mr-1" /> Profile
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeletingId(teacher.id)}
                      className="h-8 px-2 text-xs text-rose-600 rounded-lg"
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

      {/* Synchronized Pagination Bar */}
      {pagination && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
          <p className="text-xs text-slate-500 font-medium">
            Page <strong className="text-slate-800 dark:text-slate-200">{page}</strong> of{" "}
            <strong className="text-slate-800 dark:text-slate-200">{totalPages}</strong>
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-9 px-3 gap-1.5 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Previous
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`h-9 w-9 rounded-xl text-xs font-bold transition ${
                      page === pageNum
                        ? "bg-purple-600 text-white shadow-sm shadow-purple-500/20"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <Button
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-9 px-3 gap-1.5 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200"
            >
              Next <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Deleting Teacher */}
      <ConfirmationDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleConfirmDelete}
        title="Remove Faculty Record"
        description="Are you sure you want to delete this faculty profile? This will unassign all their classes and courses."
        confirmText="Yes, Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
