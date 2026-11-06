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
import { useCreateUserMutation, useUpdateUserStatusMutation } from "@/store/api/userApi";
import { useCreateStudentProfileMutation } from "@/store/api/studentApi";
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
  dateOfBirth: z.string().min(4, "Date of birth is required"),
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

// Step 4: Academic Enrollment Schema
const academicSchema = z.object({
  enrolledClass: z.string().min(1, "Please assign a grade/class"),
  section: z.string().min(1, "Section required"),
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
  { id: 3, title: "Guardian", desc: "Emergency Contacts", icon: Users },
  { id: 4, title: "Class & Review", desc: "Admission Term", icon: GraduationCap },
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
  } | null>(null);

  const [createUser, { isLoading: isCreatingUser }] = useCreateUserMutation();
  const [createStudentProfile, { isLoading: isCreatingProfile }] =
    useCreateStudentProfileMutation();
  const [updateUserStatus] = useUpdateUserStatusMutation();

  const { data: classesData, isLoading: isLoadingClasses } = useGetClassesQuery();

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
      enrolledClass: "Grade 10",
      section: "A",
    },
  });

  const formData = watch();

  // Validate step-specific fields before advancing
  const handleNextStep = async () => {
    let fieldsToValidate: (keyof StudentFullFormData)[] = [];
    if (currentStep === 1) {
      fieldsToValidate = ["name", "email", "password", "confirmPassword"];
    } else if (currentStep === 2) {
      fieldsToValidate = [
        "admissionNumber",
        "dateOfBirth",
        "gender",
        "street",
        "city",
        "state",
        "postalCode",
      ];
    } else if (currentStep === 3) {
      fieldsToValidate = ["parentName", "parentRelationship", "parentPhone"];
    }

    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    } else {
      toast({
        type: "error",
        title: "Incomplete Details",
        description: "Please complete all required fields correctly before proceeding.",
      });
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Final Sequential Submission Flow
  const onFinalSubmit = async (data: StudentFullFormData) => {
    let createdUserId: string | null = null;

    try {
      // 1. Create Base User with role STUDENT
      const userPayload = {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        role: "STUDENT" as const,
        institutionId:
          currentUser?.institutionId || "67272714207198bb6c30f401",
        status: "ACTIVE" as const,
      };

      const userRes = await createUser(userPayload).unwrap();
      createdUserId = userRes?.id || userRes?._id || userRes?.user?.id;

      if (!createdUserId) {
        throw new Error("User account was created, but no valid user ID was returned.");
      }

      // 2. Create Student Profile linked to newly created userId
      const dobIso = new Date(data.dateOfBirth).toISOString();

      const profilePayload = {
        userId: createdUserId,
        admissionNumber: data.admissionNumber.trim().toUpperCase(),
        dateOfBirth: dobIso,
        gender: data.gender,
        bloodGroup: data.bloodGroup || null,
        address: {
          street: data.street.trim(),
          city: data.city.trim(),
          state: data.state.trim(),
          postalCode: data.postalCode.trim(),
        },
        parentDetails: [
          {
            name: data.parentName.trim(),
            relationship: data.parentRelationship,
            phone: data.parentPhone.trim(),
            email: data.parentEmail?.trim() || null,
          },
        ],
        class: data.enrolledClass,
        section: data.section,
        status: "ACTIVE",
      };

      const profileRes = await createStudentProfile(profilePayload).unwrap();
      const studentId =
        profileRes?.data?.id ||
        profileRes?.student?.id ||
        (profileRes as any)?._id ||
        (profileRes as any)?.id ||
        createdUserId;

      toast({
        type: "success",
        title: "Student Admitted Successfully",
        description: `${data.name} is now officially registered in ${data.enrolledClass}-${data.section}.`,
      });

      setCreatedStudentRecord({
        userId: createdUserId,
        studentId: String(studentId),
        name: data.name,
        admissionNumber: data.admissionNumber,
      });
    } catch (err: any) {
      // 3. Best-effort rollback / cleanup if profile creation failed after user creation
      if (createdUserId) {
        try {
          await updateUserStatus({
            userId: createdUserId,
            status: "INACTIVE",
          }).unwrap();
        } catch {
          // Ignore secondary cleanup error
        }
      }

      const errorMessage =
        err?.data?.message ||
        err?.message ||
        "Failed to complete student admission. Please check if email or admission number already exists.";

      toast({
        type: "error",
        title: "Admission Failed",
        description: createdUserId
          ? `${errorMessage} (The preliminary user account was marked INACTIVE for safety).`
          : errorMessage,
      });
    }
  };

  const isSubmitting = isCreatingUser || isCreatingProfile;

  // Success Screen
  if (createdStudentRecord) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xl p-8 sm:p-12 space-y-6">
          <div className="h-20 w-20 mx-auto rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-8 ring-emerald-50 dark:ring-emerald-950/30">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <Badge variant="green" className="px-3 py-1 text-xs">
              Admission Confirmed
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white pt-1">
              {createdStudentRecord.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-mono">
              Admission ID: #{createdStudentRecord.admissionNumber}
            </p>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
            The student account and linked academic profile have been registered. The student can now sign in using their institutional email address.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={`/students/${createdStudentRecord.studentId}`}>
              <Button
                variant="default"
                className="w-full sm:w-auto h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold gap-2 shadow-md shadow-blue-500/20"
              >
                <Eye className="h-4 w-4" /> View Student Profile
              </Button>
            </Link>

            <Button
              variant="outline"
              onClick={() => {
                setCreatedStudentRecord(null);
                setCurrentStep(1);
              }}
              className="w-full sm:w-auto h-11 px-6 rounded-xl text-xs font-semibold"
            >
              + Admit Another Student
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/students"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600 transition mb-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Student Roster
          </Link>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400">
              <UserPlus className="h-5 w-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100">
              New Student Admission
            </h1>
            <DoodleSpark className="h-5 w-5 text-amber-500" />
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Complete the 4-step registration workflow to enroll a new student.
          </p>
        </div>
      </div>

      {/* Multi-Step Progress Indicator */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-6 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STEPS.map((step) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            const StepIcon = step.icon;

            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-2.5 rounded-xl transition ${
                  isCurrent
                    ? "bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60"
                    : isCompleted
                    ? "bg-slate-50 dark:bg-slate-800/40 text-slate-700"
                    : "opacity-60 text-slate-400"
                }`}
              >
                <div
                  className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition ${
                    isCurrent
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : isCompleted
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-xs font-bold truncate ${
                      isCurrent ? "text-blue-600 dark:text-blue-400" : "text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Form Container */}
      <form
        onSubmit={handleSubmit(onFinalSubmit)}
        className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-6 sm:p-9 space-y-6"
      >
        {/* STEP 1: ACCOUNT SETUP */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Step 1: Student Account Credentials
              </h3>
              <p className="text-xs text-slate-500">
                These credentials will be used by the student to access their portal.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Legal Name"
                placeholder="e.g. Liam Michael Vance"
                {...register("name")}
                error={errors.name?.message}
              />
              <Input
                label="Institutional Email Address"
                type="email"
                placeholder="liam.vance@school.edu"
                {...register("email")}
                error={errors.email?.message}
              />
              <Input
                label="Initial Password (min 8 characters)"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                error={errors.password?.message}
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                {...register("confirmPassword")}
                error={errors.confirmPassword?.message}
              />
            </div>
          </div>
        )}

        {/* STEP 2: PERSONAL & ADDRESS */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Step 2: Bio & Residential Address
              </h3>
              <p className="text-xs text-slate-500">
                Official personal record details and postal address.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Admission Number"
                placeholder="ADM2026-001"
                {...register("admissionNumber")}
                error={errors.admissionNumber?.message}
              />

              <Input
                label="Date of Birth"
                type="date"
                {...register("dateOfBirth")}
                error={errors.dateOfBirth?.message}
              />

              <div className="space-y-1.5 text-xs">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Gender
                </label>
                <select
                  {...register("gender")}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
                {errors.gender && (
                  <p className="text-[11px] text-rose-500">{errors.gender.message}</p>
                )}
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Blood Group
                </label>
                <select
                  {...register("bloodGroup")}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <Input
                  label="Street Address"
                  placeholder="124 Academic Way"
                  {...register("street")}
                  error={errors.street?.message}
                />
              </div>

              <Input
                label="City"
                placeholder="Springfield"
                {...register("city")}
                error={errors.city?.message}
              />

              <Input
                label="State / Province"
                placeholder="IL"
                {...register("state")}
                error={errors.state?.message}
              />

              <Input
                label="Postal Code"
                placeholder="62701"
                {...register("postalCode")}
                error={errors.postalCode?.message}
              />
            </div>
          </div>
        )}

        {/* STEP 3: GUARDIAN DETAILS */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Step 3: Parent & Guardian Contacts
              </h3>
              <p className="text-xs text-slate-500">
                Primary emergency contact for institutional correspondence.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Guardian Full Name"
                placeholder="e.g. Richard Vance"
                {...register("parentName")}
                error={errors.parentName?.message}
              />

              <div className="space-y-1.5 text-xs">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Relationship
                </label>
                <select
                  {...register("parentRelationship")}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="FATHER">Father</option>
                  <option value="MOTHER">Mother</option>
                  <option value="GUARDIAN">Legal Guardian</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <Input
                label="Contact Phone Number"
                placeholder="+1 (555) 234-5678"
                {...register("parentPhone")}
                error={errors.parentPhone?.message}
              />

              <Input
                label="Guardian Email Address (Optional)"
                type="email"
                placeholder="richard@example.com"
                {...register("parentEmail")}
                error={errors.parentEmail?.message}
              />
            </div>
          </div>
        )}

        {/* STEP 4: CLASS & REVIEW */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Step 4: Academic Class Allocation & Review
              </h3>
              <p className="text-xs text-slate-500">
                Confirm class assignment and verify summary before creation.
              </p>
            </div>

            {/* Class & Section Chooser */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-xs">
                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Enrolled Class</span>
                  {isLoadingClasses && (
                    <span className="text-[10px] text-blue-500">Loading classes...</span>
                  )}
                </label>
                <select
                  {...register("enrolledClass")}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {classesData?.data && classesData.data.length > 0 ? (
                    classesData.data.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Grade 9">Grade 9</option>
                      <option value="Grade 10">Grade 10</option>
                      <option value="Grade 11">Grade 11</option>
                      <option value="Grade 12">Grade 12</option>
                    </>
                  )}
                </select>
                {errors.enrolledClass && (
                  <p className="text-[11px] text-rose-500">{errors.enrolledClass.message}</p>
                )}
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Assigned Section
                </label>
                <select
                  {...register("section")}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>
            </div>

            {/* Summary Review Card */}
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-5 space-y-3 text-xs border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Review Submission Summary
                </span>
                <Badge variant="blue">Role: STUDENT</Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Student Name</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formData.name || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Email</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                    {formData.email || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Admission Number</span>
                  <span className="font-mono font-bold text-blue-600">
                    {formData.admissionNumber || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Class & Sec</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formData.enrolledClass}-{formData.section}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Date of Birth</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formData.dateOfBirth} ({formData.gender})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Primary Guardian</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formData.parentName || "-"} ({formData.parentPhone})
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step Navigation Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevStep}
              disabled={isSubmitting}
              className="gap-2 h-10 px-4 text-xs font-semibold rounded-xl"
            >
              <ArrowLeft className="h-4 w-4" /> Previous Step
            </Button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <Button
              type="button"
              variant="default"
              onClick={handleNextStep}
              className="gap-2 h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20"
            >
              <span>Next Step</span> <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              variant="default"
              disabled={isSubmitting}
              className="gap-2 h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-500/20"
            >
              <Check className="h-4 w-4" />
              <span>{isSubmitting ? "Enrolling Student..." : "Confirm & Admit Student"}</span>
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
