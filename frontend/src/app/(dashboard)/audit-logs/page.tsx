"use client";

import React, { useState } from "react";
import {
  FileText,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Shield,
  Building2,
  Globe,
  Monitor,
  Eye,
  X,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  AlertTriangle,
  Activity,
  Layers,
  ArrowRight,
} from "lucide-react";

import { RoleProtectedLayout } from "@/components/layouts/RoleProtectedLayout";
import {
  useGetAuditLogsQuery,
  useGetAuditLogByIdQuery,
  AuditLogItem,
} from "@/store/api/auditLogApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { DoodleSpark } from "@/components/ui/doodles";

const AUDIT_MODULES = [
  "ALL",
  "AUTH",
  "USERS",
  "ROLES",
  "PERMISSIONS",
  "INSTITUTIONS",
  "STUDENTS",
  "TEACHERS",
  "CLASSES",
  "SUBJECTS",
  "ATTENDANCE",
  "EXAMINATIONS",
  "RESULTS",
  "FEES",
] as const;

const AUDIT_ACTIONS = [
  "ALL",
  "LOGIN_SUCCESS",
  "LOGIN_FAILED",
  "LOGOUT",
  "LOGOUT_ALL",
  "USER_CREATED",
  "USER_UPDATED",
  "USER_SUSPENDED",
  "USER_DELETED",
  "ROLE_CHANGED",
  "PERMISSION_CHANGED",
  "INSTITUTION_CREATED",
  "INSTITUTION_UPDATED",
  "INSTITUTION_STATUS_CHANGED",
  "STUDENT_ADMITTED",
  "TEACHER_CREATED",
  "ENROLLMENT_CHANGED",
] as const;

