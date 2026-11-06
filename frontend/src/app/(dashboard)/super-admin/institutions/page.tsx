"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Building2,
  Plus,
  Search,
  Filter,
  Eye,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Mail,
  Phone,
  ExternalLink,
  UserPlus,
  X,
  CreditCard,
  MapPin,
} from "lucide-react";

import { useAppSelector } from "@/store/hooks";
import { RoleProtectedLayout } from "@/components/layouts/RoleProtectedLayout";
import {
  useGetInstitutionsQuery,
  useCreateInstitutionMutation,
  useCreateInstitutionAdminMutation,
} from "@/store/api/institutionApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { DoodleSpark } from "@/components/ui/doodles";
import { InstitutionStatus, InstitutionType, SubscriptionPlan } from "@/types";

// Validation schema for Create Institution
const createInstitutionSchema = z.object({
  name: z.string().min(2, "Institution name must be at least 2 characters"),
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .regex(/^[A-Za-z0-9_-]+$/, "Code must be alphanumeric with underscores/hyphens"),
  type: z.enum(["SCHOOL", "COLLEGE", "UNIVERSITY"]),
  email: z.string().email("Valid institutional contact email required"),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{7,14}$/, "Valid phone number with country code required (+1234567890)"),
  street: z.string().min(3, "Street address required"),
  city: z.string().min(2, "City required"),
  state: z.string().min(2, "State required"),
  postalCode: z.string().min(3, "Postal code required"),
  plan: z.enum(["BASIC", "STANDARD", "PREMIUM"]),
});

type CreateInstitutionFormData = z.infer<typeof createInstitutionSchema>;

