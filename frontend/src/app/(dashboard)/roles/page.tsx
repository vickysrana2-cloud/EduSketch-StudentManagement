"use client";

import React, { useState, useMemo } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Edit3,
  Check,
  X,
  Building2,
  Lock,
  Unlock,
  Layers,
  Info,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  Sparkles,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { RoleProtectedLayout } from "@/components/layouts/RoleProtectedLayout";
import {
  useGetRolesQuery,
  useUpdateRoleMutation,
  useGetPermissionsQuery,
  useGetPermissionsByRoleQuery,
  useAssignRolePermissionMutation,
  useRevokeRolePermissionMutation,
  RoleItem,
  PermissionItem,
} from "@/store/api/rolePermissionApi";
import { useGetInstitutionsQuery } from "@/store/api/institutionApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { DoodleSpark } from "@/components/ui/doodles";

// ============================================================================
// Matrix Modules & Actions Constants
// ============================================================================

const MODULES = [
  { key: "INSTITUTIONS", label: "Institutions", desc: "Multi-tenant tenant management & registration" },
  { key: "USERS", label: "User Accounts", desc: "User profiles, roles, and credential management" },
  { key: "STUDENTS", label: "Student Profiles", desc: "Student records, parents, admission data" },
  { key: "TEACHERS", label: "Teacher Profiles", desc: "Faculty credentials, qualifications, workload" },
  { key: "CLASSES", label: "Classrooms", desc: "Class groups, sections, and room capacity" },
  { key: "SUBJECTS", label: "Subjects & Curriculum", desc: "Subject catalogs and teacher subject assignments" },
  { key: "ATTENDANCE", label: "Attendance Tracking", desc: "Daily student & faculty attendance records" },
  { key: "EXAMINATIONS", label: "Examinations", desc: "Assessment scheduling, papers, exam sessions" },
  { key: "RESULTS", label: "Grading & Results", desc: "Exam marks, report cards, grade processing" },
  { key: "FEES", label: "Fee Management", desc: "Tuition structures, billing, payment receipts" },
] as const;

const ACTIONS = [
  { key: "CREATE", label: "Create", color: "text-emerald-600 dark:text-emerald-400" },
  { key: "READ", label: "Read", color: "text-blue-600 dark:text-blue-400" },
  { key: "UPDATE", label: "Update", color: "text-amber-600 dark:text-amber-400" },
  { key: "DELETE", label: "Delete", color: "text-red-600 dark:text-red-400" },
  { key: "MANAGE", label: "Manage", color: "text-purple-600 dark:text-purple-400" },
] as const;

// Metadata edit schema (Only non-critical metadata is mutable)
const updateRoleSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
  description: z.string().max(500, "Description cannot exceed 500 characters"),
  isActive: z.boolean(),
});

type UpdateRoleFormData = z.infer<typeof updateRoleSchema>;

