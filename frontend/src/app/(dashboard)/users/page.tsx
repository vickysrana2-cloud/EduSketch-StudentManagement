"use client";

import React, { useState, useMemo } from "react";
import {
  UserCog,
  Plus,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Edit3,
  X,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Check,
  Building2,
  Mail,
  User,
  KeyRound,
  ExternalLink,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser } from "@/store/slices/authSlice";
import { RoleProtectedLayout } from "@/components/layouts/RoleProtectedLayout";
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useUpdateUserStatusMutation,
  useUpdateUserRoleMutation,
  UserItem,
} from "@/store/api/userApi";
import { useGetInstitutionsQuery } from "@/store/api/institutionApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useToast } from "@/components/ui/toast";
import { DoodleSpark } from "@/components/ui/doodles";

// ============================================================================
// Schemas
// ============================================================================

const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Valid email address is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "TEACHER", "STUDENT"]),
  institutionId: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
  profileImage: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
});

const editUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Valid email address is required"),
  profileImage: z.string().url("Must be a valid URL").or(z.literal("")).optional().nullable(),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;
type EditUserFormData = z.infer<typeof editUserSchema>;

const ROLE_OPTIONS = ["ALL", "SUPER_ADMIN", "ADMIN", "TEACHER", "STUDENT"] as const;
const STATUS_OPTIONS = ["ALL", "ACTIVE", "INACTIVE", "SUSPENDED"] as const;