// Validation schema for Create Admin
const createAdminSchema = z.object({
  name: z.string().min(2, "Admin full name required"),
  email: z.string().email("Valid admin login email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  profileImage: z.string().optional(),
});

type CreateAdminFormData = z.infer<typeof createAdminSchema>;

export default function SuperAdminInstitutionsPage() {
  const { toast } = useToast();
  const { user: currentUser } = useAppSelector((state) => state.auth);

  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [adminModalInstitution, setAdminModalInstitution] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const {
    data: institutions = [],
    isLoading,
    isError,
    refetch,
  } = useGetInstitutionsQuery({
    search: search.trim() || undefined,
    status: selectedStatus !== "ALL" ? (selectedStatus as InstitutionStatus) : undefined,
  });

  const [createInstitution, { isLoading: isCreatingInstitution }] =
    useCreateInstitutionMutation();
  const [createInstitutionAdmin, { isLoading: isCreatingAdmin }] =
    useCreateInstitutionAdminMutation();

  // Institution Form
  const {
    register: registerInst,
    handleSubmit: handleSubmitInst,
    reset: resetInst,
    formState: { errors: instErrors },
  } = useForm<CreateInstitutionFormData>({
    resolver: zodResolver(createInstitutionSchema),
    defaultValues: {
      name: "",
      code: `SCH-${Math.floor(100 + Math.random() * 900)}`,
      type: "SCHOOL",
      email: "",
      phone: "+15551234567",
      street: "100 Campus Boulevard",
      city: "Springfield",
      state: "IL",
      postalCode: "62701",
      plan: "STANDARD",
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

  const onSubmitInstitution = async (data: CreateInstitutionFormData) => {
    try {
      const now = new Date();
      const oneYearLater = new Date();
      oneYearLater.setFullYear(now.getFullYear() + 1);

      const payload = {
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
        status: "ACTIVE",
        subscription: {
          plan: data.plan,
          status: "ACTIVE",
          startDate: now.toISOString(),
          endDate: oneYearLater.toISOString(),
        },
        createdBy: currentUser?.id || "507f1f77bcf86cd799439011",
      };

      await createInstitution(payload).unwrap();
      toast({
        type: "success",
        title: "Institution Created",
        description: `${data.name} has been enrolled onto the multi-tenant platform.`,
      });
      resetInst();
      setIsCreateModalOpen(false);
    } catch (err: any) {
      toast({
        type: "error",
        title: "Creation Failed",
        description: err?.data?.message || "Failed to create institution record.",
      });
    }
  };

  const onSubmitAdmin = async (data: CreateAdminFormData) => {
    if (!adminModalInstitution) return;
    try {
      await createInstitutionAdmin({
        institutionId: adminModalInstitution.id,
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        profileImage: data.profileImage || undefined,
      }).unwrap();

      toast({
        type: "success",
        title: "Administrator Assigned",
        description: `Admin account for ${data.name} created under ${adminModalInstitution.name}.`,
      });
      resetAdmin();
      setAdminModalInstitution(null);
    } catch (err: any) {
      toast({
        type: "error",
        title: "Admin Creation Failed",
        description: err?.data?.message || "Failed to assign administrator to institution.",
      });
    }
  };

  return (
    <RoleProtectedLayout allowedRoles={["SUPER_ADMIN"]}>
      <div className="space-y-6 pb-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400">
                <Building2 className="h-5 w-5" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100">
                Institutions & Multi-Tenancy
              </h1>
              <DoodleSpark className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
              Configure participating schools, tenant subscriptions, operational status, and assigned administrators.
            </p>
          </div>

          <Button
            variant="default"
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white gap-2 font-handwriting text-base h-10 px-4 rounded-xl shadow-md shadow-purple-500/20"
          >
            <Plus className="h-4 w-4" />
            <span>New Institution</span>
          </Button>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by institution name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <span className="text-xs text-slate-500 font-medium">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Institutions Table */}
        {isLoading ? (
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 space-y-4 shadow-sm">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <Skeleton className="h-10 w-48 rounded-xl bg-slate-200 dark:bg-slate-800" />
                <Skeleton className="h-6 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
                <Skeleton className="h-8 w-24 rounded-lg bg-slate-200 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <ErrorState
            onRetry={refetch}
            message="Failed to retrieve institution tenants from backend. Please verify your connection."
          />
        ) : institutions.length === 0 ? (
          <EmptyState
            title="No Institutions Found"
            description={
              search || selectedStatus !== "ALL"
                ? "No institutions match your specified filters."
                : "No educational institutions have been registered yet."
            }
            actionLabel="+ Register First Institution"
            onAction={() => setIsCreateModalOpen(true)}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800/80 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th scope="col" className="py-3.5 px-4 sm:px-6">Institution</th>
                    <th scope="col" className="py-3.5 px-4">Code</th>
                    <th scope="col" className="py-3.5 px-4">Type</th>
                    <th scope="col" className="py-3.5 px-4">Subscription Plan</th>
                    <th scope="col" className="py-3.5 px-4">Status</th>
                    <th scope="col" className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {institutions.map((inst) => {
                    const statusStr = String(inst.status || "ACTIVE").toUpperCase();
                    const isActive = statusStr === "ACTIVE";
                    const isSuspended = statusStr === "SUSPENDED";

                    return (
                      <tr
                        key={inst.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Name & Contact */}
                        <td className="py-3.5 px-4 sm:px-6">
                          <div>
                            <Link
                              href={`/super-admin/institutions/${inst.id}`}
                              className="font-bold text-slate-900 dark:text-slate-100 hover:text-purple-600 transition"
                            >
                              {inst.name}
                            </Link>
                            <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
                              {inst.email} • {inst.phone}
                            </p>
                          </div>
                        </td>

                        {/* Code */}
                        <td className="py-3.5 px-4 font-mono font-bold text-xs text-purple-600 dark:text-purple-400">
                          {inst.code}
                        </td>

                        {/* Type */}
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                            {inst.type}
                          </span>
                        </td>

                        {/* Subscription */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                              {inst.subscription?.plan || "STANDARD"}
                            </span>
                            <p className="text-[10px] text-slate-400">
                              Status: {inst.subscription?.status || "ACTIVE"}
                            </p>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              isActive
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : isSuspended
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            }`}
                          >
                            {isActive ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : isSuspended ? (
                              <AlertTriangle className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            <span>{statusStr}</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Create Admin Shortcut */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setAdminModalInstitution({
                                  id: inst.id,
                                  name: inst.name,
                                })
                              }
                              className="h-8 px-2.5 text-xs font-semibold gap-1 text-purple-600 border-purple-200 dark:border-purple-900/60 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg"
                              title="Assign Administrator"
                            >
                              <UserPlus className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Add Admin</span>
                            </Button>

                            {/* View / Manage Details */}
                            <Link href={`/super-admin/institutions/${inst.id}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2.5 text-xs font-semibold gap-1 text-slate-700 dark:text-slate-200 rounded-lg"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Manage</span>
                              </Button>
                            </Link>
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

        {/* MODAL 1: CREATE INSTITUTION */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Register New Institution Tenant
                  </h3>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitInst(onSubmitInstitution)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Institution Name"
                    placeholder="e.g. Springfield Academy"
                    {...registerInst("name")}
                    error={instErrors.name?.message}
                  />

                  <Input
                    label="Unique Identifier Code"
                    placeholder="e.g. SPFD001"
                    {...registerInst("code")}
                    error={instErrors.code?.message}
                  />

                  <div className="space-y-1.5 text-xs">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Institution Type
                    </label>
                    <select
                      {...registerInst("type")}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    >
                      <option value="SCHOOL">School</option>
                      <option value="COLLEGE">College</option>
                      <option value="UNIVERSITY">University</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Subscription Plan
                    </label>
                    <select
                      {...registerInst("plan")}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    >
                      <option value="BASIC">Basic Plan</option>
                      <option value="STANDARD">Standard Plan</option>
                      <option value="PREMIUM">Premium Plan</option>
                    </select>
                  </div>

                  <Input
                    label="Official Contact Email"
                    type="email"
                    placeholder="contact@springfield.edu"
                    {...registerInst("email")}
                    error={instErrors.email?.message}
                  />

                  <Input
                    label="Contact Phone Number"
                    placeholder="+15551234567"
                    {...registerInst("phone")}
                    error={instErrors.phone?.message}
                  />

                  <div className="sm:col-span-2">
                    <Input
                      label="Street Address"
                      placeholder="100 Campus Boulevard"
                      {...registerInst("street")}
                      error={instErrors.street?.message}
                    />
                  </div>

                  <Input
                    label="City"
                    placeholder="Springfield"
                    {...registerInst("city")}
                    error={instErrors.city?.message}
                  />

                  <Input
                    label="State / Province"
                    placeholder="IL"
                    {...registerInst("state")}
                    error={instErrors.state?.message}
                  />

                  <Input
                    label="Postal Code"
                    placeholder="62701"
                    {...registerInst("postalCode")}
                    error={instErrors.postalCode?.message}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="default"
                    disabled={isCreatingInstitution}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isCreatingInstitution ? "Creating Tenant..." : "Register Institution"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: CREATE INSTITUTION ADMIN */}
        {adminModalInstitution && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-purple-600" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Create Institution Administrator
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Tenant: {adminModalInstitution.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAdminModalInstitution(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitAdmin(onSubmitAdmin)} className="space-y-4">
                <Input
                  label="Administrator Full Name"
                  placeholder="e.g. Principal Robert Vance"
                  {...registerAdmin("name")}
                  error={adminErrors.name?.message}
                />

                <Input
                  label="Administrator Login Email"
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
                    onClick={() => setAdminModalInstitution(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="default"
                    disabled={isCreatingAdmin}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isCreatingAdmin ? "Assigning Admin..." : "Create Admin Account"}
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

