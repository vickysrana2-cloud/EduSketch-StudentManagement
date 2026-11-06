"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Plus,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Eye,
  Filter,
  GraduationCap,
  Sparkles,
  LayoutGrid,
  List,
  CheckCircle2,
  XCircle,
  MoreVertical,
  X,
} from "lucide-react";
import { useGetStudentsQuery, useDeleteStudentMutation } from "@/store/api/studentApi";
import { useGetClassesQuery } from "@/store/api/academicApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useToast } from "@/components/ui/toast";
import { DoodleSpark } from "@/components/ui/doodles";

const STATUS_OPTIONS = ["ALL", "ACTIVE", "INACTIVE"];

export default function StudentListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [, startTransition] = useTransition();

  // Read initial pagination and filters from URL query parameters
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const initialLimit = parseInt(searchParams.get("limit") || "10", 10);
  const initialSearch = searchParams.get("search") || "";
  const initialStatus = searchParams.get("status") || "ALL";
  const initialClass = searchParams.get("class") || "ALL";

  const [page, setPage] = useState(initialPage > 0 ? initialPage : 1);
  const [limit, setLimit] = useState(initialLimit > 0 ? initialLimit : 10);
  const [search, setSearch] = useState(initialSearch);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [selectedClass, setSelectedClass] = useState(initialClass);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [deletingId, setDeletingId] = useState<number | string | null>(null);

  // Sync state changes with URL query parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (limit !== 10) params.set("limit", String(limit));
    if (search.trim()) params.set("search", search.trim());
    if (selectedStatus !== "ALL") params.set("status", selectedStatus);
    if (selectedClass !== "ALL") params.set("class", selectedClass);

    const queryString = params.toString();
    startTransition(() => {
      router.replace(queryString ? `?${queryString}` : "/students", { scroll: false });
    });
  }, [page, limit, search, selectedStatus, selectedClass, router]);

  // Query students from backend
  const { data, isLoading, isError, refetch } = useGetStudentsQuery({
    page,
    limit,
    search,
    status: selectedStatus !== "ALL" ? selectedStatus : undefined,
  });

  // Query classes for class filter dropdown
  const { data: classesData } = useGetClassesQuery({ limit: 100 });
  const realClasses = classesData?.items || classesData?.data || [];

  const [deleteStudent, { isLoading: isDeleting }] = useDeleteStudentMutation();

  const handleConfirmDelete = async () => {
    if (!deletingId) return;

    try {
      await deleteStudent(deletingId).unwrap();
      toast({
        type: "success",
        title: "Student Record Removed",
        description: "The student record has been successfully deleted.",
      });
    } catch (err: any) {
      toast({
        type: "error",
        title: "Deletion Failed",
        description: err?.data?.message || "Unable to remove student profile.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const rawStudents = data?.data || [];
  // Filter for class if selected
  const students =
    selectedClass === "ALL"
      ? rawStudents
      : rawStudents.filter((s) => {
          const cName = (s.class || "").toLowerCase();
          const target = selectedClass.toLowerCase();
          return cName.includes(target);
        });

  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages || 1;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400">
              <GraduationCap className="h-5 w-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100">
              Student Directory
            </h1>
            <DoodleSpark className="h-5 w-5 text-amber-500" />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse and manage all registered student profiles, admission numbers, and enrollment records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Card / Table Toggle */}
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/80 dark:border-slate-700">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition ${
                viewMode === "table"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`p-1.5 rounded-lg transition ${
                viewMode === "card"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          <Link href="/students/new">
            <Button
              variant="default"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1.5 shadow-sm rounded-xl"
            >
              <Plus className="h-4 w-4" />
              <span>Admit Student</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by student name, admission number, or email..."
              className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="hidden sm:inline font-semibold">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 border-none text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st === "ALL" ? "All Statuses" : st}
                  </option>
                ))}
              </select>
            </div>

            {/* Class Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="hidden sm:inline font-semibold">Class:</span>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 border-none text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer max-w-[160px]"
              >
                <option value="ALL">All Classes</option>
                {realClasses.length > 0 ? (
                  realClasses.map((c: any) => (
                    <option key={c.id || c._id} value={c.name}>
                      {c.name}
                    </option>
                  ))
                ) : (
                  ["Grade 9", "Grade 10", "Grade 11", "Grade 12"].map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Items Per Page */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="hidden sm:inline font-semibold">Show:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 border-none text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>

        {pagination && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500">
            <span>
              Showing <strong className="text-slate-700 dark:text-slate-300">{students.length}</strong> of{" "}
              <strong className="text-slate-700 dark:text-slate-300">{pagination.totalRecords}</strong> registered student profiles
            </span>
            {(search || selectedStatus !== "ALL" || selectedClass !== "ALL") && (
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedStatus("ALL");
                  setSelectedClass("ALL");
                  setPage(1);
                }}
                className="text-blue-600 hover:underline font-semibold"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 space-y-4 shadow-xs">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36 bg-slate-200 dark:bg-slate-800" />
                  <Skeleton className="h-3 w-48 bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
              <Skeleton className="h-6 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
              <Skeleton className="h-8 w-20 rounded-lg bg-slate-200 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          onRetry={refetch}
          message="Failed to retrieve student profiles from the backend service. Check network or server status."
        />
      ) : students.length === 0 ? (
        <EmptyState
          title="No Students Found"
          description={
            search || selectedStatus !== "ALL" || selectedClass !== "ALL"
              ? "No student records matched your specified search query or filters."
              : "There are currently no registered students in this institution."
          }
          actionLabel="+ Admit First Student"
          onAction={() => router.push("/students/new")}
        />
      ) : viewMode === "table" ? (
        /* Table View */
        <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800/80 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th scope="col" className="py-3.5 px-4 sm:px-6">Student</th>
                  <th scope="col" className="py-3.5 px-4">Admission No</th>
                  <th scope="col" className="py-3.5 px-4">Class & Section</th>
                  <th scope="col" className="py-3.5 px-4">Status</th>
                  <th scope="col" className="py-3.5 px-4 hidden md:table-cell">Gender & Age</th>
                  <th scope="col" className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {students.map((student) => {
                  const initial = student.name?.charAt(0)?.toUpperCase() || "S";
                  const isActive = (student.status || "active").toLowerCase() === "active";
                  const admissionNo =
                    student.admissionNumber ||
                    student.admissionNo ||
                    "ADM-" + String(student.id).slice(-4).toUpperCase();

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Avatar & Name */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                            {initial}
                          </div>
                          <div>
                            <Link
                              href={`/students/${student.id}`}
                              className="font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 transition"
                            >
                              {student.name}
                            </Link>
                            <p className="text-[11px] text-slate-500 truncate max-w-[160px] sm:max-w-xs">
                              {student.email || "No email assigned"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Admission Number */}
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-slate-700 dark:text-slate-300">
                        {admissionNo}
                      </td>

                      {/* Class */}
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        <span className="font-semibold">{student.class || "Grade 10"}</span>
                        <span className="text-slate-400 ml-1">({student.section || "A"})</span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isActive
                              ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
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

                      {/* Gender & Age */}
                      <td className="py-3.5 px-4 hidden md:table-cell text-slate-500 text-xs">
                        {student.gender || "Not specified"} • {student.age ? `${student.age} yrs` : "N/A"}
                      </td>

                      {/* Row Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/students/${student.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2.5 text-xs font-semibold gap-1 text-blue-600 border-blue-200 dark:border-blue-900/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>View</span>
                            </Button>
                          </Link>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeletingId(student.id)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                            title="Delete Student"
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
        /* Card / Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((student) => {
            const initial = student.name?.charAt(0)?.toUpperCase() || "S";
            const isActive = (student.status || "active").toLowerCase() === "active";
            const admissionNo =
              student.admissionNumber ||
              student.admissionNo ||
              "ADM-" + String(student.id).slice(-4).toUpperCase();

            return (
              <div
                key={student.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-xs hover:border-blue-300 dark:hover:border-blue-800 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                      {initial}
                    </div>
                    <div>
                      <Link
                        href={`/students/${student.id}`}
                        className="font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 transition text-sm"
                      >
                        {student.name}
                      </Link>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        {admissionNo}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Class & Section:</span>
                    <span className="font-semibold">{student.class || "Grade 10"} - {student.section || "A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gender / Age:</span>
                    <span>{student.gender || "N/A"} • {student.age ? `${student.age} yrs` : "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="truncate max-w-[170px]">{student.email || "No email"}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                  <Link href={`/students/${student.id}`} className="w-full">
                    <Button size="sm" variant="outline" className="w-full text-xs font-semibold text-blue-600">
                      View Profile
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeletingId(student.id)}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Synchronized Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200/80 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500">
            Page <strong className="text-slate-800 dark:text-slate-200">{page}</strong> of{" "}
            <strong className="text-slate-800 dark:text-slate-200">{totalPages}</strong>
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 px-3 text-xs font-semibold gap-1 rounded-xl"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Prev
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNumber = idx + 1;
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setPage(pageNumber)}
                    className={`h-8 w-8 rounded-xl text-xs font-bold transition ${
                      page === pageNumber
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-8 px-3 text-xs font-semibold gap-1 rounded-xl"
            >
              Next <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Student Record"
        description="Are you sure you want to remove this student's profile? This action will archive their admission record."
        confirmText="Delete Record"
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
}
