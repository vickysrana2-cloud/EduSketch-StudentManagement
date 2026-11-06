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

  const [activeTab, setActiveTab] = useState<"overview" | "enrollment" | "documents" | "academic">("overview");
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [isDeletingStudent, setIsDeletingStudent] = useState(false);
  const [editingMarkId, setEditingMarkId] = useState<number | string | null>(null);

  const { data, isLoading, isError, refetch } = useGetStudentByIdQuery(id);
  const student = data?.student || data?.data;

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
        title: "Student Removed",
        description: "Student record has been successfully deleted.",
      });
      router.push("/students");
    } catch (err: any) {
      toast({
        type: "error",
        title: "Deletion Failed",
        description: err?.data?.message || "Failed to delete student record.",
      });
    } finally {
      setIsDeletingStudent(false);
    }
  };

  const onAddMark = async (formData: MarkFormData) => {
    try {
      await addMark({
        studentId: id,
        subject: formData.subject,
        marks: formData.marks,
      }).unwrap();
      toast({
        type: "success",
        title: "Marks Recorded",
        description: `Grade for ${formData.subject} saved successfully.`,
      });
      resetMark();
    } catch (err: any) {
      toast({
        type: "error",
        title: "Submission Error",
        description: err?.data?.message || "Failed to submit marks record.",
      });
    }
  };

  const onUpdateMarkSubmit = async (formData: MarkFormData) => {
    if (!editingMarkId) return;
    try {
      await updateMark({
        markId: editingMarkId,
        studentId: id,
        subject: formData.subject,
        marks: formData.marks,
      }).unwrap();
      toast({
        type: "success",
        title: "Mark Updated",
        description: "Marks have been adjusted successfully.",
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

  const onDeleteMarkSubmit = async (markId: number | string) => {
    try {
      await deleteMark({ markId, studentId: id }).unwrap();
      toast({
        type: "info",
        title: "Mark Deleted",
        description: "Mark entry removed.",
      });
    } catch (err: any) {
      toast({
        type: "error",
        title: "Action Failed",
        description: err?.data?.message || "Failed to delete mark.",
      });
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

  if (isError || !student) {
    return (
      <div className="py-12 max-w-xl mx-auto text-center space-y-4">
        <ErrorState
          onRetry={refetch}
          message="Student profile not found or could not be retrieved from the backend."
        />
        <Link href="/students">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Student Roster
          </Button>
        </Link>
      </div>
    );
  }

  const initial = student.name?.charAt(0)?.toUpperCase() || "S";
  const admissionNo = student.admissionNumber || student.admissionNo || "ADM-" + String(student.id).slice(-4).toUpperCase();
  const parent = student.parentDetails && student.parentDetails.length > 0 ? student.parentDetails[0] : null;
  const address = student.address || {};

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Link href="/students" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600 transition">
          <ArrowLeft className="h-4 w-4" /> Back to Student Directory
        </Link>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditingStudent(!isEditingStudent)}
            className="h-9 px-3 gap-1.5 text-xs font-semibold rounded-xl text-blue-600 border-blue-200 dark:border-blue-900/60 hover:bg-blue-50 dark:hover:bg-blue-950/40"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>{isEditingStudent ? "Cancel Edit" : "Edit Profile"}</span>
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

      {/* Main Grid: Left Profile Card + Right Tabs Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Student Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-6 text-center space-y-4">
            {/* Avatar */}
            <div className="h-24 w-24 mx-auto rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-3xl shadow-lg shadow-blue-500/20 ring-4 ring-white dark:ring-slate-900">
              {initial}
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {student.name}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {admissionNo}
              </p>
              <div className="pt-1 flex items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>{student.status || "Active"}</span>
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                  {student.class || "Grade 10"} - {student.section || "A"}
                </span>
              </div>
            </div>

            {/* Quick Contact & Bio */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-left space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-blue-500 shrink-0" />
                <span className="truncate">{student.email || "No email"}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Calendar className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Age: {student.age ? `${student.age} years old` : "N/A"}</span>
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

          {/* Quick Parent Preview Card */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-6 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-blue-500" />
              <span>Primary Guardian</span>
            </h3>
            {parent ? (
              <div className="space-y-1.5 text-xs">
                <p className="font-bold text-slate-800 dark:text-slate-100">{parent.name}</p>
                <p className="text-slate-500 text-[11px]">Relation: {parent.relationship || "Guardian"}</p>
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 pt-1">
                  <Phone className="h-3.5 w-3.5 text-emerald-500" />
                  <span>{parent.phone}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No parent or guardian details linked yet.</p>
            )}
          </div>
        </div>

        {/* Right: Tabs and Detailed Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit Student Profile Card (Collapsible) */}
          {isEditingStudent && (
            <div className="rounded-3xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 p-6 space-y-4 shadow-sm animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="h-4 w-4 text-blue-600" />
                  <span>Edit Student Information</span>
                </h3>
                <span className="text-xs text-blue-600 font-medium">Quick Updates</span>
              </div>

              <form onSubmit={handleSubmitStudent(onUpdateStudent)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    {...registerStudent("name")}
                    error={studentErrors.name?.message}
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    {...registerStudent("email")}
                    error={studentErrors.email?.message}
                  />
                  <Input
                    label="Age"
                    type="number"
                    {...registerStudent("age")}
                    error={studentErrors.age?.message}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingStudent(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="default"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                    disabled={isUpdatingStudent}
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{isUpdatingStudent ? "Saving..." : "Save Changes"}</span>
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Navigation Tabs Header */}
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
              Enrollment Details
            </button>
            <button
              onClick={() => setActiveTab("documents")}
              className={`px-4 py-2 rounded-xl transition ${
                activeTab === "documents"
                  ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Documents & KYC
            </button>
            <button
              onClick={() => setActiveTab("academic")}
              className={`px-4 py-2 rounded-xl transition ${
                activeTab === "academic"
                  ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Academic Marks ({student.marks?.length || 0})
            </button>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Address Information Card */}
              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-rose-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Residential Address
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                    <span className="text-slate-400 text-[10px] block">Street Address</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {address.street || "123 Academic Way"}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                    <span className="text-slate-400 text-[10px] block">City & State</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {address.city || "Springfield"}, {address.state || "IL"}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                    <span className="text-slate-400 text-[10px] block">Postal / Zip Code</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {address.postalCode || "62701"}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                    <span className="text-slate-400 text-[10px] block">Country</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {address.country || "United States"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Parent & Emergency Contacts List */}
              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-6 space-y-4">
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
                          <p className="text-[11px] text-slate-500">
                            Relationship: {pd.relationship || "Guardian"} • Occupation: {pd.occupation || "N/A"}
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

          {/* TAB 2: ENROLLMENT */}
          {activeTab === "enrollment" && (
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Current Academic Enrollment
                  </h3>
                  <p className="text-xs text-slate-500">
                    Active academic term and class allocation
                  </p>
                </div>
                <Badge variant="blue">Active Session 2026-2027</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Enrolled Class</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {student.class || "Grade 10"}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Assigned Section</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    Section {student.section || "A"}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Admission Number</span>
                  <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                    {admissionNo}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Admission Date</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : "August 15, 2026"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DOCUMENTS PLACEHOLDER */}
          {activeTab === "documents" && (
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Student Verification Documents
                </h3>
                <p className="text-xs text-slate-500">
                  Identity records, certificates, and institutional credentials
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: "Government ID / Birth Certificate", status: "Verified", date: "Aug 16, 2026" },
                  { name: "Prior Academic Transfer Certificate (TC)", status: "Verified", date: "Aug 18, 2026" },
                  { name: "Immunization & Medical Clearance", status: "Verified", date: "Aug 20, 2026" },
                  { name: "Parental Agreement & Code of Conduct", status: "Pending Review", date: "Pending" },
                ].map((doc, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600">
                        <FileCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{doc.name}</p>
                        <p className="text-[11px] text-slate-400">Recorded: {doc.date}</p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        doc.status === "Verified"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                <UploadCloud className="h-8 w-8 text-slate-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Upload Additional Documents
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Drag and drop PDF or scanned image copies of official documents
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: ACADEMIC MARKS & PERFORMANCE */}
          {activeTab === "academic" && (
            <div className="space-y-6">
              {/* Record New Mark Card */}
              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-500" />
                  <span>Record Examination Mark</span>
                </h3>

                <form onSubmit={handleSubmitMark(onAddMark)} className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1 w-full">
                    <Input
                      label="Subject Name"
                      placeholder="e.g. Mathematics, Physics"
                      {...registerMark("subject")}
                      error={markErrors.subject?.message}
                    />
                  </div>
                  <div className="w-full sm:w-32">
                    <Input
                      label="Score (0-100)"
                      type="number"
                      {...registerMark("marks")}
                      error={markErrors.marks?.message}
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="default"
                    className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-1.5 text-xs font-semibold shrink-0"
                    disabled={isAddingMark}
                  >
                    <Plus className="h-4 w-4" />
                    <span>{isAddingMark ? "Adding..." : "Add Mark"}</span>
                  </Button>
                </form>
              </div>

              {/* Marks List */}
              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Examination Transcript
                </h3>

                {student.marks && student.marks.length > 0 ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {student.marks.map((mark: Mark) => {
                      const isEditingThisMark = editingMarkId === mark.id;

                      if (isEditingThisMark) {
                        return (
                          <form
                            key={mark.id}
                            onSubmit={handleSubmitEditMark(onUpdateMarkSubmit)}
                            className="py-3 flex items-center gap-3"
                          >
                            <input
                              type="text"
                              defaultValue={mark.subject}
                              {...registerEditMark("subject")}
                              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                            />
                            <input
                              type="number"
                              defaultValue={mark.marks}
                              {...registerEditMark("marks")}
                              className="w-20 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                            />
                            <Button type="submit" size="sm" className="h-8 text-xs bg-emerald-600 text-white">
                              Save
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingMarkId(null)}
                              className="h-8 text-xs"
                            >
                              Cancel
                            </Button>
                          </form>
                        );
                      }

                      return (
                        <div
                          key={mark.id}
                          className="py-3 flex items-center justify-between gap-4 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600">
                              <BookOpen className="h-4 w-4" />
                            </span>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">
                                {mark.subject}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {mark.createdAt ? new Date(mark.createdAt).toLocaleDateString() : "Term 1"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 rounded-full font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                              {mark.marks} / 100
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingMarkId(mark.id);
                                setEditMarkValue("subject", mark.subject);
                                setEditMarkValue("marks", mark.marks);
                              }}
                              className="h-7 px-2 text-[11px]"
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onDeleteMarkSubmit(mark.id)}
                              className="h-7 px-2 text-[11px] text-rose-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-6">
                    No examination marks entered yet for this student.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeletingStudent}
        onClose={() => setIsDeletingStudent(false)}
        onConfirm={onDeleteStudent}
        title="Delete Student Profile"
        description="Are you sure you want to delete this student record? This will archive their enrollment and examination marks."
        confirmText="Yes, Delete"
        isLoading={isDeletingStudentMutation}
      />
    </div>
  );
}
