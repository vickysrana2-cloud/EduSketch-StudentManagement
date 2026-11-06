"use client";

import React, { useState, useMemo } from "react";
import {
  BookOpen,
  Plus,
  Calendar,
  Layers,
  Hash,
  CheckCircle2,
  Trash2,
  Edit3,
  Users,
  UserCheck,
  Search,
  Filter,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  School,
  X,
  RefreshCw,
  DoorOpen,
} from "lucide-react";
import {
  useGetAcademicSessionsQuery,
  useGetClassesQuery,
  useCreateClassMutation,
  useUpdateClassMutation,
  useUpdateClassStatusMutation,
  useDeleteClassMutation,
  useGetSubjectsQuery,
  useCreateSubjectMutation,
  useUpdateSubjectMutation,
  useAssignSubjectTeachersMutation,
  useDeleteSubjectMutation,
  ClassItem,
  SubjectItem,
} from "@/store/api/academicApi";
import { useGetTeachersQuery } from "@/store/api/teacherApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { DoodleSpark, DoodleStar } from "@/components/ui/doodles";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// ============================================================================
// Schemas
// ============================================================================

const classFormSchema = z.object({
  name: z.string().min(2, "Class name required (e.g. Class 10-A)"),
  grade: z.coerce.number().min(1, "Grade must be at least 1").max(12, "Grade cannot exceed 12"),
  section: z.string().min(1, "Section is required (e.g. A)").max(5, "Max 5 characters"),
  academicYear: z
    .string()
    .regex(/^\d{4}-\d{4}$/, "Academic year must be in format YYYY-YYYY (e.g. 2026-2027)"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1").max(200, "Max capacity 200"),
  roomNumber: z.string().optional(),
  classTeacherId: z.string().optional(),
  status: z.enum(["ACTIVE", "ARCHIVED", "INACTIVE"]).default("ACTIVE"),
});

const subjectFormSchema = z.object({
  name: z.string().min(2, "Subject name required (e.g. Advanced Mathematics)"),
  code: z
    .string()
    .min(2, "Subject code required (e.g. MATH101)")
    .max(10, "Max 10 characters")
    .transform((val) => val.trim().toUpperCase()),
  classId: z.string().min(1, "Please select an associated class"),
  academicYear: z
    .string()
    .regex(/^\d{4}-\d{4}$/, "Academic year must be in format YYYY-YYYY (e.g. 2026-2027)"),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "ARCHIVED", "INACTIVE"]).default("ACTIVE"),
});

type ClassFormValues = z.infer<typeof classFormSchema>;
type SubjectFormValues = z.infer<typeof subjectFormSchema>;