export default function AuditLogsPage() {
  const { toast } = useToast();

  // Filters State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [selectedModule, setSelectedModule] = useState<string>("ALL");
  const [selectedAction, setSelectedAction] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  // Slide-over Drawer State
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [copiedMetadata, setCopiedMetadata] = useState(false);

  // ============================================================================
  // API Query
  // ============================================================================

  const {
    data: logsResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetAuditLogsQuery({
    page,
    limit,
    module: selectedModule !== "ALL" ? selectedModule : undefined,
    action: selectedAction !== "ALL" ? selectedAction : undefined,
    startDate: startDate ? new Date(startDate).toISOString() : undefined,
    endDate: endDate
      ? new Date(new Date(endDate).setHours(23, 59, 59, 999)).toISOString()
      : undefined,
    search: search.trim() || undefined,
  });

  const logs = logsResponse?.items || [];
  const total = logsResponse?.total || 0;
  const totalPages = Math.max(1, logsResponse?.totalPages || 1);

  const resetFilters = () => {
    setSelectedModule("ALL");
    setSelectedAction("ALL");
    setStartDate("");
    setEndDate("");
    setSearch("");
    setPage(1);
  };

  const handleCopyMetadata = (metadata: Record<string, any>) => {
    navigator.clipboard.writeText(JSON.stringify(metadata, null, 2));
    setCopiedMetadata(true);
    toast({
      type: "success",
      title: "Copied to Clipboard",
      description: "Audit log metadata copied as formatted JSON.",
    });
    setTimeout(() => setCopiedMetadata(false), 2000);
  };

  const getActionBadgeClass = (action: string) => {
    if (action.includes("SUCCESS") || action.includes("CREATED") || action.includes("ADMITTED")) {
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
    }
    if (action.includes("FAILED") || action.includes("DELETED") || action.includes("SUSPENDED")) {
      return "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-800";
    }
    if (action.includes("CHANGED") || action.includes("UPDATED")) {
      return "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800";
    }
    return "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800";
  };

  return (
    <RoleProtectedLayout allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
      <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                <Activity className="h-6 w-6" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-handwriting">
                Security & Audit Logs
              </h1>
              <DoodleSpark className="h-5 w-5 text-amber-400 hidden sm:inline" />
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Immutable chronological record of administrative actions, authentication events, and system changes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="rounded-xl flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filter Controls Card */}
        <div className="rounded-2xl bg-white dark:bg-[#141824] p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="relative lg:col-span-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search descriptions..."
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white placeholder-slate-400"
              />
            </div>

            {/* Module Filter */}
            <div>
              <select
                value={selectedModule}
                onChange={(e) => {
                  setSelectedModule(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
              >
                <option value="ALL">All Modules</option>
                {AUDIT_MODULES.filter((m) => m !== "ALL").map((mod) => (
                  <option key={mod} value={mod}>
                    {mod}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Filter */}
            <div>
              <select
                value={selectedAction}
                onChange={(e) => {
                  setSelectedAction(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
              >
                <option value="ALL">All Actions</option>
                {AUDIT_ACTIONS.filter((a) => a !== "ALL").map((act) => (
                  <option key={act} value={act}>
                    {act}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                title="Filter records from date"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
              />
            </div>

            {/* End Date */}
            <div>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                title="Filter records to date"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>
              Showing <strong className="text-slate-900 dark:text-white">{logs.length}</strong> of{" "}
              <strong className="text-slate-900 dark:text-white">{total}</strong> total audit records
            </span>
            <button
              onClick={resetFilters}
              className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <RotateCcw className="h-3 w-3" />
              Reset Filters
            </button>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="rounded-2xl bg-white dark:bg-[#141824] border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
                <tr>
                  <th scope="col" className="px-5 py-3.5">
                    Timestamp
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Actor
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Action
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Module
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Description
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    IP Address
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right">
                    Inspect
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-5 py-4">
                        <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center">
                      <div className="max-w-sm mx-auto space-y-3">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-500">
                          <Activity className="h-6 w-6" />
                        </div>
                        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                          No Audit Records
                        </h3>
                        <p className="text-xs text-slate-500">
                          No logs match your selected filter criteria. Try expanding the date range or clearing specific module/action filters.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resetFilters}
                          className="mt-2 text-xs"
                        >
                          Clear Filters
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                    >
                      {/* Timestamp */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-500">
                        <div className="font-medium text-slate-700 dark:text-slate-300">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(log.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </div>
                      </td>

                      {/* Actor */}
                      <td className="px-4 py-3.5">
                        {log.user ? (
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white text-xs">
                              {log.user.name}
                            </div>
                            <div className="text-[11px] text-slate-400">{log.user.email}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-mono italic">
                            System / Unauthenticated
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5">
                        <Badge className={`${getActionBadgeClass(log.action)} text-[11px]`}>
                          {log.action}
                        </Badge>
                      </td>

                      {/* Module */}
                      <td className="px-4 py-3.5">
                        <Badge variant="outline" className="text-[11px] font-mono">
                          {log.module}
                        </Badge>
                      </td>

                      {/* Description */}
                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="text-xs text-slate-700 dark:text-slate-300 truncate" title={log.description}>
                          {log.description}
                        </div>
                      </td>

                      {/* IP */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-xs font-mono text-slate-500">
                          {log.ipAddress || "—"}
                        </span>
                      </td>

                      {/* Detail Drawer Trigger */}
                      <td className="px-5 py-3.5 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                          className="h-8 px-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-amber-600 hover:border-amber-300 flex items-center gap-1 text-xs"
                          title="Inspect complete audit metadata"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Inspect</span>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-3.5 bg-slate-50/60 dark:bg-slate-900/50 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span>
                  Page <strong className="text-slate-800 dark:text-slate-200">{page}</strong> of{" "}
                  <strong className="text-slate-800 dark:text-slate-200">{totalPages}</strong>
                </span>

                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300"
                >
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                </select>
              </div>

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
        {/* DETAIL SLIDE-OVER DRAWER */}
        {/* ==================================================================== */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-xl h-full bg-white dark:bg-[#141824] shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-300">
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className={getActionBadgeClass(selectedLog.action)}>
                      {selectedLog.action}
                    </Badge>
                    <Badge variant="outline" className="font-mono text-xs">
                      {selectedLog.module}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white font-handwriting">
                    Audit Log Inspection
                  </h3>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{new Date(selectedLog.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Description Box */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Description
                  </h4>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {selectedLog.description}
                  </p>
                </div>

                {/* Actor & Entity Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Actor Box */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase">
                      <User className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Actor Details</span>
                    </div>
                    {selectedLog.user ? (
                      <div className="space-y-1 text-xs">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {selectedLog.user.name}
                        </div>
                        <div className="text-slate-500">{selectedLog.user.email}</div>
                        <div className="pt-1">
                          <Badge variant="outline" className="text-[10px]">
                            {selectedLog.user.role}
                          </Badge>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono pt-1">
                          User ID: {selectedLog.user.id}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic">System Automation / Guest</div>
                    )}
                  </div>

                  {/* Target Entity Box */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase">
                      <Layers className="h-3.5 w-3.5 text-sky-500" />
                      <span>Target Entity</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div>
                        <span className="text-slate-400">Target Type: </span>
                        <strong className="text-slate-800 dark:text-slate-200">
                          {selectedLog.targetType || "—"}
                        </strong>
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 break-all">
                        <span className="text-slate-400">Target ID: </span>
                        {selectedLog.targetId || "—"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Network & Device Info */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-500 uppercase">
                    <Globe className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Network & Request Origin</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-slate-400">Client IP Address:</span>
                      <div className="font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                        {selectedLog.ipAddress || "Not Recorded"}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400">Tenant Institution:</span>
                      <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                        {selectedLog.institution
                          ? `${selectedLog.institution.name} (${selectedLog.institution.code})`
                          : "Global / Platform"}
                      </div>
                    </div>
                  </div>

                  {selectedLog.userAgent && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400">User Agent:</span>
                      <div className="font-mono text-[11px] text-slate-600 dark:text-slate-300 mt-1 break-all bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg">
                        {selectedLog.userAgent}
                      </div>
                    </div>
                  )}
                </div>

                {/* Metadata JSON Box */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Event Metadata Payload
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyMetadata(selectedLog.metadata)}
                      className="h-7 px-2 text-xs flex items-center gap-1"
                    >
                      {copiedMetadata ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      <span>{copiedMetadata ? "Copied" : "Copy JSON"}</span>
                    </Button>
                  </div>

                  <pre className="p-4 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto max-h-72 border border-slate-800 shadow-inner">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setSelectedLog(null)}
                  className="rounded-xl text-xs"
                >
                  Close Inspection
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleProtectedLayout>
  );
}

