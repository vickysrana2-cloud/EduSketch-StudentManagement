"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  UserCheck,
  Plus,
  ArrowUpRight,
  Search,
  Filter,
  Calendar,
  Layers,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Edit3,
  X,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Check,
  Hash,
} from "lucide-react";

import {
  useGetEnrollmentsQuery,
  useCreateEnrollmentMutation,
  usePromoteStudentMutation,
  useUpdateEnrollmentMutation,
  useUpdateEnrollmentStatusMutation,
  EnrollmentItem,
} from "@/store/api/enrollmentApi";
import { useGetStudentsQuery } from "@/store/api/studentApi";
import { useGetClassesQuery } from "@/store/api/academicApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { DoodleSpark } from "@/components/ui/doodles";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// ============================================================================
// Schemas
// ============================================================================

const enrollSchema = z.object({
  studentId: z.string().min(1, "Please select a student"),
  classId: z.string().min(1, "Please select target class"),
  academicYear: z
    .string()
    .regex(/^\d{4}-\d{4}$/, "Academic year must be in format YYYY-YYYY (e.g. 2026-2027)"),
  rollNumber: z.string().min(1, "Roll number is required (e.g. 12)"),
  enrollmentDate: z.string().optional(),
});

const promoteSchema = z.object({
  targetClassId: z.string().min(1, "Please select target next class"),
  newAcademicYear: z
    .string()
    .regex(/^\d{4}-\d{4}$/, "Academic year must be in format YYYY-YYYY (e.g. 2027-2028)"),
  newRollNumber: z.string().min(1, "New roll number is required (e.g. 15)"),
  enrollmentDate: z.string().optional(),
});

type EnrollFormValues = z.infer<typeof enrollSchema>;
type PromoteFormValues = z.infer<typeof promoteSchema>;

const STATUS_OPTIONS = ["ALL", "ACTIVE", "PROMOTED", "TRANSFERRED", "WITHDRAWN"];
const ACADEMIC_YEARS = ["ALL", "2026-2027", "2025-2026", "2024-2025"];