export default function RolesAndPermissionsPage() {
  const { toast } = useToast();

  // Selected State
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>("");
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [togglingPermissionId, setTogglingPermissionId] = useState<string | null>(null);

  // ============================================================================
  // API Queries & Mutations
  // ============================================================================

  const { data: roles = [], isLoading: isRolesLoading } = useGetRolesQuery();
  const { data: institutions = [] } = useGetInstitutionsQuery();
  const { data: permissions = [], isLoading: isPermissionsLoading } = useGetPermissionsQuery();

  // Default active role to ADMIN or first role if not set
  const activeRoleId = useMemo(() => {
    if (selectedRoleId) return selectedRoleId;
    if (roles.length > 0) {
      const adminRole = roles.find((r) => r.name === "ADMIN");
      return adminRole ? adminRole.id : roles[0].id;
    }
    return "";
  }, [roles, selectedRoleId]);

  const activeRole = useMemo(() => {
    return roles.find((r) => r.id === activeRoleId);
  }, [roles, activeRoleId]);

  const {
    data: rolePermissions = [],
    isLoading: isRolePermissionsLoading,
    isFetching: isRolePermissionsFetching,
  } = useGetPermissionsByRoleQuery(
    {
      roleId: activeRoleId,
      institutionId: selectedInstitutionId || null,
    },
    { skip: !activeRoleId }
  );

  const [updateRole, { isLoading: isUpdatingRole }] = useUpdateRoleMutation();
  const [assignRolePermission] = useAssignRolePermissionMutation();
  const [revokeRolePermission] = useRevokeRolePermissionMutation();

  // ============================================================================
  // Form Setup for Metadata Edit
  // ============================================================================

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateRoleFormData>({
    resolver: zodResolver(updateRoleSchema),
  });

  const handleOpenEditRole = (role: RoleItem) => {
    setEditingRole(role);
    reset({
      displayName: role.displayName,
      description: role.description,
      isActive: role.isActive,
    });
  };

  const handleUpdateRoleSubmit = async (data: UpdateRoleFormData) => {
    if (!editingRole) return;
    try {
      await updateRole({
        id: editingRole.id,
        displayName: data.displayName,
        description: data.description,
        isActive: data.isActive,
      }).unwrap();

      toast({
        type: "success",
        title: "Role Metadata Updated",
        description: `Successfully updated metadata for role "${data.displayName}".`,
      });

      setEditingRole(null);
    } catch (err: any) {
      toast({
        type: "error",
        title: "Update Failed",
        description: err?.data?.message || err?.message || "Failed to update role metadata.",
      });
    }
  };

  // ============================================================================
  // Permission Matrix Mapping
  // ============================================================================

  // Lookup map: `${module}:${action}` -> PermissionItem
  const permissionCatalogMap = useMemo(() => {
    const map = new Map<string, PermissionItem>();
    for (const p of permissions) {
      const key = `${p.module.toUpperCase()}:${p.action.toUpperCase()}`;
      map.set(key, p);
    }
    return map;
  }, [permissions]);

  // Set of actively granted permission IDs for the selected role
  const grantedPermissionIds = useMemo(() => {
    const set = new Set<string>();
    for (const rp of rolePermissions) {
      if (rp.isAllowed) {
        const permId =
          typeof rp.permissionId === "object"
            ? (rp.permissionId as any).id || (rp.permissionId as any)._id
            : rp.permissionId;
        if (permId) set.add(permId);
      }
    }
    return set;
  }, [rolePermissions]);

  // Handle cell click / toggle
  const handleTogglePermission = async (perm: PermissionItem, isCurrentlyGranted: boolean) => {
    if (!activeRoleId) return;
    setTogglingPermissionId(perm.id);

    try {
      if (isCurrentlyGranted) {
        // Revoke
        await revokeRolePermission({
          roleId: activeRoleId,
          permissionId: perm.id,
          institutionId: selectedInstitutionId || null,
        }).unwrap();

        toast({
          type: "info",
          title: "Permission Revoked",
          description: `Revoked "${perm.name}" from ${activeRole?.displayName || "role"}.`,
        });
      } else {
        // Assign
        await assignRolePermission({
          roleId: activeRoleId,
          permissionId: perm.id,
          institutionId: selectedInstitutionId || null,
          isAllowed: true,
        }).unwrap();

        toast({
          type: "success",
          title: "Permission Assigned",
          description: `Granted "${perm.name}" to ${activeRole?.displayName || "role"}.`,
        });
      }
    } catch (err: any) {
      toast({
        type: "error",
        title: "Permission Change Failed",
        description:
          err?.data?.message || err?.message || "Could not update role permission mapping.",
      });
    } finally {
      setTogglingPermissionId(null);
    }
  };

  return (
    <RoleProtectedLayout allowedRoles={["SUPER_ADMIN"]}>
      <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-handwriting">
                Roles & Permission Matrix
              </h1>
              <DoodleSpark className="h-5 w-5 text-sky-400 hidden sm:inline" />
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Super Admin authorization matrix: Configure fine-grained access policies across all 10 system modules.
            </p>
          </div>

          {/* Scope Selector (System Policy vs Institution Override) */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#141824] border border-slate-200 dark:border-slate-800 shadow-xs text-xs text-slate-600 dark:text-slate-300">
              <Building2 className="h-4 w-4 text-slate-400" />
              <span className="font-semibold text-slate-700 dark:text-slate-200">Policy Scope:</span>
              <select
                value={selectedInstitutionId}
                onChange={(e) => setSelectedInstitutionId(e.target.value)}
                className="bg-transparent font-medium text-slate-900 dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="">Platform System-Level Defaults (Global)</option>
                {institutions.map((inst: any) => (
                  <option key={inst.id || inst._id} value={inst.id || inst._id}>
                    Override: {inst.name} ({inst.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Roles Selector Cards (List & Metadata Edit) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Sliders className="h-4 w-4" />
              <span>System Role Hierarchy ({roles.length} Roles)</span>
            </h2>
            <span className="text-xs text-slate-400">
              Select a role below to inspect and modify its permission matrix
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {isRolesLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-white dark:bg-[#141824] border border-slate-200 dark:border-slate-800 animate-pulse space-y-3"
                  >
                    <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
                  </div>
                ))
              : roles.map((role) => {
                  const isSelected = role.id === activeRoleId;

                  return (
                    <div
                      key={role.id}
                      onClick={() => setSelectedRoleId(role.id)}
                      className={`relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer text-left ${
                        isSelected
                          ? "bg-white dark:bg-[#141824] border-sky-500 shadow-md ring-2 ring-sky-500/20"
                          : "bg-white/80 dark:bg-[#141824]/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 font-handwriting text-lg">
                            <span>{role.displayName}</span>
                            {isSelected && (
                              <CheckCircle2 className="h-4 w-4 text-sky-500 shrink-0" />
                            )}
                          </div>
                          <div className="text-xs font-mono text-slate-400 mt-0.5">
                            {role.name}
                          </div>
                        </div>

                        {/* Edit Role Metadata Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditRole(role);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/50 transition-colors"
                          title="Edit role metadata"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      </div>

                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[32px]">
                        {role.description || "System security role"}
                      </p>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                        <Badge variant="outline" className="text-[10px] font-mono">
                          Level {role.level}
                        </Badge>
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                            role.isActive ? "text-emerald-600" : "text-slate-400"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              role.isActive ? "bg-emerald-500" : "bg-slate-400"
                            }`}
                          />
                          {role.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>

        {/* Permission Matrix Section */}
        {activeRole && (
          <div className="rounded-2xl bg-white dark:bg-[#141824] border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Matrix Header */}
            <div className="p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white font-handwriting flex items-center gap-2">
                    <span>Permission Matrix for</span>
                    <Badge className="bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-300">
                      {activeRole.displayName}
                    </Badge>
                  </h3>
                  {isRolePermissionsFetching && (
                    <RefreshCw className="h-3.5 w-3.5 text-sky-500 animate-spin" />
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click any cell in the 10x5 grid to toggle permission assignment for this role.
                  {selectedInstitutionId
                    ? " (Applying tenant-specific overrides for selected institution)"
                    : " (Applying system-wide default role policy)"}
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <span className="h-3 w-3 rounded bg-emerald-500 inline-block shadow-xs" />
                  <span>Granted ({grantedPermissionIds.size})</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="h-3 w-3 rounded bg-slate-200 dark:bg-slate-700 inline-block" />
                  <span>Revoked</span>
                </div>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-100/70 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
                    <th className="px-5 py-3.5 min-w-[200px]">
                      Module Scope (10 Modules)
                    </th>
                    {ACTIONS.map((action) => (
                      <th
                        key={action.key}
                        className={`px-4 py-3.5 text-center min-w-[110px] ${action.color}`}
                      >
                        {action.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {isPermissionsLoading || isRolePermissionsLoading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-5 py-3.5">
                          <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
                        </td>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <td key={j} className="px-4 py-3.5 text-center">
                            <div className="h-6 w-6 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    MODULES.map((module) => (
                      <tr
                        key={module.key}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors"
                      >
                        {/* Module Info */}
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {module.label}
                          </div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">
                            {module.desc}
                          </div>
                        </td>

                        {/* Actions Matrix Cells */}
                        {ACTIONS.map((action) => {
                          const catalogKey = `${module.key}:${action.key}`;
                          const perm = permissionCatalogMap.get(catalogKey);

                          if (!perm) {
                            return (
                              <td
                                key={action.key}
                                className="px-4 py-3.5 text-center text-slate-300 dark:text-slate-700 text-xs"
                              >
                                —
                              </td>
                            );
                          }

                          const isGranted = grantedPermissionIds.has(perm.id);
                          const isToggling = togglingPermissionId === perm.id;

                          return (
                            <td key={action.key} className="px-4 py-3.5 text-center">
                              <button
                                type="button"
                                disabled={isToggling}
                                onClick={() => handleTogglePermission(perm, isGranted)}
                                className={`inline-flex items-center justify-center h-8 w-8 rounded-xl font-bold transition-all duration-150 transform active:scale-90 ${
                                  isGranted
                                    ? "bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 ring-2 ring-emerald-500/20"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                                } ${isToggling ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
                                title={`${perm.name}: ${perm.description || "Toggle permission"}`}
                              >
                                {isToggling ? (
                                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                ) : isGranted ? (
                                  <Check className="h-4 w-4 stroke-[3]" />
                                ) : (
                                  <X className="h-3.5 w-3.5 stroke-[2]" />
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Matrix Footer Note */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Info className="h-4 w-4 text-sky-500 shrink-0" />
                <span>
                  Role permission changes are applied immediately in the server security layer and invalidate permission caches across all sessions.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* EDIT ROLE METADATA MODAL */}
        {/* ==================================================================== */}
        {editingRole && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#141824] p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white font-handwriting">
                      Edit Role Metadata
                    </h3>
                    <p className="text-xs text-slate-500">
                      Update display name, description, and active status.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingRole(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Immutable System Properties Info */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">System Role Identifier:</span>
                  <Badge variant="outline" className="font-mono text-[11px]">
                    {editingRole.name}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Hierarchy Level:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Level {editingRole.level} (Immutable)
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 pt-1">
                  Note: Role identifier name and level are system-critical and protected from modification.
                </p>
              </div>

              <form onSubmit={handleSubmit(handleUpdateRoleSubmit)} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Display Name *
                  </label>
                  <Input {...register("displayName")} className="rounded-xl" />
                  {errors.displayName && (
                    <p className="text-[11px] text-red-500 mt-1">{errors.displayName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Description *
                  </label>
                  <textarea
                    rows={3}
                    {...register("description")}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
                  />
                  {errors.description && (
                    <p className="text-[11px] text-red-500 mt-1">{errors.description.message}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    {...register("isActive")}
                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <label
                    htmlFor="isActive"
                    className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Role is operational & active
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingRole(null)}
                    disabled={isUpdatingRole}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={isUpdatingRole}
                    className="rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold"
                  >
                    Save Metadata
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