export default function UsersManagementPage() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  // Filter States
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [institutionFilter, setInstitutionFilter] = useState<string>("");

  // Pagination State
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Modals & Dialogs State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  // Status Change Dialog State
  const [statusDialogState, setStatusDialogState] = useState<{
    user: UserItem;
    targetStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  } | null>(null);

  // Role Change Modal & Dialog State
  const [roleChangeModalUser, setRoleChangeModalUser] = useState<UserItem | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<
    "SUPER_ADMIN" | "ADMIN" | "TEACHER" | "STUDENT" | ""
  >("");
  const [isRoleConfirmOpen, setIsRoleConfirmOpen] = useState(false);

  // ============================================================================
  // API Queries & Mutations
  // ============================================================================

  const {
    data: users = [],
    isLoading: isUsersLoading,
    isFetching: isUsersFetching,
    refetch: refetchUsers,
  } = useGetUsersQuery({
    role: roleFilter !== "ALL" ? roleFilter : undefined,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    institutionId: institutionFilter || undefined,
    search: search.trim() || undefined,
  });

  const { data: institutions = [] } = useGetInstitutionsQuery(undefined, {
    skip: !isSuperAdmin,
  });

  const [createUser, { isLoading: isCreatingUser }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation();
  const [updateUserStatus, { isLoading: isUpdatingStatus }] =
    useUpdateUserStatusMutation();
  const [updateUserRole, { isLoading: isUpdatingRole }] = useUpdateUserRoleMutation();

  // ============================================================================
  // Forms Setup
  // ============================================================================

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    watch: watchCreate,
    formState: { errors: createErrors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: isSuperAdmin ? "ADMIN" : "TEACHER",
      institutionId: currentUser?.institutionId || "",
      status: "ACTIVE",
      profileImage: "",
    },
  });

  const watchSelectedRole = watchCreate("role");
  const watchCreateAvatar = watchCreate("profileImage");
  const watchCreateName = watchCreate("name");

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    watch: watchEdit,
    formState: { errors: editErrors },
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
  });

  const watchEditAvatar = watchEdit("profileImage");
  const watchEditName = watchEdit("name");

  // Open Edit Modal with user data
  const handleOpenEdit = (user: UserItem) => {
    setEditingUser(user);
    resetEdit({
      name: user.name,
      email: user.email,
      profileImage: user.profileImage || "",
    });
  };

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleCreateSubmit = async (data: CreateUserFormData) => {
    try {
      const payload = {
        ...data,
        profileImage: data.profileImage || undefined,
        institutionId:
          data.role === "SUPER_ADMIN" ? null : data.institutionId || currentUser?.institutionId || null,
      };

      await createUser(payload).unwrap();

      toast({
        type: "success",
        title: "User Created",
        description: `Successfully created user account for ${data.name}.`,
      });

      setIsCreateModalOpen(false);
      resetCreate();
    } catch (err: any) {
      toast({
        type: "error",
        title: "Creation Failed",
        description: err?.data?.message || err?.message || "Failed to create user account.",
      });
    }
  };

  const handleEditSubmit = async (data: EditUserFormData) => {
    if (!editingUser) return;
    const targetUserId = editingUser.id || editingUser._id;
    if (!targetUserId) return;

    try {
      const cleanAvatar = data.profileImage?.trim() || null;
      await updateUser({
        id: targetUserId,
        name: data.name.trim(),
        email: data.email.trim(),
        profileImage: cleanAvatar,
      }).unwrap();

      // If updating the currently logged-in user, immediately update auth state in Redux
      const currentUserId = currentUser?.id || (currentUser as any)?._id;
      if (currentUserId && String(targetUserId) === String(currentUserId)) {
        dispatch(
          setUser({
            ...currentUser!,
            name: data.name.trim(),
            email: data.email.trim(),
            profileImage: cleanAvatar,
            avatar: cleanAvatar,
          })
        );
      }

      toast({
        type: "success",
        title: "Profile Updated",
        description: `Profile for ${data.name} has been updated.`,
      });

      setEditingUser(null);
    } catch (err: any) {
      toast({
        type: "error",
        title: "Update Failed",
        description: err?.data?.message || err?.message || "Failed to update user profile.",
      });
    }
  };

  const handleInitiateStatusChange = (
    user: UserItem,
    targetStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED"
  ) => {
    const userId = user.id || user._id;
    const currentUserId = (currentUser as any)?.userId || (currentUser as any)?.id;

    if (userId === currentUserId && (targetStatus === "INACTIVE" || targetStatus === "SUSPENDED")) {
      toast({
        type: "error",
        title: "Action Not Allowed",
        description: "You cannot deactivate or suspend your own account.",
      });
      return;
    }

    if (targetStatus === "INACTIVE" || targetStatus === "SUSPENDED") {
      setStatusDialogState({ user, targetStatus });
    } else {
      // Activating immediately
      confirmStatusChange(user, targetStatus);
    }
  };

  const confirmStatusChange = async (
    user: UserItem,
    targetStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED"
  ) => {
    const userId = user.id || user._id;
    if (!userId) return;

    try {
      await updateUserStatus({ userId, status: targetStatus }).unwrap();
      toast({
        type: "success",
        title: "Status Updated",
        description: `User account is now ${targetStatus}. Any active sessions have been updated.`,
      });
      setStatusDialogState(null);
    } catch (err: any) {
      toast({
        type: "error",
        title: "Status Update Failed",
        description: err?.data?.message || err?.message || "Could not change user status.",
      });
    }
  };

  const handleOpenRoleChange = (user: UserItem) => {
    setRoleChangeModalUser(user);
    setSelectedNewRole(user.role);
  };

  const handleConfirmRoleChange = async () => {
    if (!roleChangeModalUser || !selectedNewRole) return;
    const userId = roleChangeModalUser.id || roleChangeModalUser._id;
    if (!userId) return;

    try {
      await updateUserRole({ userId, role: selectedNewRole }).unwrap();
      toast({
        type: "success",
        title: "Role Changed",
        description: `User ${roleChangeModalUser.name}'s role was updated to ${selectedNewRole}.`,
      });
      setIsRoleConfirmOpen(false);
      setRoleChangeModalUser(null);
      setSelectedNewRole("");
    } catch (err: any) {
      toast({
        type: "error",
        title: "Role Change Failed",
        description: err?.data?.message || err?.message || "Could not change user role.",
      });
    }
  };

  // ============================================================================
  // Pagination & Filtering Computation
  // ============================================================================

  const totalPages = Math.max(1, Math.ceil(users.length / pageSize));
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return users.slice(start, start + pageSize);
  }, [users, page, pageSize]);

  const resetFilters = () => {
    setSearch("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
    setInstitutionFilter("");
    setPage(1);
  };

  return (
    <RoleProtectedLayout allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
      <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <UserCog className="h-6 w-6" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-handwriting">
                User Management
              </h1>
              <DoodleSpark className="h-5 w-5 text-indigo-400 hidden sm:inline" />
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manage accounts, security roles, operational status, and tenant affiliations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 rounded-xl shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Create User</span>
            </Button>
          </div>
        </div>

        {/* Filter Controls Card */}
        <div className="rounded-2xl bg-white dark:bg-[#141824] p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search name or email..."
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-400"
              />
            </div>

            {/* Role Filter */}
            <div>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              >
                <option value="ALL">All Roles</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Institution Admin</option>
                <option value="TEACHER">Teacher</option>
                <option value="STUDENT">Student</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>

            {/* Institution Filter (Super Admin only) */}
            {isSuperAdmin ? (
              <div>
                <select
                  value={institutionFilter}
                  onChange={(e) => {
                    setInstitutionFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                >
                  <option value="">All Institutions</option>
                  {institutions.map((inst: any) => (
                    <option key={inst.id || inst._id} value={inst.id || inst._id}>
                      {inst.name} ({inst.code})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="w-full h-[42px] flex items-center justify-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 rounded-xl"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset Filters
                </Button>
              </div>
            )}
          </div>

          {isSuperAdmin && (
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>
                Found <strong className="text-slate-900 dark:text-white">{users.length}</strong> total users
              </span>
              <button
                onClick={resetFilters}
                className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <RotateCcw className="h-3 w-3" />
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="rounded-2xl bg-white dark:bg-[#141824] border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
                <tr>
                  <th scope="col" className="px-5 py-3.5">
                    User Details
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Security Role
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Account Status
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Institution
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Created / Active
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isUsersLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800" />
                          <div className="space-y-1.5">
                            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                            <div className="h-3 w-44 bg-slate-200 dark:bg-slate-800 rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="h-8 w-20 bg-slate-200 dark:bg-slate-800 rounded ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center">
                      <div className="max-w-sm mx-auto space-y-3">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500">
                          <UserCog className="h-6 w-6" />
                        </div>
                        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                          No Users Found
                        </h3>
                        <p className="text-xs text-slate-500">
                          No user records match your selected filters. Try clearing your search keyword or selecting a different status/role filter.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resetFilters}
                          className="mt-2 text-xs"
                        >
                          Reset Filters
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((u) => {
                    const userId = u.id || u._id || "";
                    const institutionName =
                      typeof u.institutionId === "object" && u.institutionId
                        ? u.institutionId.name
                        : isSuperAdmin && u.institutionId
                        ? "Assigned"
                        : "Global / Platform";

                    return (
                      <tr
                        key={userId}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                      >
                        {/* User Identity */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              src={u.profileImage}
                              name={u.name}
                              size="md"
                              className="border border-slate-200 dark:border-slate-700"
                            />
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{u.name}</span>
                                {u.isEmailVerified && (
                                  <span title="Email Verified">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 flex items-center gap-1">
                                <Mail className="h-3 w-3 text-slate-400" />
                                <span>{u.email}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Security Role Badge */}
                        <td className="px-4 py-3.5">
                          {u.role === "SUPER_ADMIN" && (
                            <Badge className="bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800 flex items-center gap-1 w-fit">
                              <ShieldAlert className="h-3 w-3" />
                              <span>Super Admin</span>
                            </Badge>
                          )}
                          {u.role === "ADMIN" && (
                            <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800 flex items-center gap-1 w-fit">
                              <ShieldCheck className="h-3 w-3" />
                              <span>Admin</span>
                            </Badge>
                          )}
                          {u.role === "TEACHER" && (
                            <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800 flex items-center gap-1 w-fit">
                              <User className="h-3 w-3" />
                              <span>Teacher</span>
                            </Badge>
                          )}
                          {u.role === "STUDENT" && (
                            <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 flex items-center gap-1 w-fit">
                              <User className="h-3 w-3" />
                              <span>Student</span>
                            </Badge>
                          )}
                        </td>

                        {/* Operational Status */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            {u.status === "ACTIVE" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Active
                              </span>
                            )}
                            {u.status === "INACTIVE" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                Inactive
                              </span>
                            )}
                            {u.status === "SUSPENDED" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                Suspended
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Institution Name */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                            <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[160px] font-medium" title={institutionName}>
                              {institutionName}
                            </span>
                          </div>
                        </td>

                        {/* Created At / Last Login */}
                        <td className="px-4 py-3.5">
                          <div className="text-xs text-slate-500">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Quick Status Toggle Button */}
                            <select
                              value={u.status}
                              onChange={(e) =>
                                handleInitiateStatusChange(
                                  u,
                                  e.target.value as "ACTIVE" | "INACTIVE" | "SUSPENDED"
                                )
                              }
                              className="text-xs py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-indigo-400 focus:outline-none"
                              title="Update Account Operational Status"
                            >
                              <option value="ACTIVE">Active</option>
                              <option value="INACTIVE">Inactive</option>
                              <option value="SUSPENDED">Suspended</option>
                            </select>

                            {/* Edit Profile */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEdit(u)}
                              className="h-8 px-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:border-indigo-300"
                              title="Edit user details"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>

                            {/* Super Admin Change Role Action */}
                            {isSuperAdmin && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenRoleChange(u)}
                                className="h-8 px-2.5 rounded-lg text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                                title="Change security role (Super Admin only)"
                              >
                                <KeyRound className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-3.5 bg-slate-50/60 dark:bg-slate-900/50 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>
                Page <strong className="text-slate-800 dark:text-slate-200">{page}</strong> of{" "}
                <strong className="text-slate-800 dark:text-slate-200">{totalPages}</strong>
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-7 px-2.5 rounded-lg text-xs"
                >
                  <ChevronLeft className="h-3 w-3 mr-1" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-7 px-2.5 rounded-lg text-xs"
                >
                  Next
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ==================================================================== */}
        {/* CREATE USER MODAL */}
        {/* ==================================================================== */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#141824] p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
                    <UserCog className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white font-handwriting">
                      Create New User Account
                    </h3>
                    <p className="text-xs text-slate-500">
                      Add a centralized user document with assigned role and credentials.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitCreate(handleCreateSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <Input
                      placeholder="e.g. Ramesh Patel"
                      {...registerCreate("name")}
                      className="rounded-xl"
                    />
                    {createErrors.name && (
                      <p className="text-[11px] text-red-500 mt-1">{createErrors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address *
                    </label>
                    <Input
                      type="email"
                      placeholder="ramesh@example.com"
                      {...registerCreate("email")}
                      className="rounded-xl"
                    />
                    {createErrors.email && (
                      <p className="text-[11px] text-red-500 mt-1">{createErrors.email.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Password *
                    </label>
                    <Input
                      type="password"
                      placeholder="Min 6 characters"
                      {...registerCreate("password")}
                      className="rounded-xl"
                    />
                    {createErrors.password && (
                      <p className="text-[11px] text-red-500 mt-1">
                        {createErrors.password.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Assigned Role *
                    </label>
                    <select
                      {...registerCreate("role")}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    >
                      {isSuperAdmin && <option value="SUPER_ADMIN">SUPER_ADMIN</option>}
                      <option value="ADMIN">ADMIN (Institution Administrator)</option>
                      <option value="TEACHER">TEACHER</option>
                      <option value="STUDENT">STUDENT</option>
                    </select>
                    {createErrors.role && (
                      <p className="text-[11px] text-red-500 mt-1">{createErrors.role.message}</p>
                    )}
                  </div>
                </div>

                {/* Institution Selector */}
                {watchSelectedRole !== "SUPER_ADMIN" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Target Institution *
                    </label>
                    {isSuperAdmin ? (
                      <select
                        {...registerCreate("institutionId")}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                      >
                        <option value="">Select Institution</option>
                        {institutions.map((inst: any) => (
                          <option key={inst.id || inst._id} value={inst.id || inst._id}>
                            {inst.name} ({inst.code})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        disabled
                        value="Current Institution"
                        className="rounded-xl bg-slate-100 dark:bg-slate-800 cursor-not-allowed"
                      />
                    )}
                    {createErrors.institutionId && (
                      <p className="text-[11px] text-red-500 mt-1">
                        {createErrors.institutionId.message}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Initial Account Status
                  </label>
                  <select
                    {...registerCreate("status")}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Profile Avatar URL (Optional)
                    </label>
                    {watchCreateAvatar && (
                      <span className="text-[10px] text-slate-400 font-medium">Live Preview</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      placeholder="https://example.com/avatar.jpg"
                      {...registerCreate("profileImage")}
                      className="rounded-xl flex-1"
                    />
                    <UserAvatar
                      src={watchCreateAvatar}
                      name={watchCreateName || "New User"}
                      size="md"
                      className="border border-slate-200 dark:border-slate-700 ring-2 ring-indigo-50 dark:ring-indigo-950"
                    />
                  </div>
                  {createErrors.profileImage && (
                    <p className="text-[11px] text-red-500 mt-1">
                      {createErrors.profileImage.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                    disabled={isCreatingUser}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={isCreatingUser}
                    className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                  >
                    Create Account
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* EDIT USER MODAL */}
        {/* ==================================================================== */}
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#141824] p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
                    <Edit3 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white font-handwriting">
                      Edit User Profile
                    </h3>
                    <p className="text-xs text-slate-500">
                      Update profile name, email, or avatar image URL.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitEdit(handleEditSubmit)} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <Input {...registerEdit("name")} className="rounded-xl" />
                  {editErrors.name && (
                    <p className="text-[11px] text-red-500 mt-1">{editErrors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <Input type="email" {...registerEdit("email")} className="rounded-xl" />
                  {editErrors.email && (
                    <p className="text-[11px] text-red-500 mt-1">{editErrors.email.message}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Profile Avatar URL (Optional)
                    </label>
                    {watchEditAvatar && (
                      <span className="text-[10px] text-slate-400 font-medium">Live Preview</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      placeholder="https://example.com/avatar.jpg"
                      {...registerEdit("profileImage")}
                      className="rounded-xl flex-1"
                    />
                    <UserAvatar
                      src={watchEditAvatar}
                      name={watchEditName || editingUser?.name || "User"}
                      size="md"
                      className="border border-slate-200 dark:border-slate-700 ring-2 ring-indigo-50 dark:ring-indigo-950"
                    />
                  </div>
                  {editErrors.profileImage && (
                    <p className="text-[11px] text-red-500 mt-1">
                      {editErrors.profileImage.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingUser(null)}
                    disabled={isUpdatingUser}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={isUpdatingUser}
                    className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* ROLE CHANGE MODAL (Super Admin Authorized Workflow) */}
        {/* ==================================================================== */}
        {roleChangeModalUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#141824] p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white font-handwriting">
                      Change Security Role
                    </h3>
                    <p className="text-xs text-slate-500">
                      Super Admin separate authorized workflow for role assignment.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setRoleChangeModalUser(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200">Target User:</strong>{" "}
                    {roleChangeModalUser.name} ({roleChangeModalUser.email})
                  </div>
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200">Current Role:</strong>{" "}
                    <Badge className="ml-1 text-[11px]">{roleChangeModalUser.role}</Badge>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select New Security Role *
                  </label>
                  <select
                    value={selectedNewRole}
                    onChange={(e) =>
                      setSelectedNewRole(
                        e.target.value as "SUPER_ADMIN" | "ADMIN" | "TEACHER" | "STUDENT"
                      )
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
                  >
                    <option value="SUPER_ADMIN">SUPER_ADMIN (Platform Administrator)</option>
                    <option value="ADMIN">ADMIN (Institution Administrator)</option>
                    <option value="TEACHER">TEACHER (Faculty Account)</option>
                    <option value="STUDENT">STUDENT (Student Self-Service)</option>
                  </select>
                </div>

                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                  Note: Role escalation/de-escalation takes immediate effect. Changing to SUPER_ADMIN dissociates the account from specific institution tenants.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRoleChangeModalUser(null)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => setIsRoleConfirmOpen(true)}
                  disabled={!selectedNewRole || selectedNewRole === roleChangeModalUser.role}
                  className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                  Proceed to Confirm
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* ROLE CHANGE CONFIRMATION DIALOG (Strict Requirement 5 & User Prompt) */}
        {/* ==================================================================== */}
        <ConfirmationDialog
          isOpen={isRoleConfirmOpen}
          onClose={() => setIsRoleConfirmOpen(false)}
          onConfirm={handleConfirmRoleChange}
          title="Confirm Role Change"
          description={`Are you sure you want to change the security role of "${roleChangeModalUser?.name}" from ${roleChangeModalUser?.role} to ${selectedNewRole}? This authorization change immediately alters all system and tenant access rights.`}
          confirmText="Yes, Change Role"
          cancelText="Cancel"
          variant="destructive"
          isLoading={isUpdatingRole}
        />

        {/* ==================================================================== */}
        {/* STATUS CHANGE CONFIRMATION DIALOG */}
        {/* ==================================================================== */}
        {statusDialogState && (
          <ConfirmationDialog
            isOpen={true}
            onClose={() => setStatusDialogState(null)}
            onConfirm={() =>
              confirmStatusChange(statusDialogState.user, statusDialogState.targetStatus)
            }
            title={`Set Account to ${statusDialogState.targetStatus}`}
            description={`Are you sure you want to change ${statusDialogState.user.name}'s account status to ${statusDialogState.targetStatus}? If suspended or deactivated, all active login sessions and JWT refresh tokens for this user will be revoked immediately.`}
            confirmText={`Yes, Set ${statusDialogState.targetStatus}`}
            cancelText="Cancel"
            variant="destructive"
            isLoading={isUpdatingStatus}
          />
        )}
      </div>
    </RoleProtectedLayout>
  );
}
