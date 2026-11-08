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
  User,
  GraduationCap,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Users,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  UploadCloud,
  FileCheck,
  FileSpreadsheet,
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  Layers,
  X,
} from "lucide-react";

import {
  useGetStudentByIdQuery,
  useUpdateStudentProfileMutation,
  useGetStudentEnrollmentsQuery,
  useDeleteStudentMutation,
} from "@/store/api/studentApi";
import {
  usePromoteStudentMutation,
} from "@/store/api/enrollmentApi";
import { useGetClassesQuery } from "@/store/api/academicApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useToast } from "@/components/ui/toast";

const studentProfileEditSchema = z.object({
  admissionNumber: z.string().min(2, "Admission number required"),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  bloodGroup: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  street: z.string().min(2, "Street address required"),
  city: z.string().min(2, "City required"),
  state: z.string().min(2, "State required"),
  postalCode: z.string().min(2, "Postal code required"),
  parentName: z.string().min(2, "Guardian name required"),
  parentRelationship: z.string().min(2, "Relationship required"),
  parentPhone: z.string().min(5, "Contact phone required"),
  parentEmail: z.string().email("Invalid email").optional().or(z.literal("")),
});

const promoteModalSchema = z.object({
  targetClassId: z.string().min(1, "Please select target next class"),
  newAcademicYear: z
    .string()
    .regex(/^\d{4}-\d{4}$/, "Academic year must be in format YYYY-YYYY (e.g. 2027-2028)"),
  newRollNumber: z.string().min(1, "New roll number required (e.g. 15)"),
  enrollmentDate: z.string().optional(),
});

type StudentProfileEditValues = z.infer<typeof studentProfileEditSchema>;
type PromoteModalValues = z.infer<typeof promoteModalSchema>;