export default function EnrollmentsPage() {
  const { toast } = useToast();

  // Filters & Pagination State
  const [page, setPage] = useState(1);
  const limit = 10;
  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState("2026-2027");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Selection for bulk actions
  const [selectedEnrollmentIds, setSelectedEnrollmentIds] = useState<string[]>([]);

  // Modals State
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [enrollmentToPromote, setEnrollmentToPromote] = useState<EnrollmentItem | null>(null);
  const [editingEnrollment, setEditingEnrollment] = useState<EnrollmentItem | null>(null);

  // 409 Conflict Error State for Modals
  const [conflictError, setConflictError] = useState<string | null>(null);

  // ==========================================================================
  // Data Queries
  // ==========================================================================

  const {
    data: enrollmentsResult,
    isLoading,
    isFetching,
    refetch,
  } = useGetEnrollmentsQuery({
    page,
    limit,
    academicYear: selectedYear !== "ALL" ? selectedYear : undefined,
    classId: selectedClassId || undefined,
    status: selectedStatus !== "ALL" ? selectedStatus : undefined,
  });

  // Supporting queries for dropdowns
  const { data: studentsData } = useGetStudentsQuery({ limit: 100 });
  const studentsList = studentsData?.data || [];

  const { data: classesData } = useGetClassesQuery({ limit: 100 });
  const classesList = classesData?.items || classesData?.data || [];

  // Mutations
  const [createEnrollment, { isLoading: isEnrolling }] = useCreateEnrollmentMutation();
  const [promoteStudent, { isLoading: isPromoting }] = usePromoteStudentMutation();
  const [updateEnrollment, { isLoading: isUpdating }] = useUpdateEnrollmentMutation();
  const [updateEnrollmentStatus] = useUpdateEnrollmentStatusMutation();

  // ==========================================================================
  // Forms
  // ==========================================================================

  const {
    register: registerEnroll,
    handleSubmit: handleSubmitEnroll,
    reset: resetEnrollForm,
    formState: { errors: enrollErrors },
  } = useForm<EnrollFormValues>({
    resolver: zodResolver(enrollSchema) as any,
    defaultValues: {
      studentId: "",
      classId: "",
      academicYear: "2026-2027",
      rollNumber: "",
      enrollmentDate: new Date().toISOString().slice(0, 10),
    },
  });

  const {
    register: registerPromote,
    handleSubmit: handleSubmitPromote,
    reset: resetPromoteForm,
    formState: { errors: promoteErrors },
  } = useForm<PromoteFormValues>({
    resolver: zodResolver(promoteSchema) as any,
    defaultValues: {
      targetClassId: "",
      newAcademicYear: "2027-2028",
      newRollNumber: "",
      enrollmentDate: new Date().toISOString().slice(0, 10),
    },
  });

  // Open Enroll Modal
  const openEnrollModal = () => {
    setConflictError(null);
    resetEnrollForm({
      studentId: "",
      classId: selectedClassId || "",
      academicYear: selectedYear !== "ALL" ? selectedYear : "2026-2027",
      rollNumber: "",
      enrollmentDate: new Date().toISOString().slice(0, 10),
    });
    setIsEnrollModalOpen(true);
  };

  // Open Promote Modal for single or selected
  const openPromoteModal = (enrollment?: EnrollmentItem) => {
    setConflictError(null);
    if (enrollment) {
      setEnrollmentToPromote(enrollment);
    } else if (selectedEnrollmentIds.length > 0) {
      const firstSelected = enrollmentsList.find(
        (e) => e.id === selectedEnrollmentIds[0]
      );
      setEnrollmentToPromote(firstSelected || null);
    }
    resetPromoteForm({
      targetClassId: "",
      newAcademicYear: "2027-2028",
      newRollNumber: "",
      enrollmentDate: new Date().toISOString().slice(0, 10),
    });
    setIsPromoteModalOpen(true);
  };

  // ==========================================================================
  // Submit Handlers with 409 Conflict Handling
  // ==========================================================================

  const onSubmitEnroll = async (values: EnrollFormValues) => {
    setConflictError(null);
    try {
      await createEnrollment({
        studentId: values.studentId,
        classId: values.classId,
        academicYear: values.academicYear.trim(),
        rollNumber: values.rollNumber.trim(),
        enrollmentDate: values.enrollmentDate ? new Date(values.enrollmentDate).toISOString() : undefined,
      }).unwrap();

      toast({
        type: "success",
        title: "Student Enrolled",
        description: `Student successfully allocated to class with Roll #${values.rollNumber}.`,
      });
      setIsEnrollModalOpen(false);
    } catch (err: any) {
      const status = err?.status;
      const message =
        err?.data?.message || err?.message || "Failed to create enrollment.";

      // Handle 409 Conflict (duplicate enrollment in year or duplicate roll number)
      if (
        status === 409 ||
        (typeof message === "string" &&
          (message.includes("already enrolled") ||
            message.includes("Roll number") ||
            message.includes("already assigned")))
      ) {
        setConflictError(`409 Conflict: ${message}`);
        toast({
          type: "error",
          title: "Enrollment Conflict (409)",
          description: message,
        });
      } else {
        toast({
          type: "error",
          title: "Enrollment Failed",
          description: message,
        });
      }
    }
  };

  const onSubmitPromote = async (values: PromoteFormValues) => {
    setConflictError(null);

    // If bulk promotion of multiple selected students
    if (selectedEnrollmentIds.length > 1 && !enrollmentToPromote) {
      let successCount = 0;
      let failureCount = 0;
      let lastErrMsg = "";

      for (let i = 0; i < selectedEnrollmentIds.length; i++) {
        const enId = selectedEnrollmentIds[i];
        const assignedRoll = String(Number(values.newRollNumber) + i);
        try {
          await promoteStudent({
            currentEnrollmentId: enId,
            targetClassId: values.targetClassId,
            newAcademicYear: values.newAcademicYear.trim(),
            newRollNumber: assignedRoll,
            enrollmentDate: values.enrollmentDate ? new Date(values.enrollmentDate).toISOString() : undefined,
          }).unwrap();
          successCount++;
        } catch (err: any) {
          failureCount++;
          lastErrMsg = err?.data?.message || "Error promoting student";
        }
      }

      if (successCount > 0) {
        toast({
          type: "success",
          title: "Bulk Promotion Complete",
          description: `Successfully promoted ${successCount} student(s) to next grade.`,
        });
        setSelectedEnrollmentIds([]);
        setIsPromoteModalOpen(false);
      }
      if (failureCount > 0) {
        setConflictError(`409 Conflict on ${failureCount} record(s): ${lastErrMsg}`);
        toast({
          type: "error",
          title: "Promotion Conflicts Encountered",
          description: `${failureCount} student(s) could not be promoted: ${lastErrMsg}`,
        });
      }
      return;
    }

    // Single student promotion
    if (!enrollmentToPromote) return;

    try {
      await promoteStudent({
        currentEnrollmentId: enrollmentToPromote.id,
        targetClassId: values.targetClassId,
        newAcademicYear: values.newAcademicYear.trim(),
        newRollNumber: values.newRollNumber.trim(),
        enrollmentDate: values.enrollmentDate ? new Date(values.enrollmentDate).toISOString() : undefined,
      }).unwrap();

      toast({
        type: "success",
        title: "Student Promoted",
        description: `${enrollmentToPromote.studentName} promoted to new class (${values.newAcademicYear}) with Roll #${values.newRollNumber}.`,
      });
      setIsPromoteModalOpen(false);
      setEnrollmentToPromote(null);
    } catch (err: any) {
      const status = err?.status;
      const message =
        err?.data?.message || err?.message || "Failed to promote student.";

      if (
        status === 409 ||
        (typeof message === "string" &&
          (message.includes("already enrolled") ||
            message.includes("Roll number") ||
            message.includes("already assigned")))
      ) {
        setConflictError(`409 Conflict: ${message}`);
        toast({
          type: "error",
          title: "Promotion Conflict (409)",
          description: message,
        });
      } else {
        toast({
          type: "error",
          title: "Promotion Failed",
          description: message,
        });
      }
    }
  };

  // Quick Status Change Handler
  const handleStatusChange = async (
    enrollment: EnrollmentItem,
    newStatus: string
  ) => {
    try {
      await updateEnrollmentStatus({
        id: enrollment.id,
        status: newStatus as any,
      }).unwrap();
      toast({
        type: "success",
        title: "Status Updated",
        description: `Enrollment status updated to ${newStatus}.`,
      });
    } catch (err: any) {
      toast({
        type: "error",
        title: "Status Update Failed",
        description: err?.data?.message || "Could not change status.",
      });
    }
  };

  const rawEnrollments = enrollmentsResult?.items || [];
  // Client-side text filter by student name or admission number
  const enrollmentsList = useMemo(() => {
    if (!search.trim()) return rawEnrollments;
    const q = search.toLowerCase();
    return rawEnrollments.filter((e) => {
      const name = (e.studentName || "").toLowerCase();
      const adm = (e.admissionNumber || "").toLowerCase();
      const roll = (e.rollNumber || "").toLowerCase();
      return name.includes(q) || adm.includes(q) || roll.includes(q);
    });
  }, [rawEnrollments, search]);

  const totalRecords = enrollmentsResult?.total || 0;
  const totalPages = enrollmentsResult?.totalPages || 1;

  // Toggle selection
  const toggleSelectAll = () => {
    if (selectedEnrollmentIds.length === enrollmentsList.length) {
      setSelectedEnrollmentIds([]);
    } else {
      setSelectedEnrollmentIds(enrollmentsList.map((e) => e.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedEnrollmentIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Student Enrollments <DoodleSpark className="h-6 w-6 text-[#4D9FFF]" />
            </h1>
            <Badge variant="blue" className="hidden sm:inline-flex text-xs">
              {selectedYear !== "ALL" ? selectedYear : "All Sessions"}
            </Badge>
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
            Track student classroom allocations, seat roll numbers, and annual academic grade promotions
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedEnrollmentIds.length > 0 && (
            <Button
              variant="default"
              onClick={() => openPromoteModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs gap-1.5 shadow-sm rounded-xl"
            >
              <ArrowUpRight className="h-4 w-4" />
              <span>Bulk Promote ({selectedEnrollmentIds.length})</span>
            </Button>
          )}

          <Button
            variant="yellow"
            onClick={openEnrollModal}
            className="font-handwriting text-base gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" /> Enroll Student
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, admission number, or roll number..."
              className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Academic Year Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="hidden sm:inline font-semibold">Session:</span>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 border-none text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                {ACADEMIC_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y === "ALL" ? "All Sessions" : y}
                  </option>
                ))}
              </select>
            </div>

            {/* Class Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="hidden sm:inline font-semibold">Class:</span>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 border-none text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer max-w-[160px]"
              >
                <option value="">All Classes</option>
                {classesList.map((c: any) => (
                  <option key={c.id || c._id} value={c.id || c._id}>
                    {c.name} (Grade {c.grade}-{c.section})
                  </option>
                ))}
              </select>
            </div>

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
          </div>
        </div>

        {/* Counter and Active Selection Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500">
          <span>
            Showing <strong className="text-slate-700 dark:text-slate-300">{enrollmentsList.length}</strong> of{" "}
            <strong className="text-slate-700 dark:text-slate-300">{totalRecords}</strong> enrollment records
          </span>

          <div className="flex items-center gap-3">
            {selectedEnrollmentIds.length > 0 && (
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {selectedEnrollmentIds.length} row(s) selected
              </span>
            )}
            {(search || selectedYear !== "ALL" || selectedClassId || selectedStatus !== "ALL") && (
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedYear("ALL");
                  setSelectedClassId("");
                  setSelectedStatus("ALL");
                  setPage(1);
                }}
                className="text-blue-600 hover:underline font-semibold"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table View */}
      {isLoading ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <Skeleton className="h-6 w-44 rounded-lg" />
              <Skeleton className="h-6 w-28 rounded-lg" />
              <Skeleton className="h-6 w-20 rounded-lg" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          ))}
        </div>
      ) : enrollmentsList.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-3">
          <UserCheck className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-700" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
            No Enrollments Found
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            No student enrollment records match your active filters or academic term.
          </p>
          <Button variant="yellow" onClick={openEnrollModal} className="mt-2">
            <Plus className="h-4 w-4 mr-1.5" /> Enroll Student
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th scope="col" className="py-3.5 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={
                        selectedEnrollmentIds.length === enrollmentsList.length &&
                        enrollmentsList.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                    />
                  </th>
                  <th scope="col" className="py-3.5 px-4">Student</th>
                  <th scope="col" className="py-3.5 px-4">Allocated Class</th>
                  <th scope="col" className="py-3.5 px-4">Academic Year</th>
                  <th scope="col" className="py-3.5 px-4">Roll Number</th>
                  <th scope="col" className="py-3.5 px-4">Status</th>
                  <th scope="col" className="py-3.5 px-4 hidden md:table-cell">Enrollment Date</th>
                  <th scope="col" className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {enrollmentsList.map((en) => {
                  const isChecked = selectedEnrollmentIds.includes(en.id);
                  const isAct = en.status === "ACTIVE";

                  let badgeVariant: "green" | "blue" | "yellow" | "outline" = "outline";
                  if (en.status === "ACTIVE") badgeVariant = "green";
                  else if (en.status === "PROMOTED") badgeVariant = "blue";
                  else if (en.status === "TRANSFERRED") badgeVariant = "yellow";

                  return (
                    <tr
                      key={en.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                        isChecked ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectRow(en.id)}
                          className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                        />
                      </td>

                      {/* Student Name & Admission Number */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                            {en.studentName?.charAt(0) || "S"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100">
                              {en.studentName}
                            </p>
                            <p className="font-mono text-[11px] text-blue-600 font-bold">
                              {en.admissionNumber}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Class */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-200/60 dark:border-blue-900/60">
                          <Layers className="h-3 w-3 text-blue-500" />
                          {en.className}
                        </span>
                      </td>

                      {/* Academic Year */}
                      <td className="py-3.5 px-4 font-semibold text-xs text-slate-700 dark:text-slate-300">
                        {en.academicYear}
                      </td>

                      {/* Roll Number */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          #{en.rollNumber}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        <Badge variant={badgeVariant} className="text-[10px] uppercase font-bold">
                          {en.status}
                        </Badge>
                      </td>

                      {/* Enrollment Date */}
                      <td className="py-3.5 px-4 hidden md:table-cell text-xs text-slate-500">
                        {new Date(en.enrollmentDate).toLocaleDateString()}
                      </td>

                      {/* Row Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Promote Action */}
                          {isAct && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openPromoteModal(en)}
                              className="h-8 px-2.5 text-xs font-semibold gap-1 text-blue-600 border-blue-200 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg"
                              title="Promote to Next Grade"
                            >
                              <ArrowUpRight className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Promote</span>
                            </Button>
                          )}

                          {/* Quick Status Select */}
                          <select
                            value={en.status}
                            onChange={(e) => handleStatusChange(en, e.target.value)}
                            className="h-8 text-[11px] font-semibold px-2 rounded-lg bg-slate-100 dark:bg-slate-800 border-none text-slate-700 dark:text-slate-200 cursor-pointer"
                            title="Change Enrollment Status"
                          >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="PROMOTED">PROMOTED</option>
                            <option value="TRANSFERRED">TRANSFERRED</option>
                            <option value="WITHDRAWN">WITHDRAWN</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200/80 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500">
            Showing {(page - 1) * limit + 1} to{" "}
            {Math.min(page * limit, totalRecords)} of {totalRecords} enrollments
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isFetching}
              className="h-8 px-3 text-xs font-semibold gap-1 rounded-xl"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
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
              disabled={page === totalPages || isFetching}
              className="h-8 px-3 text-xs font-semibold gap-1 rounded-xl"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: ENROLL STUDENT (POST /enrollments) + 409 Conflict Handling     */}
      {/* ===================================================================== */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 p-7 sketch-shadow border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-handwriting text-slate-900 dark:text-slate-100">
                    Enroll Student into Class
                  </h3>
                  <p className="text-xs text-slate-500">
                    Allocate student profile to class with unique roll number
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEnrollModalOpen(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 409 Conflict Banner */}
            {conflictError && (
              <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                <div>
                  <p className="font-bold">Enrollment Conflict</p>
                  <p className="mt-0.5">{conflictError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitEnroll(onSubmitEnroll as any)} className="space-y-4 pt-4">
              {/* Student Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Student *
                </label>
                <select
                  {...registerEnroll("studentId")}
                  className="w-full h-10 px-3 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">-- Choose Student Profile --</option>
                  {studentsList.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.admissionNumber || s.admissionNo})
                    </option>
                  ))}
                </select>
                {enrollErrors.studentId && (
                  <p className="text-xs text-rose-500 font-semibold">
                    {enrollErrors.studentId.message}
                  </p>
                )}
              </div>

              {/* Target Class Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Target Class & Section *
                </label>
                <select
                  {...registerEnroll("classId")}
                  className="w-full h-10 px-3 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">-- Select Active Class --</option>
                  {classesList.map((c: any) => (
                    <option key={c.id || c._id} value={c.id || c._id}>
                      {c.name} (Grade {c.grade}-{c.section}) • Cap: {c.studentCount || 0}/{c.capacity || 40}
                    </option>
                  ))}
                </select>
                {enrollErrors.classId && (
                  <p className="text-xs text-rose-500 font-semibold">
                    {enrollErrors.classId.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Academic Year (YYYY-YYYY) *"
                  placeholder="2026-2027"
                  {...registerEnroll("academicYear")}
                  error={enrollErrors.academicYear?.message}
                />

                <Input
                  label="Roll Number / Seat No. *"
                  placeholder="e.g. 14"
                  {...registerEnroll("rollNumber")}
                  error={enrollErrors.rollNumber?.message}
                />
              </div>

              <Input
                label="Enrollment Date"
                type="date"
                {...registerEnroll("enrollmentDate")}
                error={enrollErrors.enrollmentDate?.message}
              />

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEnrollModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="yellow"
                  isLoading={isEnrolling}
                >
                  Confirm Enrollment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: PROMOTE STUDENT(S) (POST /enrollments/promote) + 409 Handling  */}
      {/* ===================================================================== */}
      {isPromoteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 p-7 sketch-shadow border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-bold">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-handwriting text-slate-900 dark:text-slate-100">
                    Promote to Next Grade
                  </h3>
                  <p className="text-xs text-slate-500">
                    {enrollmentToPromote
                      ? `${enrollmentToPromote.studentName} (${enrollmentToPromote.className})`
                      : `Promoting ${selectedEnrollmentIds.length} selected student(s)`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsPromoteModalOpen(false);
                  setEnrollmentToPromote(null);
                }}
                className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 409 Conflict Banner */}
            {conflictError && (
              <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                <div>
                  <p className="font-bold">Promotion Conflict</p>
                  <p className="mt-0.5">{conflictError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitPromote(onSubmitPromote as any)} className="space-y-4 pt-4">
              {/* Target Class Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Target Promoted Class & Section *
                </label>
                <select
                  {...registerPromote("targetClassId")}
                  className="w-full h-10 px-3 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
                >
                  <option value="">-- Choose Next Class / Grade --</option>
                  {classesList.map((c: any) => (
                    <option key={c.id || c._id} value={c.id || c._id}>
                      {c.name} (Grade {c.grade}-{c.section}) • Term {c.academicYear} • Cap: {c.studentCount || 0}/{c.capacity || 40}
                    </option>
                  ))}
                </select>
                {promoteErrors.targetClassId && (
                  <p className="text-xs text-rose-500 font-semibold">
                    {promoteErrors.targetClassId.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="New Academic Year *"
                  placeholder="2027-2028"
                  {...registerPromote("newAcademicYear")}
                  error={promoteErrors.newAcademicYear?.message}
                />

                <Input
                  label="New Roll Number *"
                  placeholder="e.g. 15"
                  {...registerPromote("newRollNumber")}
                  error={promoteErrors.newRollNumber?.message}
                />
              </div>

              <Input
                label="Promotion Date"
                type="date"
                {...registerPromote("enrollmentDate")}
                error={promoteErrors.enrollmentDate?.message}
              />

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  Historical Preservation Note:
                </p>
                <p>
                  The previous enrollment record will be safely marked as <strong className="text-blue-600 font-semibold">PROMOTED</strong>, preserving full historical continuity.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsPromoteModalOpen(false);
                    setEnrollmentToPromote(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  isLoading={isPromoting}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                >
                  Confirm Promotion
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

