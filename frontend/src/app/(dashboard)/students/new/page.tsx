"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  UserPlus,
  Shield,
  User,
  Users,
  GraduationCap,
  Mail,
  Lock,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  Eye,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

import { useAppSelector } from "@/store/hooks";
import { useCreateStudentUserMutation } from "@/store/api/studentApi";
import { useGetClassesQuery } from "@/store/api/academicApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { DoodleSpark } from "@/components/ui/doodles";

// Step 1: Account Schema
const accountSchema = z
  .object({
    name: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Please provide a valid institutional email"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    confirmPassword: z.string().min(8, "Please confirm password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Step 2: Personal Profile Schema
const personalSchema = z.object({
  admissionNumber: z
    .string()
    .min(3, "Admission number is required (min 3 chars)"),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be YYYY-MM-DD"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], {
    message: "Select a valid gender",
  }),
  bloodGroup: z.string().optional(),
  street: z.string().min(3, "Street address required"),
  city: z.string().min(2, "City required"),
  state: z.string().min(2, "State required"),
  postalCode: z.string().min(3, "Valid postal code required"),
});

// Step 3: Guardian Schema
const guardianSchema = z.object({
  parentName: z.string().min(2, "Guardian name required"),
  parentRelationship: z.enum(["FATHER", "MOTHER", "GUARDIAN", "OTHER"]),
  parentPhone: z.string().min(6, "Valid contact phone number required"),
  parentEmail: z.string().email("Invalid email").optional().or(z.literal("")),
});

// Step 4: Class & Review Schema
const academicSchema = z.object({
  classId: z.string().min(1, "Please select an assigned class"),
  rollNumber: z.string().optional(),
});

// Full Combined Schema
const fullStudentFormSchema = accountSchema
  .and(personalSchema)
  .and(guardianSchema)
  .and(academicSchema);

type StudentFullFormData = z.infer<typeof fullStudentFormSchema>;

const STEPS = [
  { id: 1, title: "Account", desc: "Credentials & Login", icon: Shield },
  { id: 2, title: "Personal", desc: "Bio & Address", icon: User },
  { id: 3, title: "Parent", desc: "Guardian Contacts", icon: Users },
  { id: 4, title: "Class & Review", desc: "Enrollment & Confirm", icon: GraduationCap },
];