export default function StudentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = (params?.id as string) || "";

  const [activeTab, setActiveTab] = useState<"overview" | "enrollment" | "documents">("overview");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isDeletingStudent, setIsDeletingStudent] = useState(false);

  // Promote Modal state for the timeline
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [promotingEnrollmentId, setPromotingEnrollmentId] = useState<string | null>(null);
  const [promoteConflictError, setPromoteConflictError] = useState<string | null>(null);

  // Queries
  const { data, isLoading, isError, refetch } = useGetStudentByIdQuery(id);
  const student = data?.student || data?.data;

  // Real enrollments query for this student profile
  const { data: rawEnrollments = [], isLoading: isLoadingEnrollments } =
    useGetStudentEnrollmentsQuery({ studentId: id }, { skip: !id });

  // Classes list for promotion
  const { data: classesData } = useGetClassesQuery({ limit: 100 });
  const classesList = classesData?.items || classesData?.data || [];

  // Mutations
  const [updateStudentProfile, { isLoading: isUpdatingProfile }] =
    useUpdateStudentProfileMutation();
  const [promoteStudent, { isLoading: isPromotingStudent }] =
    usePromoteStudentMutation();
  const [deleteStudent, { isLoading: isDeletingStudentMutation }] =
    useDeleteStudentMutation();

  const primaryParent =
    student?.parentDetails && student.parentDetails.length > 0
      ? student.parentDetails[0]
      : null;

  const currentAddress = student?.address || {};

  // Form Setup
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StudentProfileEditValues>({
    resolver: zodResolver(studentProfileEditSchema) as any,
    values: {
      admissionNumber: student?.admissionNumber || student?.admissionNo || "",
      dateOfBirth: student?.dateOfBirth ? student.dateOfBirth.slice(0, 10) : "",
      gender: (student?.gender as any) || "MALE",
      bloodGroup: student?.bloodGroup || "O+",
      status: (student?.status?.toUpperCase() as any) === "ACTIVE" ? "ACTIVE" : "INACTIVE",
      street: currentAddress.street || "",
      city: currentAddress.city || "",
      state: currentAddress.state || "",
      postalCode: currentAddress.postalCode || "",
      parentName: primaryParent?.name || "",
      parentRelationship: primaryParent?.relationship || "FATHER",
      parentPhone: primaryParent?.phone || "",
      parentEmail: primaryParent?.email || "",
    },
  });

  const {
    register: registerPromote,
    handleSubmit: handleSubmitPromote,
    reset: resetPromoteForm,
    formState: { errors: promoteErrors },
  } = useForm<PromoteModalValues>({
    resolver: zodResolver(promoteModalSchema) as any,
    defaultValues: {
      targetClassId: "",
      newAcademicYear: "2027-2028",
      newRollNumber: "",
      enrollmentDate: new Date().toISOString().slice(0, 10),
    },
  });

  const openTimelinePromoteModal = (enrollmentId: string) => {
    setPromoteConflictError(null);
    setPromotingEnrollmentId(enrollmentId);
    resetPromoteForm({
      targetClassId: "",
      newAcademicYear: "2027-2028",
      newRollNumber: "",
      enrollmentDate: new Date().toISOString().slice(0, 10),
    });
    setIsPromoteModalOpen(true);
  };

  const onSubmitTimelinePromote = async (values: PromoteModalValues) => {
    if (!promotingEnrollmentId) return;
    setPromoteConflictError(null);

    try {
      await promoteStudent({
        currentEnrollmentId: promotingEnrollmentId,
        targetClassId: values.targetClassId,
        newAcademicYear: values.newAcademicYear.trim(),
        newRollNumber: values.newRollNumber.trim(),
        enrollmentDate: values.enrollmentDate ? new Date(values.enrollmentDate).toISOString() : undefined,
      }).unwrap();

      toast({
        type: "success",
        title: "Student Promoted",
        description: `Successfully promoted to new grade for ${values.newAcademicYear}.`,
      });
      setIsPromoteModalOpen(false);
      setPromotingEnrollmentId(null);
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
        setPromoteConflictError(`409 Conflict: ${message}`);
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

  const onSaveProfile = async (formData: StudentProfileEditValues) => {
    try {
      await updateStudentProfile({
        id,
        admissionNumber: formData.admissionNumber.trim().toUpperCase(),
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : undefined,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup || null,
        status: formData.status,
        address: {
          street: formData.street.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          postalCode: formData.postalCode.trim(),
        },
        parentDetails: [
          {
            name: formData.parentName.trim(),
            relationship: formData.parentRelationship,
            phone: formData.parentPhone.trim(),
            email: formData.parentEmail?.trim() || null,
          },
        ],
      }).unwrap();

      toast({
        type: "success",
        title: "Profile Updated",
        description: "Student details have been successfully updated.",
      });
      setIsEditingProfile(false);
    } catch (err: any) {
      toast({
        type: "error",
        title: "Update Failed",
        description: err?.data?.message || err?.message || "Failed to update student profile.",
      });
    }
  };

  const onDeleteStudent = async () => {
    try {
      await deleteStudent(id).unwrap();
      toast({
        type: "success",
        title: "Student Removed",
        description: "Student record has been successfully deleted.",
      });
      router.push("/students");
    } catch (err: any) {
      toast({
        type: "error",
        title: "Delete Failed",
        description: err?.data?.message || "Could not delete student record.",
      });
    } finally {
      setIsDeletingStudent(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12 max-w-6xl mx-auto">
        <Skeleton className="h-6 w-36 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 rounded-3xl" />
          <Skeleton className="h-96 lg:col-span-2 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (isError || !student) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <ErrorState
          onRetry={refetch}
          message="Could not load student profile. The student record may have been moved or you might lack permissions."
        />
        <div className="text-center mt-4">
          <Link href="/students" className="text-xs font-semibold text-blue-600 hover:underline">
            ← Return to Student Directory
          </Link>
        </div>
      </div>
    );
  }

  const initial = student.name?.charAt(0)?.toUpperCase() || "S";
  const admissionNo =
    student.admissionNumber ||
    student.admissionNo ||
    "ADM-" + String(student.id).slice(-4).toUpperCase();
  const isActive = (student.status || "active").toLowerCase() === "active";

  // Sort enrollments chronologically for history timeline
  const sortedEnrollments = [...rawEnrollments].sort((a: any, b: any) => {
    const yearA = a.academicYear || "";
    const yearB = b.academicYear || "";
    return yearB.localeCompare(yearA);
  });

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto animate-in fade-in duration-200">
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Link
          href="/students"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Student Directory
        </Link>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            className="h-9 px-3 gap-1.5 text-xs font-semibold rounded-xl text-blue-600 border-blue-200 dark:border-blue-900/60 hover:bg-blue-50 dark:hover:bg-blue-950/40"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>{isEditingProfile ? "Cancel Editing" : "Edit Profile"}</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsDeletingStudent(true)}
            className="h-9 px-3 gap-1.5 text-xs font-semibold text-rose-600 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      {/* Main Grid: Left Profile Card + Right Tabs/Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Student Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 text-center space-y-4">
            {/* Avatar */}
            <UserAvatar
              src={
                student.profileImage ||
                (typeof student.userId === "object" ? student.userId?.profileImage : null)
              }
              name={student.name}
              size="2xl"
              shape="rounded-3xl"
              variant="blue"
              className="mx-auto shadow-lg shadow-blue-500/20 ring-4 ring-white dark:ring-slate-900"
            />

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {student.name}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {admissionNo}
              </p>
              <div className="pt-1 flex items-center justify-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    isActive
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  <CheckCircle2 className="h-3 w-3" />
                  <span>{isActive ? "Active Student" : "Inactive"}</span>
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                  {student.class || "Class"} - {student.section || "A"}
                </span>
              </div>
            </div>

            {/* Quick Contact & Bio */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-left space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-blue-500 shrink-0" />
                <span className="truncate">{student.email || "No email assigned"}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Calendar className="h-4 w-4 text-amber-500 shrink-0" />
                <span>
                  {student.dateOfBirth
                    ? `DOB: ${student.dateOfBirth.slice(0, 10)} (${student.age || "N/A"} yrs)`
                    : `Age: ${student.age ? `${student.age} years old` : "N/A"}`}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <User className="h-4 w-4 text-purple-500 shrink-0" />
                <span>Gender: {student.gender || "Not specified"}</span>
              </div>
              {student.bloodGroup && (
                <div className="flex items-center gap-2.5">
                  <span className="h-4 w-4 rounded-full bg-rose-100 text-rose-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                    🩸
                  </span>
                  <span>Blood Group: {student.bloodGroup}</span>
                </div>
              )}
            </div>
          </div>

          {/* Primary Guardian Preview Card */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-blue-500" />
              <span>Primary Guardian</span>
            </h3>
            {primaryParent ? (
              <div className="space-y-1.5 text-xs">
                <p className="font-bold text-slate-900 dark:text-white">
                  {primaryParent.name}
                </p>
                <p className="text-[11px] text-slate-500">
                  Relationship: <strong className="text-slate-700 dark:text-slate-300">{primaryParent.relationship || "Guardian"}</strong>
                </p>
                <div className="pt-2 space-y-1 text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-emerald-500" />
                    <span>{primaryParent.phone}</span>
                  </div>
                  {primaryParent.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-blue-500" />
                      <span className="truncate">{primaryParent.email}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No guardian records registered.</p>
            )}
          </div>
        </div>

        {/* Right: Tabs Content & Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* ================================================================= */}
          {/* EDIT FORM (PATCH /student-profiles/:id)                           */}
          {/* ================================================================= */}
          {isEditingProfile ? (
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900 shadow-sm p-6 space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-blue-600" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Edit Student Profile Details
                  </h3>
                </div>
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSaveProfile as any)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Admission Number *"
                    {...register("admissionNumber")}
                    error={errors.admissionNumber?.message}
                  />

                  <Input
                    label="Date of Birth"
                    type="date"
                    {...register("dateOfBirth")}
                    error={errors.dateOfBirth?.message}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Gender
                    </label>
                    <select
                      {...register("gender")}
                      className="w-full h-10 px-3 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="MALE">MALE</option>
                      <option value="FEMALE">FEMALE</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Blood Group
                    </label>
                    <select
                      {...register("bloodGroup")}
                      className="w-full h-10 px-3 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Status
                    </label>
                    <select
                      {...register("status")}
                      className="w-full h-10 px-3 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>

                {/* Residential Address Fields */}
                <div className="pt-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Residential Address
                  </p>
                  <div className="space-y-3">
                    <Input
                      label="Street Address *"
                      {...register("street")}
                      error={errors.street?.message}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input
                        label="City *"
                        {...register("city")}
                        error={errors.city?.message}
                      />
                      <Input
                        label="State *"
                        {...register("state")}
                        error={errors.state?.message}
                      />
                      <Input
                        label="Postal Code *"
                        {...register("postalCode")}
                        error={errors.postalCode?.message}
                      />
                    </div>
                  </div>
                </div>

                {/* Parent Details Fields */}
                <div className="pt-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Guardian Contacts
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Guardian Name *"
                      {...register("parentName")}
                      error={errors.parentName?.message}
                    />
                    <Input
                      label="Relationship *"
                      {...register("parentRelationship")}
                      error={errors.parentRelationship?.message}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <Input
                      label="Phone *"
                      {...register("parentPhone")}
                      error={errors.parentPhone?.message}
                    />
                    <Input
                      label="Guardian Email"
                      {...register("parentEmail")}
                      error={errors.parentEmail?.message}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingProfile(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="default"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                    isLoading={isUpdatingProfile}
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Profile Changes</span>
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <>
              {/* Tabs Navigation Bar */}
              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 text-xs font-semibold overflow-x-auto">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`px-4 py-2 rounded-xl transition ${
                    activeTab === "overview"
                      ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  Overview & Contacts
                </button>
                <button
                  onClick={() => setActiveTab("enrollment")}
                  className={`px-4 py-2 rounded-xl transition ${
                    activeTab === "enrollment"
                      ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  Enrollment Timeline ({sortedEnrollments.length})
                </button>
                <button
                  onClick={() => setActiveTab("documents")}
                  className={`px-4 py-2 rounded-xl transition ${
                    activeTab === "documents"
                      ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  Documents (Repository)
                </button>
              </div>

              {/* ============================================================= */}
              {/* TAB 1: OVERVIEW & CONTACTS                                    */}
              {/* ============================================================= */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Address Card */}
                  <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-amber-500" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Residential Address
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                      <div>
                        <span className="text-slate-400 block">Street Address</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {currentAddress.street || "Not provided"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">City</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {currentAddress.city || "Not provided"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">State / Province</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {currentAddress.state || "Not provided"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Postal Code</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {currentAddress.postalCode || "Not provided"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Parents / Emergency Contacts Card */}
                  <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-500" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Parents & Emergency Contacts
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {student.parentDetails && student.parentDetails.length > 0 ? (
                        student.parentDetails.map((pd, index) => (
                          <div
                            key={index}
                            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <p className="font-bold text-sm text-slate-900 dark:text-white">
                                {pd.name}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Relationship: <strong className="text-slate-700 dark:text-slate-300">{pd.relationship || "Guardian"}</strong>
                              </p>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
                              <span className="flex items-center gap-1 font-mono">
                                <Phone className="h-3.5 w-3.5 text-emerald-500" />
                                {pd.phone}
                              </span>
                              {pd.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3.5 w-3.5 text-blue-500" />
                                  {pd.email}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-400 text-center">
                          No additional family contacts found on this profile.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================= */}
              {/* TAB 2: ENROLLMENT HISTORY TIMELINE                            */}
              {/* ============================================================= */}
              {activeTab === "enrollment" && (
                <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-blue-600" />
                        Academic Enrollment History & Timeline
                      </h3>
                      <p className="text-xs text-slate-500">
                        Historical progression across grade levels, sections, and academic sessions
                      </p>
                    </div>
                    <Badge variant="blue">
                      {sortedEnrollments.length} Session(s)
                    </Badge>
                  </div>

                  {isLoadingEnrollments ? (
                    <div className="space-y-4">
                      <Skeleton className="h-20 w-full rounded-2xl" />
                      <Skeleton className="h-20 w-full rounded-2xl" />
                    </div>
                  ) : sortedEnrollments.length > 0 ? (
                    /* Vertical Timeline */
                    <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                      {sortedEnrollments.map((en: any, idx: number) => {
                        const classObj =
                          typeof en.classId === "object" && en.classId ? en.classId : null;
                        const className = classObj
                          ? classObj.name || `Grade ${classObj.grade}-${classObj.section}`
                          : "Class Record";
                        const isEnActive = (en.status || "ACTIVE") === "ACTIVE";
                        const isEnPromoted = en.status === "PROMOTED";

                        let nodeColor = "bg-slate-400";
                        let badgeColor: "green" | "blue" | "yellow" | "outline" = "outline";

                        if (isEnActive) {
                          nodeColor = "bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-950/60";
                          badgeColor = "green";
                        } else if (isEnPromoted) {
                          nodeColor = "bg-blue-500";
                          badgeColor = "blue";
                        } else if (en.status === "TRANSFERRED") {
                          nodeColor = "bg-amber-500";
                          badgeColor = "yellow";
                        }

                        return (
                          <div key={en._id || en.id || idx} className="relative group">
                            {/* Timeline Node Dot */}
                            <div
                              className={`absolute -left-6 sm:-left-8 top-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full ${nodeColor} transition-all`}
                            />

                            {/* Timeline Card */}
                            <div
                              className={`p-5 rounded-2xl border transition-all ${
                                isEnActive
                                  ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 shadow-xs"
                                  : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300"
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-slate-700/60">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-base text-slate-900 dark:text-white">
                                      {className}
                                    </h4>
                                    <Badge variant={badgeColor} className="text-[10px] uppercase font-bold">
                                      {en.status || "ACTIVE"}
                                    </Badge>
                                  </div>
                                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                    Academic Session: <span>{en.academicYear || "2026-2027"}</span>
                                  </p>
                                </div>

                                <div className="flex items-center gap-2">
                                  {/* Promote button on active card */}
                                  {isEnActive && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openTimelinePromoteModal(en._id || en.id)}
                                      className="h-8 px-2.5 text-xs font-semibold gap-1 text-blue-600 border-blue-200 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl"
                                    >
                                      <ArrowUpRight className="h-3.5 w-3.5" />
                                      <span>Promote Student</span>
                                    </Button>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
                                <div>
                                  <span className="text-slate-400 text-[10px] uppercase font-bold block">
                                    Class Roll No.
                                  </span>
                                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                                    #{en.rollNumber || "N/A"}
                                  </span>
                                </div>

                                <div>
                                  <span className="text-slate-400 text-[10px] uppercase font-bold block">
                                    Grade Level
                                  </span>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    Grade {classObj?.grade || "N/A"}
                                  </span>
                                </div>

                                <div>
                                  <span className="text-slate-400 text-[10px] uppercase font-bold block">
                                    Section
                                  </span>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    Section {classObj?.section || "A"}
                                  </span>
                                </div>

                                <div>
                                  <span className="text-slate-400 text-[10px] uppercase font-bold block">
                                    Enrolled Date
                                  </span>
                                  <span className="text-slate-600 dark:text-slate-300">
                                    {en.enrollmentDate
                                      ? new Date(en.enrollmentDate).toLocaleDateString()
                                      : en.createdAt
                                      ? new Date(en.createdAt).toLocaleDateString()
                                      : "Initial Registration"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Initial Profile Allocation fallback */
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-base text-slate-900 dark:text-white">
                            {student.class || "Grade 10"} - Section {student.section || "A"}
                          </h4>
                          <p className="text-xs text-slate-500">
                            Academic Session 2026-2027 • Admission #{admissionNo}
                          </p>
                        </div>
                        <Badge variant="green" className="text-[10px]">
                          ACTIVE
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 pt-2 border-t border-slate-200/60 dark:border-slate-700">
                        Allocated at initial admission. No secondary promotional enrollments on file yet.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================= */}
              {/* TAB 3: DOCUMENTS PLACEHOLDER                                  */}
              {/* ============================================================= */}
              {activeTab === "documents" && (
                <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="h-4 w-4 text-purple-600" />
                        Verification Documents & Records
                      </h3>
                      <p className="text-xs text-slate-500">
                        Official certificates, transcripts, and identification proof
                      </p>
                    </div>
                    <Badge variant="purple">4 Document Slots</Badge>
                  </div>

                  {/* Document Items Placeholder */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      {
                        name: "Birth Certificate",
                        type: "PDF Document",
                        status: "Verified",
                        color: "text-emerald-500",
                        icon: FileCheck,
                      },
                      {
                        name: "Transfer Certificate (TC)",
                        type: "School Record",
                        status: "Verified",
                        color: "text-emerald-500",
                        icon: FileCheck,
                      },
                      {
                        name: "National Identity / Passport",
                        type: "Government ID",
                        status: "Pending Upload",
                        color: "text-amber-500",
                        icon: FileSpreadsheet,
                      },
                      {
                        name: "Prior Academic Transcripts",
                        type: "Grade Sheet",
                        status: "Verified",
                        color: "text-emerald-500",
                        icon: FileCheck,
                      },
                    ].map((doc, idx) => {
                      const Icon = doc.icon;
                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center shrink-0">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">
                                {doc.name}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {doc.type}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              doc.status === "Verified"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                            }`}
                          >
                            {doc.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Upload Dropzone Placeholder */}
                  <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                    <UploadCloud className="h-8 w-8 mx-auto text-slate-400" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Upload Supplementary Documents
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      Drag & drop PDF, JPG, or PNG files (max 10MB) for cloud storage archiving.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 text-xs font-semibold rounded-xl"
                      onClick={() =>
                        toast({
                          type: "info",
                          title: "Document Storage",
                          description: "S3 object storage adapter is configured for production uploads.",
                        })
                      }
                    >
                      Browse Files
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TIMELINE PROMOTE MODAL                                                */}
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
                    Promote Student to Next Grade
                  </h3>
                  <p className="text-xs text-slate-500">
                    {student.name} ({admissionNo})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPromoteModalOpen(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 409 Conflict Banner */}
            {promoteConflictError && (
              <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                <div>
                  <p className="font-bold">Promotion Conflict</p>
                  <p className="mt-0.5">{promoteConflictError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitPromote(onSubmitTimelinePromote as any)} className="space-y-4 pt-4">
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

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPromoteModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  isLoading={isPromotingStudent}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                >
                  Confirm Promotion
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeletingStudent}
        onClose={() => setIsDeletingStudent(false)}
        onConfirm={onDeleteStudent}
        title={`Delete Student Record: ${student.name}?`}
        description="Are you sure you want to permanently delete this student's profile? This will revoke active enrollments and portal access."
        confirmText="Confirm Deletion"
        variant="destructive"
        isLoading={isDeletingStudentMutation}
      />
    </div>
  );
}
