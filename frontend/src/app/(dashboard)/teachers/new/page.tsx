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
  GraduationCap,
  Award,
  BookOpen,
  Calendar,
  Phone,
  Mail,
  CheckCircle2,
  Eye,
} from "lucide-react";

import { useAppSelector } from "@/store/hooks";
import { useCreateTeacherUserMutation } from "@/store/api/teacherApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { DoodleSpark } from "@/components/ui/doodles";

// Step 1: Account Schema
const teacherAccountSchema = z
  .object({
    name: z.string().min(2, "Teacher name must be at least 2 characters"),
    email: z.string().email("Valid institutional email address required"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    confirmPassword: z.string().min(8, "Please confirm password"),
    phone: z.string().min(6, "Valid phone number required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Step 2: Qualification Schema
const teacherQualificationSchema = z.object({
  employeeId: z.string().min(2, "Employee ID required"),
  qualification: z.string().min(2, "Educational qualification required (e.g. M.Ed, M.Sc)"),
  joiningDate: z.string().min(4, "Joining date required"),
});

// Step 3: Specialization Schema
const teacherSpecializationSchema = z.object({
  specialization: z.string().min(2, "Enter primary specialization or department"),
  experienceYears: z.coerce.number().min(0, "Experience cannot be negative").max(60),
});

const fullTeacherSchema = teacherAccountSchema
  .and(teacherQualificationSchema)
  .and(teacherSpecializationSchema);

type TeacherFullFormData = z.infer<typeof fullTeacherSchema>;

const STEPS = [
  { id: 1, title: "Account Details", desc: "Credentials & Contact", icon: Shield },
  { id: 2, title: "Qualifications", desc: "Degrees & Employee ID", icon: Award },
  { id: 3, title: "Specialization", desc: "Subjects & Experience", icon: BookOpen },
];

export default function NewTeacherOnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentUser } = useAppSelector((state) => state.auth);

  const [currentStep, setCurrentStep] = useState(1);
  const [createdTeacherRecord, setCreatedTeacherRecord] = useState<{
    userId: string;
    teacherId: string;
    name: string;
    employeeId: string;
  } | null>(null);

  const [createTeacherUser, { isLoading: isSubmitting }] =
    useCreateTeacherUserMutation();

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm<TeacherFullFormData>({
    resolver: zodResolver(fullTeacherSchema) as any,
    mode: "onBlur",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "+1 (555) 234-5678",
      employeeId: `EMP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      qualification: "M.Ed, B.Sc Mathematics",
      joiningDate: "2025-08-01",
      specialization: "Mathematics, Calculus",
      experienceYears: 5,
    },
  });

  const formData = watch();

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof TeacherFullFormData)[] = [];
    if (currentStep === 1) {
      fieldsToValidate = ["name", "email", "password", "confirmPassword", "phone"];
    } else if (currentStep === 2) {
      fieldsToValidate = ["employeeId", "qualification", "joiningDate"];
    }

    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    } else {
      toast({
        type: "error",
        title: "Required Fields Missing",
        description: "Please fill in all required step fields before advancing.",
      });
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const onFinalSubmit = async (data: TeacherFullFormData) => {
    try {
      const specializations = data.specialization
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const qualifications = data.qualification
        .split(",")
        .map((q) => q.trim())
        .filter(Boolean);

      const joiningIso = new Date(data.joiningDate).toISOString();

      // Atomic Teacher Creation: User + Profile in a single transactional request
      const payload = {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        employeeId: data.employeeId.trim().toUpperCase(),
        qualification: qualifications.length > 0 ? qualifications : [data.qualification.trim()],
        specialization: specializations.length > 0 ? specializations : ["General Faculty"],
        experienceYears: Number(data.experienceYears),
        joiningDate: joiningIso,
        institutionId: currentUser?.institutionId || undefined,
      };

      const result = await createTeacherUser(payload).unwrap();

      const createdUserId =
        result?.user?._id || result?.user?.id || result?.userId;
      const createdTeacherId =
        result?.teacherProfile?._id ||
        result?.teacherProfile?.id ||
        result?.id ||
        createdUserId;

      toast({
        type: "success",
        title: "Faculty Member Onboarded",
        description: `${data.name} is now successfully registered in the faculty directory.`,
      });

      setCreatedTeacherRecord({
        userId: String(createdUserId),
        teacherId: String(createdTeacherId),
        name: data.name,
        employeeId: data.employeeId,
      });
    } catch (err: any) {
      const errorMessage =
        err?.data?.message ||
        err?.message ||
        "Failed to register faculty profile. Please check if email or employee ID already exists.";

      toast({
        type: "error",
        title: "Registration Error",
        description: errorMessage,
      });
    }
  };

  // Success Confirmation Screen
  if (createdTeacherRecord) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xl p-8 sm:p-12 space-y-6">
          <div className="h-20 w-20 mx-auto rounded-3xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-lg shadow-purple-500/20 ring-8 ring-purple-50 dark:ring-purple-950/30">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <Badge variant="purple" className="px-3 py-1 text-xs">
              Faculty Onboarding Completed
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white pt-1">
              {createdTeacherRecord.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-mono">
              Employee ID: #{createdTeacherRecord.employeeId}
            </p>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
            The faculty account and credentials have been established. You may now assign curriculum subjects and classes to this instructor.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={`/teachers/${createdTeacherRecord.teacherId}`}>
              <Button
                variant="default"
                className="w-full sm:w-auto h-11 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold gap-2 shadow-md shadow-purple-500/20"
              >
                <Eye className="h-4 w-4" /> View Instructor Profile
              </Button>
            </Link>

            <Button
              variant="outline"
              onClick={() => {
                setCreatedTeacherRecord(null);
                setCurrentStep(1);
              }}
              className="w-full sm:w-auto h-11 px-6 rounded-xl text-xs font-semibold"
            >
              + Onboard Another Teacher
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
            href="/teachers"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-purple-600 transition mb-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Faculty Directory
          </Link>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400">
              <UserPlus className="h-5 w-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100">
              Onboard Faculty Member
            </h1>
            <DoodleSpark className="h-5 w-5 text-[#8B6DFF]" />
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Register academic instructor account, qualifications, and teaching specializations.
          </p>
        </div>
      </div>

      {/* Steps Indicator */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {STEPS.map((step) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            const StepIcon = step.icon;

            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition ${
                  isCurrent
                    ? "bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-900/60"
                    : isCompleted
                    ? "bg-slate-50 dark:bg-slate-800/40 text-slate-700"
                    : "opacity-60 text-slate-400"
                }`}
              >
                <div
                  className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition ${
                    isCurrent
                      ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
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
                      isCurrent ? "text-purple-600 dark:text-purple-400" : "text-slate-800 dark:text-slate-200"
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

      {/* Main Form */}
      <form
        onSubmit={handleSubmit(onFinalSubmit)}
        className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-6 sm:p-9 space-y-6"
      >
        {/* STEP 1: ACCOUNT */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Step 1: Account Credentials & Phone
              </h3>
              <p className="text-xs text-slate-500">
                Authentication credentials for the instructor portal.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name (with honorific)"
                placeholder="Dr. Clara Oswald"
                {...register("name")}
                error={errors.name?.message}
              />
              <Input
                label="Institutional Email"
                type="email"
                placeholder="clara.oswald@school.edu"
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
              <div className="sm:col-span-2">
                <Input
                  label="Contact Phone Number"
                  placeholder="+1 (555) 345-6789"
                  {...register("phone")}
                  error={errors.phone?.message}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: QUALIFICATIONS */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Step 2: Educational Qualifications & Employee ID
              </h3>
              <p className="text-xs text-slate-500">
                Official institutional identification and highest university degrees.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Employee ID / Faculty Code"
                placeholder="EMP-2026-042"
                {...register("employeeId")}
                error={errors.employeeId?.message}
              />
              <div className="sm:col-span-2">
                <Input
                  label="Degrees / Qualifications (comma separated)"
                  placeholder="M.Ed, B.Sc Mathematics, Ph.D Education"
                  {...register("qualification")}
                  error={errors.qualification?.message}
                />
              </div>
              <Input
                label="Joining Date"
                type="date"
                {...register("joiningDate")}
                error={errors.joiningDate?.message}
              />
            </div>
          </div>
        )}

        {/* STEP 3: SPECIALIZATION & REVIEW */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Step 3: Teaching Specialization & Final Review
              </h3>
              <p className="text-xs text-slate-500">
                Primary curriculum departments and years of teaching experience.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Specialization / Subject Departments (comma separated)"
                placeholder="Mathematics, Calculus, Statistics"
                {...register("specialization")}
                error={errors.specialization?.message}
              />
              <Input
                label="Total Years of Teaching Experience"
                type="number"
                {...register("experienceYears")}
                error={errors.experienceYears?.message}
              />
            </div>

            {/* Summary Review Card */}
            <div className="rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/60 p-5 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-purple-200 dark:border-purple-800 pb-2">
                <span className="font-bold text-purple-900 dark:text-purple-200">
                  Review Faculty Registration Summary
                </span>
                <Badge variant="purple">Role: TEACHER</Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Instructor Name</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formData.name || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Institutional Email</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                    {formData.email || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Employee Code</span>
                  <span className="font-mono font-bold text-purple-600">
                    {formData.employeeId || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Degrees</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formData.qualification || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Experience</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formData.experienceYears} Years
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Subjects</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                    {formData.specialization || "-"}
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

          {currentStep < 3 ? (
            <Button
              type="button"
              variant="default"
              onClick={handleNextStep}
              className="gap-2 h-10 px-5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-500/20"
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
              <span>{isSubmitting ? "Onboarding Faculty..." : "Confirm & Register Faculty"}</span>
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