export default function AcademicsPage() {
  const { toast } = useToast();

  // Navigation & Tab State
  const [activeTab, setActiveTab] = useState<"classes" | "subjects">("classes");

  // Shared Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [academicYearFilter, setAcademicYearFilter] = useState("2026-2027");

  // Classes Filters & Pagination
  const [classGradeFilter, setClassGradeFilter] = useState<string>("");
  const [classStatusFilter, setClassStatusFilter] = useState<string>("");
  const [classPage, setClassPage] = useState(1);
  const classLimit = 8;

  // Subjects Filters & Pagination
  const [subjectClassFilter, setSubjectClassFilter] = useState<string>("");
  const [subjectStatusFilter, setSubjectStatusFilter] = useState<string>("");
  const [subjectPage, setSubjectPage] = useState(1);
  const subjectLimit = 10;

  // Modals State
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignSubject, setAssignSubject] = useState<SubjectItem | null>(null);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [teacherSearchQuery, setTeacherSearchQuery] = useState("");

  // Delete Confirm Dialogs
  const [classToDelete, setClassToDelete] = useState<ClassItem | null>(null);
  const [conflictErrorMessage, setConflictErrorMessage] = useState<string | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<SubjectItem | null>(null);

  // ==========================================================================
  // Data Queries
  // ==========================================================================

  // Sessions Query
  const { data: sessions = [] } = useGetAcademicSessionsQuery();

  // Classes Query with filters
  const {
    data: classesResult,
    isLoading: isLoadingClasses,
    isFetching: isFetchingClasses,
  } = useGetClassesQuery({
    page: classPage,
    limit: classLimit,
    search: searchQuery ? searchQuery.trim() : undefined,
    academicYear: academicYearFilter || undefined,
    grade: classGradeFilter ? Number(classGradeFilter) : undefined,
    status: classStatusFilter || undefined,
  });

  // Subjects Query with filters
  const {
    data: subjectsResult,
    isLoading: isLoadingSubjects,
    isFetching: isFetchingSubjects,
  } = useGetSubjectsQuery({
    page: subjectPage,
    limit: subjectLimit,
    search: searchQuery ? searchQuery.trim() : undefined,
    academicYear: academicYearFilter || undefined,
    classId: subjectClassFilter || undefined,
    status: subjectStatusFilter || undefined,
  });

  // Full classes list for subject dropdown selection
  const { data: allClassesResult } = useGetClassesQuery({ limit: 100 });
  const allClasses = allClassesResult?.items || [];

  // Teachers Query for assignments
  const { data: teachersData } = useGetTeachersQuery({ limit: 100 });
  const teachersList = (teachersData as any)?.items || teachersData?.data || [];

  // Mutations
  const [createClass, { isLoading: isCreatingClass }] = useCreateClassMutation();
  const [updateClass, { isLoading: isUpdatingClass }] = useUpdateClassMutation();
  const [updateClassStatus] = useUpdateClassStatusMutation();
  const [deleteClass, { isLoading: isDeletingClass }] = useDeleteClassMutation();

  const [createSubject, { isLoading: isCreatingSubject }] = useCreateSubjectMutation();
  const [updateSubject, { isLoading: isUpdatingSubject }] = useUpdateSubjectMutation();
  const [assignSubjectTeachers, { isLoading: isAssigningTeachers }] =
    useAssignSubjectTeachersMutation();
  const [deleteSubject, { isLoading: isDeletingSubject }] = useDeleteSubjectMutation();

  // ==========================================================================
  // Forms Setup
  // ==========================================================================

  const {
    register: registerClass,
    handleSubmit: handleSubmitClass,
    reset: resetClassForm,
    formState: { errors: classErrors },
  } = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema) as any,
    defaultValues: {
      name: "",
      grade: 10,
      section: "A",
      academicYear: "2026-2027",
      capacity: 40,
      roomNumber: "",
      classTeacherId: "",
      status: "ACTIVE",
    },
  });

  const {
    register: registerSubject,
    handleSubmit: handleSubmitSubject,
    reset: resetSubjectForm,
    formState: { errors: subjectErrors },
  } = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectFormSchema) as any,
    defaultValues: {
      name: "",
      code: "",
      classId: "",
      academicYear: "2026-2027",
      description: "",
      status: "ACTIVE",
    },
  });

  // Open Create Class Modal
  const openCreateClassModal = () => {
    setEditingClass(null);
    resetClassForm({
      name: "",
      grade: 10,
      section: "A",
      academicYear: academicYearFilter || "2026-2027",
      capacity: 40,
      roomNumber: "",
      classTeacherId: "",
      status: "ACTIVE",
    });
    setIsClassModalOpen(true);
  };

  // Open Edit Class Modal
  const openEditClassModal = (cls: ClassItem) => {
    setEditingClass(cls);
    resetClassForm({
      name: cls.name,
      grade: cls.grade,
      section: cls.section,
      academicYear: cls.academicYear,
      capacity: cls.capacity,
      roomNumber: cls.roomNumber || "",
      classTeacherId:
        typeof cls.classTeacherId === "object" && cls.classTeacherId
          ? cls.classTeacherId._id || cls.classTeacherId.id
          : cls.classTeacherId || "",
      status: (cls.status as any) || "ACTIVE",
    });
    setIsClassModalOpen(true);
  };

  // Open Create Subject Modal
  const openCreateSubjectModal = () => {
    setEditingSubject(null);
    resetSubjectForm({
      name: "",
      code: "",
      classId: subjectClassFilter || (allClasses[0]?.id as string) || "",
      academicYear: academicYearFilter || "2026-2027",
      description: "",
      status: "ACTIVE",
    });
    setIsSubjectModalOpen(true);
  };

  // Open Edit Subject Modal
  const openEditSubjectModal = (subj: SubjectItem) => {
    setEditingSubject(subj);
    const classIdVal =
      typeof subj.classId === "object" && subj.classId
        ? subj.classId._id || subj.classId.id
        : subj.classId || "";

    resetSubjectForm({
      name: subj.name,
      code: subj.code,
      classId: classIdVal,
      academicYear: subj.academicYear,
      description: subj.description || "",
      status: (subj.status as any) || "ACTIVE",
    });
    setIsSubjectModalOpen(true);
  };

  // Open Assign Teachers Modal
  const openAssignTeachersModal = (subj: SubjectItem) => {
    setAssignSubject(subj);
    const currentTeacherIds = Array.isArray(subj.teacherIds)
      ? subj.teacherIds.map((t: any) =>
          typeof t === "object" && t ? t._id || t.id : String(t)
        )
      : [];
    setSelectedTeacherIds(currentTeacherIds);
    setTeacherSearchQuery("");
    setIsAssignModalOpen(true);
  };

  // ==========================================================================
  // Form Submit Handlers
  // ==========================================================================

  const onSubmitClass = async (values: ClassFormValues) => {
    try {
      if (editingClass) {
        await updateClass({
          id: editingClass.id,
          name: values.name,
          grade: values.grade,
          section: values.section.toUpperCase(),
          academicYear: values.academicYear,
          capacity: values.capacity,
          roomNumber: values.roomNumber || null,
          classTeacherId: values.classTeacherId || null,
          status: values.status,
        }).unwrap();
        toast({
          type: "success",
          title: "Class Updated",
          description: `Class ${values.name} has been updated successfully.`,
        });
      } else {
        await createClass({
          name: values.name,
          grade: values.grade,
          section: values.section.toUpperCase(),
          academicYear: values.academicYear,
          capacity: values.capacity,
          roomNumber: values.roomNumber || null,
          classTeacherId: values.classTeacherId || null,
          status: values.status,
        }).unwrap();
        toast({
          type: "success",
          title: "Class Created",
          description: `Class ${values.name} (${values.grade}-${values.section.toUpperCase()}) added to curriculum.`,
        });
      }
      setIsClassModalOpen(false);
    } catch (err: any) {
      toast({
        type: "error",
        title: "Action Failed",
        description: err?.data?.message || err?.message || "Failed to save class.",
      });
    }
  };

  const onSubmitSubject = async (values: SubjectFormValues) => {
    try {
      if (editingSubject) {
        await updateSubject({
          id: editingSubject.id,
          name: values.name,
          code: values.code.toUpperCase(),
          academicYear: values.academicYear,
          description: values.description || null,
          status: values.status,
        }).unwrap();
        toast({
          type: "success",
          title: "Subject Updated",
          description: `Subject ${values.name} (${values.code}) updated successfully.`,
        });
      } else {
        await createSubject({
          name: values.name,
          code: values.code.toUpperCase(),
          classId: values.classId,
          academicYear: values.academicYear,
          description: values.description || null,
          status: values.status,
        }).unwrap();
        toast({
          type: "success",
          title: "Subject Registered",
          description: `Course ${values.name} registered under selected class.`,
        });
      }
      setIsSubjectModalOpen(false);
    } catch (err: any) {
      toast({
        type: "error",
        title: "Subject Save Failed",
        description: err?.data?.message || err?.message || "Failed to save subject.",
      });
    }
  };

  // Toggle Class Status
  const handleToggleClassStatus = async (cls: ClassItem) => {
    const nextStatus = cls.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE";
    try {
      await updateClassStatus({ id: cls.id, status: nextStatus }).unwrap();
      toast({
        type: "success",
        title: "Status Changed",
        description: `Class ${cls.name} marked as ${nextStatus}.`,
      });
    } catch (err: any) {
      toast({
        type: "error",
        title: "Status Update Failed",
        description: err?.data?.message || "Could not update class status.",
      });
    }
  };

  // Delete Class with 409 Active Enrollments error handling
  const handleConfirmDeleteClass = async () => {
    if (!classToDelete) return;
    setConflictErrorMessage(null);

    try {
      await deleteClass(classToDelete.id).unwrap();
      toast({
        type: "success",
        title: "Class Deleted",
        description: `Class ${classToDelete.name} was successfully removed.`,
      });
      setClassToDelete(null);
    } catch (err: any) {
      const status = err?.status;
      const message =
        err?.data?.message ||
        err?.message ||
        "Cannot delete class with active student enrollments.";

      // Check if 409 Conflict or message mentions active enrollments
      if (
        status === 409 ||
        status === 400 ||
        (typeof message === "string" &&
          (message.toLowerCase().includes("enrollment") ||
            message.toLowerCase().includes("active student")))
      ) {
        const errorText =
          "409 Conflict: Cannot delete class with active student enrollments. Transfer or withdraw students first.";
        setConflictErrorMessage(errorText);
        toast({
          type: "error",
          title: "Cannot Delete Class (409 Conflict)",
          description: errorText,
        });
      } else {
        toast({
          type: "error",
          title: "Delete Failed",
          description: message,
        });
        setClassToDelete(null);
      }
    }
  };

  // Save Teacher Assignments for Subject
  const handleSaveTeacherAssignments = async () => {
    if (!assignSubject) return;
    try {
      await assignSubjectTeachers({
        id: assignSubject.id,
        teacherIds: selectedTeacherIds,
      }).unwrap();
      toast({
        type: "success",
        title: "Teachers Assigned",
        description: `Assigned ${selectedTeacherIds.length} faculty member(s) to ${assignSubject.name}.`,
      });
      setIsAssignModalOpen(false);
    } catch (err: any) {
      toast({
        type: "error",
        title: "Assignment Failed",
        description: err?.data?.message || "Failed to update teacher assignments.",
      });
    }
  };

  // Delete Subject Handler
  const handleConfirmDeleteSubject = async () => {
    if (!subjectToDelete) return;
    try {
      await deleteSubject(subjectToDelete.id).unwrap();
      toast({
        type: "success",
        title: "Subject Deleted",
        description: `Course ${subjectToDelete.name} was successfully removed.`,
      });
      setSubjectToDelete(null);
    } catch (err: any) {
      toast({
        type: "error",
        title: "Delete Failed",
        description: err?.data?.message || "Failed to delete subject.",
      });
    }
  };

  // Filtered teachers list inside assignment modal
  const filteredTeachersForModal = useMemo(() => {
    if (!teacherSearchQuery.trim()) return teachersList;
    const q = teacherSearchQuery.toLowerCase();
    return teachersList.filter((t: any) => {
      const name = (t.name || "").toLowerCase();
      const empId = (t.employeeId || "").toLowerCase();
      const spec = Array.isArray(t.specialization)
        ? t.specialization.join(" ").toLowerCase()
        : "";
      return name.includes(q) || empId.includes(q) || spec.includes(q);
    });
  }, [teachersList, teacherSearchQuery]);

  const classesList = classesResult?.items || [];
  const classTotal = classesResult?.total || 0;
  const classTotalPages = classesResult?.totalPages || 1;

  const subjectsList = subjectsResult?.items || [];
  const subjectTotal = subjectsResult?.total || 0;
  const subjectTotalPages = subjectsResult?.totalPages || 1;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Academic Curriculum & Classes{" "}
              <DoodleSpark className="h-6 w-6 text-[#FFC83D]" />
            </h1>
            <Badge variant="blue" className="hidden sm:inline-flex text-xs">
              {academicYearFilter}
            </Badge>
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
            Configure grade levels, classroom sections, student capacity limits, and course syllabi
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === "classes" ? (
            <Button
              variant="yellow"
              onClick={openCreateClassModal}
              className="font-handwriting text-base gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" /> Add Class
            </Button>
          ) : (
            <Button
              variant="purple"
              onClick={openCreateSubjectModal}
              className="font-handwriting text-base gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" /> Add Subject
            </Button>
          )}
        </div>
      </div>

      {/* Academic Year Quick Bar & Overview */}
      <div className="rounded-3xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 p-5 sketch-shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Academic Sessions & Calendar
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active school session governs curriculum syllabi and student enrollment rolls
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setAcademicYearFilter(s.year);
                setClassPage(1);
                setSubjectPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                academicYearFilter === s.year
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400"
              }`}
            >
              <span>{s.year}</span>
              {s.isCurrent && (
                <span className="text-[10px] px-1 rounded bg-black/20 font-bold uppercase">
                  Current
                </span>
              )}
            </button>
          ))}
          <button
            onClick={() => {
              setAcademicYearFilter("");
              setClassPage(1);
              setSubjectPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              academicYearFilter === ""
                ? "bg-slate-800 text-white dark:bg-white dark:text-slate-900"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
            }`}
          >
            All Years
          </button>
        </div>
      </div>

      {/* Tabs Navigation & Filters Toolbar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Main Tab Switcher */}
          <div className="inline-flex rounded-2xl bg-slate-100 dark:bg-slate-900/90 p-1 border border-slate-200/80 dark:border-slate-800">
            <button
              onClick={() => {
                setActiveTab("classes");
                setSearchQuery("");
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-handwriting text-base font-bold transition-all ${
                activeTab === "classes"
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Layers className="h-4 w-4" /> Classes & Sections ({classTotal})
            </button>
            <button
              onClick={() => {
                setActiveTab("subjects");
                setSearchQuery("");
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-handwriting text-base font-bold transition-all ${
                activeTab === "subjects"
                  ? "bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <BookOpen className="h-4 w-4" /> Curriculum Subjects ({subjectTotal})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeTab === "classes") setClassPage(1);
                else setSubjectPage(1);
              }}
              placeholder={
                activeTab === "classes"
                  ? "Search class name or room..."
                  : "Search subject name or code..."
              }
              className="pl-10 pr-9 bg-white dark:bg-slate-900 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Specific Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {activeTab === "classes" ? (
            <>
              {/* Grade Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Grade:
                </span>
                <select
                  value={classGradeFilter}
                  onChange={(e) => {
                    setClassGradeFilter(e.target.value);
                    setClassPage(1);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">All Grades</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                    <option key={g} value={g}>
                      Grade {g}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Status:
                </span>
                <select
                  value={classStatusFilter}
                  onChange={(e) => {
                    setClassStatusFilter(e.target.value);
                    setClassPage(1);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ARCHIVED">Archived</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              {(searchQuery || classGradeFilter || classStatusFilter) && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setClassGradeFilter("");
                    setClassStatusFilter("");
                    setClassPage(1);
                  }}
                  className="text-xs font-bold text-rose-500 hover:underline flex items-center gap-1"
                >
                  <X className="h-3 w-3" /> Reset Filters
                </button>
              )}
            </>
          ) : (
            <>
              {/* Subject Class Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Class:
                </span>
                <select
                  value={subjectClassFilter}
                  onChange={(e) => {
                    setSubjectClassFilter(e.target.value);
                    setSubjectPage(1);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
                >
                  <option value="">All Classes</option>
                  {allClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Grade {c.grade}-{c.section})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Status:
                </span>
                <select
                  value={subjectStatusFilter}
                  onChange={(e) => {
                    setSubjectStatusFilter(e.target.value);
                    setSubjectPage(1);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ARCHIVED">Archived</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              {(searchQuery || subjectClassFilter || subjectStatusFilter) && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSubjectClassFilter("");
                    setSubjectStatusFilter("");
                    setSubjectPage(1);
                  }}
                  className="text-xs font-bold text-rose-500 hover:underline flex items-center gap-1"
                >
                  <X className="h-3 w-3" /> Reset Filters
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: CLASSES & SECTIONS                                             */}
      {/* ===================================================================== */}
      {activeTab === "classes" && (
        <div className="space-y-6">
          {isLoadingClasses ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4"
                >
                  <Skeleton className="h-6 w-3/4 rounded-lg" />
                  <Skeleton className="h-4 w-1/2 rounded-lg" />
                  <Skeleton className="h-8 w-full rounded-xl" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              ))}
            </div>
          ) : classesList.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-3">
              <Layers className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-700" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                No Classes Found
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                No classes match your search and filter parameters. Try clearing filters or create a new class.
              </p>
              <Button variant="yellow" onClick={openCreateClassModal} className="mt-2">
                <Plus className="h-4 w-4 mr-1.5" /> Create First Class
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {classesList.map((cls) => {
                // Capacity Progress Bar calculations
                const enrolled = cls.studentCount || 0;
                const cap = cls.capacity || 40;
                const pct = Math.min(100, Math.round((enrolled / cap) * 100));

                let barColor = "bg-emerald-500";
                let barBg = "bg-emerald-100 dark:bg-emerald-950/40";
                if (pct >= 95) {
                  barColor = "bg-rose-500";
                  barBg = "bg-rose-100 dark:bg-rose-950/40";
                } else if (pct >= 80) {
                  barColor = "bg-amber-500";
                  barBg = "bg-amber-100 dark:bg-amber-950/40";
                }

                return (
                  <div
                    key={cls.id}
                    className="group relative rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 sketch-shadow-sm hover:sketch-shadow hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
                  >
                    {/* Top Row: Grade-Section Badge & Status */}
                    <div>
                      <div className="flex items-center justify-between pb-3">
                        <span className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold text-xs uppercase tracking-wide border border-blue-200/60 dark:border-blue-900/60">
                          Grade {cls.grade} • Sec {cls.section}
                        </span>

                        <Badge
                          variant={
                            cls.status === "ACTIVE"
                              ? "green"
                              : cls.status === "ARCHIVED"
                              ? "yellow"
                              : "outline"
                          }
                          className="text-[10px] uppercase font-bold"
                        >
                          {cls.status}
                        </Badge>
                      </div>

                      {/* Class Name */}
                      <h3 className="text-xl font-bold font-handwriting text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {cls.name}
                      </h3>

                      {/* Meta Tags: Academic Year & Room */}
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1 font-semibold">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" /> {cls.academicYear}
                        </span>
                        {cls.roomNumber && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                            <DoorOpen className="h-3 w-3 text-slate-400" /> {cls.roomNumber}
                          </span>
                        )}
                      </div>

                      {/* Capacity Bar */}
                      <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-slate-400" /> Capacity
                          </span>
                          <span className="font-extrabold text-slate-900 dark:text-white">
                            {enrolled} / {cap}{" "}
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({pct}%)
                            </span>
                          </span>
                        </div>
                        <div className={`h-2.5 w-full rounded-full ${barBg} overflow-hidden`}>
                          <div
                            className={`h-full ${barColor} rounded-full transition-all duration-300`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Class Teacher */}
                      <div className="mt-3 flex items-center gap-2.5 pt-1 text-xs">
                        <div className="h-7 w-7 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                          <UserCheck className="h-3.5 w-3.5" />
                        </div>
                        <div className="truncate">
                          <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">
                            Class In-charge
                          </p>
                          <p className="font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                            {cls.classTeacherName || "No Teacher Assigned"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1">
                      {/* Status Toggle Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleClassStatus(cls)}
                        className="h-8 text-[11px] px-2.5 rounded-xl font-semibold hover:border-blue-400"
                        title="Toggle Active / Archived"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        {cls.status === "ACTIVE" ? "Archive" : "Activate"}
                      </Button>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditClassModal(cls)}
                          className="h-8 w-8 p-0 rounded-xl text-slate-600 dark:text-slate-300 hover:text-blue-600"
                          title="Edit Class"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setClassToDelete(cls)}
                          className="h-8 w-8 p-0 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                          title="Delete Class"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Classes Pagination Controls */}
          {classTotalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200/80 dark:border-slate-800">
              <p className="text-xs font-semibold text-slate-500">
                Showing {(classPage - 1) * classLimit + 1} to{" "}
                {Math.min(classPage * classLimit, classTotal)} of {classTotal} classes
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setClassPage((p) => Math.max(1, p - 1))}
                  disabled={classPage === 1 || isFetchingClasses}
                  className="rounded-xl h-8 px-3 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: classTotalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setClassPage(pageNum)}
                        className={`h-8 w-8 rounded-xl text-xs font-bold transition-all ${
                          classPage === pageNum
                            ? "bg-blue-600 text-white shadow-xs"
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
                  size="sm"
                  onClick={() => setClassPage((p) => Math.min(classTotalPages, p + 1))}
                  disabled={classPage === classTotalPages || isFetchingClasses}
                  className="rounded-xl h-8 px-3 text-xs"
                >
                  Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: CURRICULUM SUBJECTS                                            */}
      {/* ===================================================================== */}
      {activeTab === "subjects" && (
        <div className="space-y-6">
          {isLoadingSubjects ? (
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <Skeleton className="h-8 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ) : subjectsList.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-3">
              <BookOpen className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-700" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                No Subjects Registered
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                No syllabus subjects match your selected filters. Register a course subject or clear your filters.
              </p>
              <Button variant="purple" onClick={openCreateSubjectModal} className="mt-2">
                <Plus className="h-4 w-4 mr-1.5" /> Register New Subject
              </Button>
            </div>
          ) : (
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/90 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="py-3.5 px-6">Subject & Code</th>
                      <th className="py-3.5 px-6">Associated Class</th>
                      <th className="py-3.5 px-6">Academic Year</th>
                      <th className="py-3.5 px-6">Assigned Faculty</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {subjectsList.map((subj) => {
                      const teachers = subj.teachers || [];
                      return (
                        <tr
                          key={subj.id}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* Subject Name & Code */}
                          <td className="py-4 px-6">
                            <div className="flex items-start gap-3">
                              <div className="h-9 w-9 rounded-2xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0 mt-0.5">
                                <BookOpen className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                  {subj.name}
                                </p>
                                <span className="inline-flex items-center gap-1 font-mono font-bold text-xs text-purple-600 dark:text-purple-400 mt-0.5">
                                  <Hash className="h-3 w-3" /> {subj.code}
                                </span>
                                {subj.description && (
                                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 line-clamp-1 max-w-xs">
                                    {subj.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Associated Class */}
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-200/50 dark:border-blue-900/50">
                              <Layers className="h-3.5 w-3.5" />
                              {subj.className || "Class Section"}
                            </span>
                          </td>

                          {/* Academic Year */}
                          <td className="py-4 px-6 font-semibold text-xs text-slate-600 dark:text-slate-400">
                            {subj.academicYear}
                          </td>

                          {/* Assigned Faculty */}
                          <td className="py-4 px-6">
                            <div className="flex flex-col gap-1.5 max-w-xs">
                              {teachers.length > 0 ? (
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {teachers.slice(0, 2).map((t, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700"
                                    >
                                      <UserCheck className="h-3 w-3 text-purple-500" />
                                      {t.name}
                                    </span>
                                  ))}
                                  {teachers.length > 2 && (
                                    <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-[11px]">
                                      +{teachers.length - 2} more
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs font-semibold text-slate-400 italic">
                                  No faculty assigned
                                </span>
                              )}
                              <button
                                onClick={() => openAssignTeachersModal(subj)}
                                className="text-left text-[11px] font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 hover:underline inline-flex items-center gap-1"
                              >
                                <Users className="h-3 w-3" /> Manage Teachers
                              </button>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-6">
                            <Badge
                              variant={
                                subj.status === "ACTIVE"
                                  ? "green"
                                  : subj.status === "ARCHIVED"
                                  ? "yellow"
                                  : "outline"
                              }
                              className="text-[10px] uppercase font-bold"
                            >
                              {subj.status}
                            </Badge>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-6 text-right">
                            <div className="inline-flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openAssignTeachersModal(subj)}
                                className="h-8 px-2.5 rounded-xl text-xs font-bold text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/50"
                                title="Assign Teachers"
                              >
                                Assign
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditSubjectModal(subj)}
                                className="h-8 w-8 p-0 rounded-xl text-slate-600 dark:text-slate-300 hover:text-purple-600"
                                title="Edit Subject"
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSubjectToDelete(subj)}
                                className="h-8 w-8 p-0 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                                title="Delete Subject"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Subjects Pagination Controls */}
              {subjectTotalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-200/80 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-500">
                    Showing {(subjectPage - 1) * subjectLimit + 1} to{" "}
                    {Math.min(subjectPage * subjectLimit, subjectTotal)} of {subjectTotal} subjects
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSubjectPage((p) => Math.max(1, p - 1))}
                      disabled={subjectPage === 1 || isFetchingSubjects}
                      className="rounded-xl h-8 px-3 text-xs"
                    >
                      <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: subjectTotalPages }).map((_, idx) => {
                        const pageNum = idx + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setSubjectPage(pageNum)}
                            className={`h-8 w-8 rounded-xl text-xs font-bold transition-all ${
                              subjectPage === pageNum
                                ? "bg-purple-600 text-white shadow-xs"
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
                      size="sm"
                      onClick={() => setSubjectPage((p) => Math.min(subjectTotalPages, p + 1))}
                      disabled={subjectPage === subjectTotalPages || isFetchingSubjects}
                      className="rounded-xl h-8 px-3 text-xs"
                    >
                      Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: CREATE / EDIT CLASS                                            */}
      {/* ===================================================================== */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 p-7 sketch-shadow border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center font-bold">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-handwriting text-slate-900 dark:text-slate-100">
                    {editingClass ? `Edit Class: ${editingClass.name}` : "Create Academic Class"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure classroom section parameters and capacity
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsClassModalOpen(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitClass(onSubmitClass as any)} className="space-y-4 pt-4">
              <Input
                label="Class Name *"
                placeholder="e.g. Class 10-A"
                {...registerClass("name")}
                error={classErrors.name?.message}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Grade Level (1-12) *"
                  type="number"
                  placeholder="e.g. 10"
                  {...registerClass("grade")}
                  error={classErrors.grade?.message}
                />
                <Input
                  label="Section Identifier *"
                  placeholder="e.g. A"
                  {...registerClass("section")}
                  error={classErrors.section?.message}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Academic Year (YYYY-YYYY) *"
                  placeholder="2026-2027"
                  {...registerClass("academicYear")}
                  error={classErrors.academicYear?.message}
                />
                <Input
                  label="Maximum Capacity *"
                  type="number"
                  placeholder="40"
                  {...registerClass("capacity")}
                  error={classErrors.capacity?.message}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Room Number / Hall"
                  placeholder="e.g. Room 302"
                  {...registerClass("roomNumber")}
                  error={classErrors.roomNumber?.message}
                />

                {/* Status Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Status
                  </label>
                  <select
                    {...registerClass("status")}
                    className="w-full h-10 px-3 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              {/* Class Teacher Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Assign Class Teacher (Optional)
                </label>
                <select
                  {...registerClass("classTeacherId")}
                  className="w-full h-10 px-3 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="">-- No Class Teacher Assigned --</option>
                  {teachersList.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.employeeId ? `Emp: ${t.employeeId}` : "Faculty"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsClassModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="yellow"
                  isLoading={isCreatingClass || isUpdatingClass}
                >
                  {editingClass ? "Save Class Changes" : "Create Class"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: CREATE / EDIT SUBJECT                                          */}
      {/* ===================================================================== */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 p-7 sketch-shadow border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-bold">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-handwriting text-slate-900 dark:text-slate-100">
                    {editingSubject
                      ? `Edit Subject: ${editingSubject.name}`
                      : "Register Academic Subject"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Curriculum course code and syllabus details
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSubjectModalOpen(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSubject(onSubmitSubject as any)} className="space-y-4 pt-4">
              <Input
                label="Subject Name *"
                placeholder="e.g. Advanced Mathematics"
                {...registerSubject("name")}
                error={subjectErrors.name?.message}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Subject Code *"
                  placeholder="e.g. MATH101"
                  {...registerSubject("code")}
                  error={subjectErrors.code?.message}
                />
                <Input
                  label="Academic Year (YYYY-YYYY) *"
                  placeholder="2026-2027"
                  {...registerSubject("academicYear")}
                  error={subjectErrors.academicYear?.message}
                />
              </div>

              {/* Class Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Associated Class *
                </label>
                <select
                  {...registerSubject("classId")}
                  disabled={!!editingSubject}
                  className="w-full h-10 px-3 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
                >
                  <option value="">-- Choose Class --</option>
                  {allClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Grade {c.grade}-{c.section}) - {c.academicYear}
                    </option>
                  ))}
                </select>
                {subjectErrors.classId && (
                  <p className="text-xs text-rose-500 font-semibold">
                    {subjectErrors.classId.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Curriculum Description / Overview (Optional)
                </label>
                <textarea
                  {...registerSubject("description")}
                  rows={3}
                  placeholder="Overview of syllabus, chapters, and topics covered..."
                  className="w-full p-3 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Status
                </label>
                <select
                  {...registerSubject("status")}
                  className="w-full h-10 px-3 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSubjectModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="purple"
                  isLoading={isCreatingSubject || isUpdatingSubject}
                >
                  {editingSubject ? "Save Subject" : "Register Subject"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: TEACHER MULTI-SELECT ASSIGNMENT (PATCH /subjects/:id/teachers) */}
      {/* ===================================================================== */}
      {isAssignModalOpen && assignSubject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 p-7 sketch-shadow border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-bold">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-handwriting text-slate-900 dark:text-slate-100">
                    Assign Faculty Teachers
                  </h3>
                  <p className="text-xs text-slate-500">
                    {assignSubject.name} ({assignSubject.code}) • {assignSubject.className}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 pt-4">
              {/* Teacher Search Filter */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={teacherSearchQuery}
                  onChange={(e) => setTeacherSearchQuery(e.target.value)}
                  placeholder="Filter teachers by name or ID..."
                  className="pl-10 text-sm"
                />
              </div>

              {/* Selection Counter */}
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
                <span>
                  {selectedTeacherIds.length} faculty member(s) selected
                </span>
                {selectedTeacherIds.length > 0 && (
                  <button
                    onClick={() => setSelectedTeacherIds([])}
                    className="text-rose-500 hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Teachers Checkbox List */}
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1 border border-slate-100 dark:border-slate-800 rounded-2xl p-2 bg-slate-50/50 dark:bg-slate-800/30">
                {filteredTeachersForModal.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-400">
                    No faculty members found.
                  </p>
                ) : (
                  filteredTeachersForModal.map((t: any) => {
                    const isChecked = selectedTeacherIds.includes(t.id);
                    return (
                      <label
                        key={t.id}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                          isChecked
                            ? "bg-purple-50/80 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800"
                            : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-purple-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTeacherIds((prev) => [...prev, t.id]);
                              } else {
                                setSelectedTeacherIds((prev) =>
                                  prev.filter((id) => id !== t.id)
                                );
                              }
                            }}
                            className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-700"
                          />
                          <div>
                            <p className="font-bold text-xs text-slate-900 dark:text-slate-100">
                              {t.name}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {t.employeeId ? `Emp ID: ${t.employeeId}` : "Faculty"} •{" "}
                              {Array.isArray(t.specialization) && t.specialization.length > 0
                                ? t.specialization.join(", ")
                                : "General"}
                            </p>
                          </div>
                        </div>

                        {isChecked && (
                          <Badge variant="purple" className="text-[10px]">
                            Selected
                          </Badge>
                        )}
                      </label>
                    );
                  })
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAssignModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="purple"
                  onClick={handleSaveTeacherAssignments}
                  isLoading={isAssigningTeachers}
                >
                  Save Teacher Allocations
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* CONFIRMATION DIALOG: DELETE CLASS (409 Error Handling)                */}
      {/* ===================================================================== */}
      <ConfirmationDialog
        isOpen={!!classToDelete}
        onClose={() => {
          setClassToDelete(null);
          setConflictErrorMessage(null);
        }}
        onConfirm={handleConfirmDeleteClass}
        title={`Delete Class: ${classToDelete?.name || ""}?`}
        description={
          conflictErrorMessage
            ? conflictErrorMessage
            : `Are you sure you want to permanently delete '${classToDelete?.name}' (Grade ${classToDelete?.grade}-${classToDelete?.section})? This action cannot be undone.`
        }
        confirmText={conflictErrorMessage ? "Close" : "Delete Class"}
        variant="destructive"
        isLoading={isDeletingClass}
      />

      {/* ===================================================================== */}
      {/* CONFIRMATION DIALOG: DELETE SUBJECT                                  */}
      {/* ===================================================================== */}
      <ConfirmationDialog
        isOpen={!!subjectToDelete}
        onClose={() => setSubjectToDelete(null)}
        onConfirm={handleConfirmDeleteSubject}
        title={`Delete Subject: ${subjectToDelete?.name || ""}?`}
        description={`Are you sure you want to delete course ${subjectToDelete?.name} (${subjectToDelete?.code})?`}
        confirmText="Delete Subject"
        variant="destructive"
        isLoading={isDeletingSubject}
      />
    </div>
  );
}