export default function NewStudentAdmissionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentUser } = useAppSelector((state) => state.auth);

  const [currentStep, setCurrentStep] = useState(1);
  const [createdStudentRecord, setCreatedStudentRecord] = useState<{
    userId: string;
    studentId: string;
    name: string;
    admissionNumber: string;
    className?: string;
  } | null>(null);

  // Atomic creation mutation: POST /users/students
  const [createStudentUser, { isLoading: isCreatingStudent }] =
    useCreateStudentUserMutation();

  // Load real classes from /classes
  const { data: classesData, isLoading: isLoadingClasses } = useGetClassesQuery({
    limit: 100,
  });
  const classesList = classesData?.items || classesData?.data || [];

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm<StudentFullFormData>({
    resolver: zodResolver(fullStudentFormSchema) as any,
    mode: "onBlur",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      admissionNumber: `ADM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      dateOfBirth: "2010-06-15",
      gender: "MALE",
      bloodGroup: "O+",
      street: "124 Academic Way",
      city: "Springfield",
      state: "IL",
      postalCode: "62701",
      parentName: "",
      parentRelationship: "FATHER",
      parentPhone: "+1 (555) 000-0000",
      parentEmail: "",
      classId: "",
      rollNumber: "",
    },
  });

  const formData = watch();

  // Step-wise validation before advancing
  const handleNextStep = async () => {
    let isValid = false;

    if (currentStep === 1) {
      isValid = await trigger(["name", "email", "password", "confirmPassword"]);
    } else if (currentStep === 2) {
      isValid = await trigger([
        "admissionNumber",
        "dateOfBirth",
        "gender",
        "street",
        "city",
        "state",
        "postalCode",
      ]);
    } else if (currentStep === 3) {
      isValid = await trigger([
        "parentName",
        "parentRelationship",
        "parentPhone",
        "parentEmail",
      ]);
    }

    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Final Form Submission via POST /users/students
  const onSubmit = async (data: StudentFullFormData) => {
    try {
      const selectedClass = classesList.find(
        (c: any) => (c.id || c._id) === data.classId
      );

      const payload = {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        admissionNumber: data.admissionNumber.trim().toUpperCase(),
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        parentDetails: [
          {
            name: data.parentName.trim(),
            relationship: data.parentRelationship,
            phone: data.parentPhone.trim(),
            email: data.parentEmail?.trim() || undefined,
          },
        ],
        address: {
          street: data.street.trim(),
          city: data.city.trim(),
          state: data.state.trim(),
          postalCode: data.postalCode.trim(),
        },
        classId: data.classId,
        academicYear: selectedClass?.academicYear || "2026-2027",
        rollNumber: data.rollNumber?.trim() || undefined,
        institutionId: currentUser?.institutionId || undefined,
      };

      const result = await createStudentUser(payload).unwrap();

      const profile = result?.profile || result?.studentProfile || result;
      const user = result?.user || {};
      const studentId = profile?._id || profile?.id || result?._id || result?.id;
      const studentUserId = user?._id || user?.id || profile?.userId;

      toast({
        type: "success",
        title: "Student Admitted Successfully",
        description: `${data.name} is now officially registered in ${selectedClass?.name || "the class"}.`,
      });

      setCreatedStudentRecord({
        userId: String(studentUserId || ""),
        studentId: String(studentId || ""),
        name: data.name,
        admissionNumber: data.admissionNumber,
        className: selectedClass?.name || "Class",
      });
    } catch (err: any) {
      toast({
        type: "error",
        title: "Student Admission Failed",
        description:
          err?.data?.message || err?.message || "Failed to create student account.",
      });
    }
  };

  // SUCCESS CONFIRMATION SCREEN
  if (createdStudentRecord) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 animate-in fade-in zoom-in-95 duration-300">
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl p-8 text-center space-y-6">
          <div className="h-20 w-20 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-3xl shadow-inner">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold font-handwriting text-slate-900 dark:text-white">
              Student Admitted Successfully!
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Student account, profile record, and initial academic enrollment were atomically provisioned.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-left space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500 font-semibold">Student Name:</span>
              <strong className="text-slate-900 dark:text-white">
                {createdStudentRecord.name}
              </strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500 font-semibold">Admission Number:</span>
              <span className="font-mono font-bold text-blue-600">
                {createdStudentRecord.admissionNumber}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 font-semibold">Assigned Class:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {createdStudentRecord.className}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href={
                createdStudentRecord.studentId
                  ? `/students/${createdStudentRecord.studentId}`
                  : "/students"
              }
              className="w-full sm:w-auto"
            >
              <Button
                variant="default"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
              >
                View Student Profile
              </Button>
            </Link>

            <Link href="/students" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full rounded-xl">
                Return to Directory
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const selectedClassDetails = classesList.find(
    (c: any) => (c.id || c._id) === formData.classId
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/students"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Directory
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Admit New Student <DoodleSpark className="h-5 w-5 text-amber-500" />
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Atomic provision: Login Account + Student Profile + Initial Class Enrollment
          </p>
        </div>
        <Badge variant="blue" className="hidden sm:inline-flex">
          Step {currentStep} of 4
        </Badge>
      </div>

      {/* Wizard Progress Steps Header */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        {STEPS.map((s) => {
          const Icon = s.icon;
          const isComplete = currentStep > s.id;
          const isCurrent = currentStep === s.id;

          return (
            <div
              key={s.id}
              className={`p-3 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                isCurrent
                  ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 shadow-sm"
                  : isComplete
                  ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800"
                  : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`h-7 w-7 rounded-xl flex items-center justify-center text-xs font-bold ${
                    isComplete
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-600"
                  }`}
                >
                  {isComplete ? <Check className="h-3.5 w-3.5" /> : s.id}
                </span>
                <Icon
                  className={`h-4 w-4 ${
                    isCurrent
                      ? "text-blue-600"
                      : isComplete
                      ? "text-emerald-500"
                      : "text-slate-400"
                  }`}
                />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {s.title}
                </p>
                <p className="text-[10px] text-slate-500 truncate hidden sm:block">
                  {s.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Wizard Form Card */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
          {/* ================================================================= */}
          {/* STEP 1: ACCOUNT CREDENTIALS                                       */}
          {/* ================================================================= */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  Account & Login Credentials
                </h3>
                <p className="text-xs text-slate-500">
                  This creates the primary authentication record for student portal access.
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  label="Student Full Legal Name *"
                  placeholder="e.g. Amit Sharma"
                  {...register("name")}
                  error={errors.name?.message}
                />

                <Input
                  label="Student Login Email Address *"
                  type="email"
                  placeholder="e.g. amit@school.com"
                  {...register("email")}
                  error={errors.email?.message}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Initial Password *"
                    type="password"
                    placeholder="Min. 8 characters"
                    {...register("password")}
                    error={errors.password?.message}
                  />

                  <Input
                    label="Confirm Initial Password *"
                    type="password"
                    placeholder="Re-enter password"
                    {...register("confirmPassword")}
                    error={errors.confirmPassword?.message}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 2: PERSONAL & BIO PROFILE                                    */}
          {/* ================================================================= */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  Personal Information & Address
                </h3>
                <p className="text-xs text-slate-500">
                  Official student registration details, birth records, and residential address.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="School Admission Number *"
                    placeholder="e.g. ADM-2026-001"
                    {...register("admissionNumber")}
                    error={errors.admissionNumber?.message}
                  />

                  <Input
                    label="Date of Birth (YYYY-MM-DD) *"
                    type="date"
                    {...register("dateOfBirth")}
                    error={errors.dateOfBirth?.message}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Gender *
                    </label>
                    <select
                      {...register("gender")}
                      className="w-full h-10 px-3 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                    {errors.gender && (
                      <p className="text-xs text-rose-500 font-semibold">
                        {errors.gender.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Blood Group (Optional)
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
                </div>

                <div className="pt-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Residential Address
                  </p>
                  <div className="space-y-3">
                    <Input
                      label="Street Address *"
                      placeholder="e.g. 124 Academic Way"
                      {...register("street")}
                      error={errors.street?.message}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input
                        label="City *"
                        placeholder="e.g. Springfield"
                        {...register("city")}
                        error={errors.city?.message}
                      />
                      <Input
                        label="State / Province *"
                        placeholder="e.g. Illinois"
                        {...register("state")}
                        error={errors.state?.message}
                      />
                      <Input
                        label="Postal Code *"
                        placeholder="e.g. 62701"
                        {...register("postalCode")}
                        error={errors.postalCode?.message}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 3: PARENT / GUARDIAN CONTACTS                                */}
          {/* ================================================================= */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  Primary Parent / Guardian Contact
                </h3>
                <p className="text-xs text-slate-500">
                  Emergency point of contact and official parent communications.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Guardian Full Legal Name *"
                    placeholder="e.g. Rajesh Sharma"
                    {...register("parentName")}
                    error={errors.parentName?.message}
                  />

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Relationship *
                    </label>
                    <select
                      {...register("parentRelationship")}
                      className="w-full h-10 px-3 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="FATHER">Father</option>
                      <option value="MOTHER">Mother</option>
                      <option value="GUARDIAN">Legal Guardian</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Primary Contact Phone *"
                    placeholder="e.g. +91 98765 43210"
                    {...register("parentPhone")}
                    error={errors.parentPhone?.message}
                  />

                  <Input
                    label="Guardian Email (Optional)"
                    type="email"
                    placeholder="parent@example.com"
                    {...register("parentEmail")}
                    error={errors.parentEmail?.message}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 4: CLASS ENROLLMENT & REVIEW                                 */}
          {/* ================================================================= */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-blue-600" />
                  Initial Class Enrollment & Review
                </h3>
                <p className="text-xs text-slate-500">
                  Select an active class from `/classes` to finalize the initial enrollment.
                </p>
              </div>

              {/* Class Dropdown from /classes */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Select Academic Class & Section *
                    </label>
                    <select
                      {...register("classId")}
                      className="w-full h-10 px-3 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="">-- Choose Class from Curriculum --</option>
                      {classesList.map((c: any) => (
                        <option key={c.id || c._id} value={c.id || c._id}>
                          {c.name} (Grade {c.grade}-{c.section}) • Term {c.academicYear} • Cap: {c.studentCount || 0}/{c.capacity || 40}
                        </option>
                      ))}
                    </select>
                    {errors.classId && (
                      <p className="text-xs text-rose-500 font-semibold">
                        {errors.classId.message}
                      </p>
                    )}
                  </div>

                  <Input
                    label="Class Roll Number (Optional)"
                    placeholder="e.g. 12 (Auto-assigned if blank)"
                    {...register("rollNumber")}
                    error={errors.rollNumber?.message}
                  />
                </div>

                {selectedClassDetails && (
                  <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-blue-900 dark:text-blue-200">
                        Selected: {selectedClassDetails.name}
                      </p>
                      <p className="text-blue-700/80 dark:text-blue-300/80 mt-0.5">
                        Grade {selectedClassDetails.grade} • Section {selectedClassDetails.section} • Session {selectedClassDetails.academicYear}
                      </p>
                    </div>
                    <Badge variant="blue">
                      Enrolled: {selectedClassDetails.studentCount || 0} / {selectedClassDetails.capacity || 40}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Complete Review Summary */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Admission Summary Review
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-400 block">Student Identity</span>
                    <strong className="text-slate-900 dark:text-white block">
                      {formData.name || "N/A"}
                    </strong>
                    <span className="text-slate-500 font-mono">
                      {formData.email} • {formData.admissionNumber}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 block">Demographics</span>
                    <strong className="text-slate-900 dark:text-white block">
                      {formData.gender} • DOB: {formData.dateOfBirth}
                    </strong>
                    <span className="text-slate-500">
                      {formData.city}, {formData.state} {formData.postalCode}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 block">Primary Guardian</span>
                    <strong className="text-slate-900 dark:text-white block">
                      {formData.parentName} ({formData.parentRelationship})
                    </strong>
                    <span className="text-slate-500">
                      Phone: {formData.parentPhone}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 block">Target Enrollment</span>
                    <strong className="text-blue-600 dark:text-blue-400 block">
                      {selectedClassDetails?.name || "Class Selected"}
                    </strong>
                    <span className="text-slate-500">
                      Roll: {formData.rollNumber || "Auto-assigned"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Wizard Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                disabled={isCreatingStudent}
                className="gap-1.5 rounded-xl"
              >
                <ArrowLeft className="h-4 w-4" /> Previous
              </Button>
            ) : (
              <Link href="/students">
                <Button type="button" variant="outline" className="rounded-xl">
                  Cancel
                </Button>
              </Link>
            )}

            {currentStep < 4 ? (
              <Button
                type="button"
                variant="default"
                onClick={handleNextStep}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1.5 rounded-xl ml-auto"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                variant="default"
                isLoading={isCreatingStudent}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 rounded-xl ml-auto shadow-sm"
              >
                <Check className="h-4 w-4" /> Submit Admission
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
