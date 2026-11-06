"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ArrowLeft,
  Building2,
  Edit3,
  Save,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  UserPlus,
  ShieldCheck,
  X,
  ExternalLink,
  Sparkles,
} from "lucide-react";

import { RoleProtectedLayout } from "@/components/layouts/RoleProtectedLayout";
import {
  useGetInstitutionByIdQuery,
  useUpdateInstitutionMutation,
  useUpdateInstitutionStatusMutation,
  useCreateInstitutionAdminMutation,
} from "@/store/api/institutionApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useToast } from "@/components/ui/toast";
import { InstitutionStatus, InstitutionType } from "@/types";

// Edit Institution Form Schema
const editInstitutionSchema = z.object({
  name: z.string().min(2, "Institution name required"),
  code: z.string().min(2, "Institution code required"),
  type: z.enum(["SCHOOL", "COLLEGE", "UNIVERSITY"]),
  email: z.string().email("Valid email required"),
  phone: z.string().min(6, "Valid phone number required"),
  street: z.string().min(3, "Street address required"),
  city: z.string().min(2, "City required"),
  state: z.string().min(2, "State required"),
  postalCode: z.string().min(3, "Postal code required"),
});

type EditInstitutionFormData = z.infer<typeof editInstitutionSchema>;

// Create Admin Form Schema
const createAdminSchema = z.object({
  name: z.string().min(2, "Admin full name required"),
  email: z.string().email("Valid administrator email required"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  profileImage: z.string().optional(),
});

type CreateAdminFormData = z.infer<typeof createAdminSchema>;

export default function InstitutionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = (params?.id as string) || "";

  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  const {
    data: institution,
    isLoading,
    isError,
    refetch,
  } = useGetInstitutionByIdQuery(id);

  const [updateInstitution, { isLoading: isUpdating }] =
    useUpdateInstitutionMutation();
  const [updateStatus, { isLoading: isUpdatingStatus }] =
    useUpdateInstitutionStatusMutation();
  const [createAdmin, { isLoading: isCreatingAdmin }] =
    useCreateInstitutionAdminMutation();

  // Edit Form
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    formState: { errors: editErrors },
  } = useForm<EditInstitutionFormData>({
    resolver: zodResolver(editInstitutionSchema),
    values: {
      name: institution?.name || "",
      code: institution?.code || "",
      type: (institution?.type as any) || "SCHOOL",
      email: institution?.email || "",
      phone: institution?.phone || "",
      street: institution?.address?.street || "",
      city: institution?.address?.city || "",
      state: institution?.address?.state || "",
      postalCode: institution?.address?.postalCode || "",
    },
  });

  // Admin Form
  const {
    register: registerAdmin,
    handleSubmit: handleSubmitAdmin,
    reset: resetAdmin,
    formState: { errors: adminErrors },
  } = useForm<CreateAdminFormData>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      profileImage: "",
    },
  });

  const onSaveInstitution = async (data: EditInstitutionFormData) => {
    try {
      await updateInstitution({
        id,
        data: {
          name: data.name.trim(),
          code: data.code.trim().toUpperCase(),
          type: data.type,
          email: data.email.trim().toLowerCase(),
          phone: data.phone.trim(),
          address: {
            street: data.street.trim(),
            city: data.city.trim(),
            state: data.state.trim(),
            postalCode: data.postalCode.trim(),
          },
        },
      }).unwrap();

      toast({
        type: "success",
        title: "Institution Updated",
        description: "Tenant details and address have been saved.",
      });
    } catch (err: any) {
      toast({
        type: "error",
        title: "Update Failed",
        description: err?.data?.message || "Failed to update institution record.",
      });
    }
  };

  const handleStatusToggle = async (newStatus: InstitutionStatus) => {
    try {
      await updateStatus({ id, status: newStatus }).unwrap();
      toast({
        type: "info",
        title: "Status Updated",
        description: `Institution operational status changed to ${newStatus}.`,
      });
    } catch (err: any) {
      toast({
        type: "error",
        title: "Status Update Failed",
        description: err?.data?.message || "Could not modify status.",
      });
    }
  };

  const onSubmitAdmin = async (data: CreateAdminFormData) => {
    try {
      await createAdmin({
        institutionId: id,
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        profileImage: data.profileImage || undefined,
      }).unwrap();

      toast({
        type: "success",
        title: "Administrator Assigned",
        description: `New admin account created for ${data.name}.`,
      });
      resetAdmin();
      setIsAdminModalOpen(false);
    } catch (err: any) {
      toast({
        type: "error",
        title: "Admin Creation Failed",
        description: err?.data?.message || "Failed to assign administrator.",
      });
    }
  };

  if (isLoading) {
    return (
      <RoleProtectedLayout allowedRoles={["SUPER_ADMIN"]}>
        <div className="space-y-6 pb-12 max-w-6xl mx-auto">
          <Skeleton className="h-8 w-48 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="lg:col-span-2 h-96 rounded-3xl bg-slate-200 dark:bg-slate-800" />
            <Skeleton className="h-96 rounded-3xl bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      </RoleProtectedLayout>
    );
  }

  if (isError || !institution) {
    return (
      <RoleProtectedLayout allowedRoles={["SUPER_ADMIN"]}>
        <div className="py-12 max-w-xl mx-auto text-center space-y-4">
          <ErrorState
            onRetry={refetch}
            message="Institution record could not be loaded from backend service."
          />
          <Link href="/super-admin/institutions">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Institutions Directory
            </Button>
          </Link>
        </div>
      </RoleProtectedLayout>
    );
  }

  const statusStr = String(institution.status || "ACTIVE").toUpperCase();
  const sub = institution.subscription;

  return (
    <RoleProtectedLayout allowedRoles={["SUPER_ADMIN"]}>
      <div className="space-y-6 pb-12 max-w-6xl mx-auto">
        {/* Top Header & Breadcrumbs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/super-admin/institutions"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-purple-600 transition mb-2"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Institutions Directory
            </Link>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 shadow-sm">
                <Building2 className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {institution.name}
                </h1>
                <p className="text-xs text-slate-500 font-mono">
                  Code: #{institution.code} • Type: {institution.type}
                </p>
              </div>
            </div>
          </div>

          {/* Operational Status Control Buttons */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <span className="text-xs font-bold text-slate-500 px-2">Status:</span>
            {(["ACTIVE", "INACTIVE", "SUSPENDED"] as InstitutionStatus[]).map((st) => {
              const isCurrent = statusStr === st;
              return (
                <button
                  key={st}
                  type="button"
                  disabled={isUpdatingStatus || isCurrent}
                  onClick={() => handleStatusToggle(st)}
                  className={`px-3 py-1 text-xs font-bold rounded-xl transition ${
                    isCurrent
                      ? st === "ACTIVE"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : st === "SUSPENDED"
                        ? "bg-rose-600 text-white shadow-sm"
                        : "bg-amber-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-slate-700"
                  }`}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Edit Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="h-4 w-4 text-purple-600" />
                  <span>Edit Institution Profile</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  ID: {institution.id}
                </span>
              </div>

              <form onSubmit={handleSubmitEdit(onSaveInstitution)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Official Name"
                    {...registerEdit("name")}
                    error={editErrors.name?.message}
                  />

                  <Input
                    label="Institution Identifier Code"
                    {...registerEdit("code")}
                    error={editErrors.code?.message}
                  />

                  <div className="space-y-1.5 text-xs">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Institution Type
                    </label>
                    <select
                      {...registerEdit("type")}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    >
                      <option value="SCHOOL">School</option>
                      <option value="COLLEGE">College</option>
                      <option value="UNIVERSITY">University</option>
                    </select>
                  </div>

                  <Input
                    label="Contact Email"
                    type="email"
                    {...registerEdit("email")}
                    error={editErrors.email?.message}
                  />

                  <Input
                    label="Contact Phone Number"
                    {...registerEdit("phone")}
                    error={editErrors.phone?.message}
                  />

                  <div className="sm:col-span-2">
                    <Input
                      label="Campus Street Address"
                      {...registerEdit("street")}
                      error={editErrors.street?.message}
                    />
                  </div>

                  <Input
                    label="City"
                    {...registerEdit("city")}
                    error={editErrors.city?.message}
                  />

                  <Input
                    label="State / Province"
                    {...registerEdit("state")}
                    error={editErrors.state?.message}
                  />

                  <Input
                    label="Postal Code"
                    {...registerEdit("postalCode")}
                    error={editErrors.postalCode?.message}
                  />
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="submit"
                    variant="default"
                    disabled={isUpdating}
                    className="h-10 px-5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl gap-2 text-xs font-semibold shadow-md shadow-purple-500/20"
                  >
                    <Save className="h-4 w-4" />
                    <span>{isUpdating ? "Saving..." : "Save Changes"}</span>
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Subscription Card & Admin Management */}
          <div className="space-y-6">
            {/* Subscription Card */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Subscription Tier
                  </h3>
                </div>
                <Badge variant="purple" className="uppercase font-bold text-[10px]">
                  {sub?.plan || "STANDARD"}
                </Badge>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/60 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Plan Status:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                    {sub?.status || "ACTIVE"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Billing Cycle:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Annual Multi-Tenant
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-purple-200/60 dark:border-purple-800/60">
                  <span className="text-slate-500">Start Date:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {sub?.startDate
                      ? new Date(sub.startDate).toLocaleDateString()
                      : "Nov 01, 2026"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Renewal / End Date:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {sub?.endDate
                      ? new Date(sub.endDate).toLocaleDateString()
                      : "Oct 31, 2027"}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-500">
                <p className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider">
                  Plan Entitlements
                </p>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Unlimited Student Profiles</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Role-Based Access Control (RBAC)</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Multi-Tenant DB Data Isolation</span>
                </div>
              </div>
            </div>

            {/* Administrators Management Card */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Tenant Administrators
                  </h3>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Appoint institutional administrators responsible for managing faculty, student admissions, and academic classes.
              </p>

              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAdminModalOpen(true)}
                className="w-full gap-2 h-10 text-xs font-semibold rounded-xl text-purple-600 border-purple-200 dark:border-purple-900 hover:bg-purple-50 dark:hover:bg-purple-950/40"
              >
                <UserPlus className="h-4 w-4" />
                <span>+ Create Administrator</span>
              </Button>
            </div>
          </div>
        </div>

        {/* CREATE ADMIN MODAL */}
        {isAdminModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-purple-600" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Create Administrator
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Tenant: {institution.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAdminModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitAdmin(onSubmitAdmin)} className="space-y-4">
                <Input
                  label="Administrator Full Name"
                  placeholder="e.g. Robert Vance"
                  {...registerAdmin("name")}
                  error={adminErrors.name?.message}
                />

                <Input
                  label="Administrator Email Address"
                  type="email"
                  placeholder="admin@school.com"
                  {...registerAdmin("email")}
                  error={adminErrors.email?.message}
                />

                <Input
                  label="Initial Password (min 8 characters)"
                  type="password"
                  placeholder="••••••••"
                  {...registerAdmin("password")}
                  error={adminErrors.password?.message}
                />

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAdminModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="default"
                    disabled={isCreatingAdmin}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isCreatingAdmin ? "Creating..." : "Confirm & Create Admin"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RoleProtectedLayout>
  );
}

