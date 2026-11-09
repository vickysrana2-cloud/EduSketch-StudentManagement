"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  User,
  ShieldCheck,
  Smartphone,
  Laptop,
  Globe,
  Clock,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Check,
  Lock,
  KeyRound,
  Sun,
  Moon,
  Building2,
  Mail,
  Shield,
  Trash2,
  RefreshCw,
  Info,
  Edit3,
  X,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleTheme, setTheme } from "@/store/slices/uiSlice";
import { logout, setUser } from "@/store/slices/authSlice";
import { clearAccessToken } from "@/lib/auth-session";
import {
  useGetCurrentUserQuery,
  useGetActiveSessionsQuery,
  useRevokeSessionMutation,
  useLogoutAllMutation,
  SessionItem,
} from "@/store/api/authApi";
import { useUpdateUserMutation } from "@/store/api/userApi";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useToast } from "@/components/ui/toast";
import { DoodleSpark } from "@/components/ui/doodles";

type SettingsTab = "profile" | "security" | "preferences";

export default function SettingsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { user: authUser } = useAppSelector((state) => state.auth);
  const { theme } = useAppSelector((state) => state.ui);

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  // Dialog States
  const [sessionToRevoke, setSessionToRevoke] = useState<SessionItem | null>(null);
  const [isLogoutAllDialogOpen, setIsLogoutAllDialogOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");

  // ============================================================================
  // API Queries & Mutations
  // ============================================================================

  const {
    data: userProfile,
    isLoading: isUserLoading,
    refetch: refetchCurrentUser,
  } = useGetCurrentUserQuery();
  const {
    data: sessionsData,
    isLoading: isSessionsLoading,
    isFetching: isSessionsFetching,
    refetch: refetchSessions,
  } = useGetActiveSessionsQuery();

  const [revokeSession, { isLoading: isRevokingSession }] = useRevokeSessionMutation();
  const [logoutAll, { isLoading: isLoggingOutAll }] = useLogoutAllMutation();
  const [updateUser, { isLoading: isUpdatingProfile }] = useUpdateUserMutation();

  const activeSessions = sessionsData?.sessions || [];
  const currentUserData = (userProfile || authUser) as any;

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleOpenEditProfile = () => {
    setEditName(currentUserData?.name || "");
    setEditAvatarUrl(currentUserData?.profileImage || "");
    setIsEditProfileOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = currentUserData?.id || currentUserData?._id;
    if (!userId) return;

    try {
      const cleanAvatar = editAvatarUrl.trim() || null;
      await updateUser({
        id: userId,
        name: editName.trim(),
        profileImage: cleanAvatar,
      }).unwrap();

      if (authUser) {
        dispatch(
          setUser({
            ...authUser,
            name: editName.trim(),
            profileImage: cleanAvatar,
            avatar: cleanAvatar,
          })
        );
      }

      refetchCurrentUser();

      toast({
        type: "success",
        title: "Profile Updated",
        description: "Your profile details and avatar image have been updated successfully.",
      });

      setIsEditProfileOpen(false);
    } catch (err: any) {
      toast({
        type: "error",
        title: "Update Failed",
        description: err?.data?.message || err?.message || "Could not update profile.",
      });
    }
  };

  const handleConfirmRevokeSession = async () => {
    if (!sessionToRevoke) return;
    try {
      await revokeSession(sessionToRevoke.id).unwrap();
      toast({
        type: "success",
        title: "Session Revoked",
        description: "The selected device session has been terminated successfully.",
      });
      setSessionToRevoke(null);
    } catch (err: any) {
      toast({
        type: "error",
        title: "Revoke Failed",
        description: err?.data?.message || err?.message || "Could not revoke session.",
      });
    }
  };

  const handleConfirmLogoutAll = async () => {
    try {
      await logoutAll().unwrap();
      clearAccessToken();
      dispatch(logout());
      toast({
        type: "info",
        title: "Logged Out Everywhere",
        description: "All active sessions have been terminated. Please log in again.",
      });
      setIsLogoutAllDialogOpen(false);
      router.push("/login");
    } catch (err: any) {
      toast({
        type: "error",
        title: "Logout All Failed",
        description: err?.data?.message || err?.message || "Could not terminate all sessions.",
      });
    }
  };

  const parseUserAgent = (ua: string) => {
    if (!ua) return "Unknown Device";
    if (ua.includes("Windows")) return "Windows PC";
    if (ua.includes("Macintosh") || ua.includes("Mac OS")) return "macOS Device";
    if (ua.includes("Linux")) return "Linux Device";
    if (ua.includes("Android")) return "Android Phone";
    if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS Device";
    return ua.substring(0, 32);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <Settings className="h-6 w-6" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-handwriting">
              Account & Security Settings
            </h1>
            <DoodleSpark className="h-5 w-5 text-purple-400 hidden sm:inline" />
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage your personal profile, active device sessions, and security configurations.
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === "profile"
            ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400"
            : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
        >
          <User className="h-4 w-4" />
          <span>Profile Overview</span>
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === "security"
            ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400"
            : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Security & Sessions</span>
          {activeSessions.length > 0 && (
            <Badge variant="outline" className="text-[10px] ml-1">
              {activeSessions.length}
            </Badge>
          )}
        </button>

        <button
          onClick={() => setActiveTab("preferences")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === "preferences"
            ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400"
            : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
        >
          <Sun className="h-4 w-4" />
          <span>Interface & Theme</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: PROFILE OVERVIEW */}
      {/* ==================================================================== */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          {/* Identity Card */}
          <div className="rounded-2xl bg-white dark:bg-[#141824] p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <UserAvatar
                  src={currentUserData?.profileImage || currentUserData?.avatar}
                  name={currentUserData?.name}
                  size="xl"
                  shape="rounded-2xl"
                  variant="purple"
                  className="shadow-sm ring-2 ring-purple-100 dark:ring-purple-950"
                />
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white font-handwriting">
                    {currentUserData?.name || "User"}
                  </h3>
                  <div className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Mail className="h-3.5 w-3.5" />
                    <span>{currentUserData?.email}</span>
                    {currentUserData?.isEmailVerified && (
                      <span title="Email Verified">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="purple" className="text-xs">
                      Role: {currentUserData?.role}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Status: {currentUserData?.status || "ACTIVE"}
                    </Badge>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenEditProfile}
                className="rounded-xl flex items-center gap-1.5 text-xs font-semibold self-start"
              >
                <Edit3 className="h-3.5 w-3.5 text-purple-600" />
                <span>Edit Profile</span>
              </Button>
            </div>

            {/* Read-only profile fields notice */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
              <Info className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Authoritative Profile:
                </span>{" "}
                Core security attributes such as assigned role, institution scope, and account operational status are managed centrally by administrative policy and cannot be altered here.
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Full Name</label>
                <Input
                  disabled
                  value={currentUserData?.name || ""}
                  className="rounded-xl bg-slate-50 dark:bg-slate-900 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Email Address</label>
                <Input
                  disabled
                  value={currentUserData?.email || ""}
                  className="rounded-xl bg-slate-50 dark:bg-slate-900 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Security Role</label>
                <Input
                  disabled
                  value={currentUserData?.role || ""}
                  className="rounded-xl bg-slate-50 dark:bg-slate-900 cursor-not-allowed font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Institution Scope</label>
                <Input
                  disabled
                  value={
                    currentUserData?.institution?.name
                      ? `${currentUserData.institution.name} (${currentUserData.institution.code})`
                      : "System-wide Platform Level"
                  }
                  className="rounded-xl bg-slate-50 dark:bg-slate-900 cursor-not-allowed text-xs"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-500">Profile Avatar URL</label>
                <Input
                  disabled
                  value={
                    currentUserData?.profileImage ||
                    "No avatar URL configured (default initials used)"
                  }
                  className="rounded-xl bg-slate-50 dark:bg-slate-900 cursor-not-allowed text-xs font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: SECURITY & SESSIONS */}
      {/* ==================================================================== */}
      {activeTab === "security" && (
        <div className="space-y-6">
          {/* Active Sessions Card */}
          <div className="rounded-2xl bg-white dark:bg-[#141824] p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-handwriting flex items-center gap-2">
                  <Laptop className="h-5 w-5 text-purple-600" />
                  <span>Active Device Sessions</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Manage active login sessions and JWT refresh tokens authenticated under your account.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchSessions()}
                  disabled={isSessionsFetching}
                  className="h-8 rounded-xl text-xs flex items-center gap-1"
                >
                  <RefreshCw className={`h-3 w-3 ${isSessionsFetching ? "animate-spin" : ""}`} />
                  Refresh
                </Button>

                {activeSessions.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsLogoutAllDialogOpen(true)}
                    className="h-8 rounded-xl text-xs flex items-center gap-1 font-bold"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Logout All Devices</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Sessions List */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {isSessionsLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="py-4 animate-pulse flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
                      <div className="h-3 w-60 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                    <div className="h-8 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                ))
              ) : activeSessions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No active sessions found.
                </div>
              ) : (
                activeSessions.map((session, idx) => {
                  const isCurrent = idx === 0; // The most recently active session

                  return (
                    <div
                      key={session.id}
                      className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                          <Laptop className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-slate-900 dark:text-white">
                              {parseUserAgent(session.userAgent)}
                            </span>
                            {isCurrent && (
                              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[10px]">
                                Current Session
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-mono">
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {session.ipAddress || "127.0.0.1"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Logged in: {new Date(session.createdAt).toLocaleDateString()}{" "}
                              {new Date(session.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-400">
                            Expires: {new Date(session.expiresAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSessionToRevoke(session)}
                          className="h-8 px-3 rounded-xl text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 border-red-200 dark:border-red-800 flex items-center gap-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Revoke</span>
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ================================================================== */}
          {/* PASSWORD CHANGE & RECOVERY (UI PLACEHOLDER WITH COMING SOON) */}
          {/* ================================================================== */}
          <div className="rounded-2xl bg-white dark:bg-[#141824] p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white font-handwriting flex items-center gap-2">
                    <KeyRound className="h-5 w-5 text-amber-500" />
                    <span>Password Management & Recovery</span>
                  </h3>
                  <Badge variant="yellow" className="text-[11px] font-bold">
                    Coming soon
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Self-service credential updates and password recovery options.
                </p>
              </div>
            </div>

            {/* Explanatory Banner */}
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Missing Self-Service Password Endpoints:</strong> Self-service password change (<code>POST /auth/change-password</code>) and password reset via email (<code>POST /auth/forgot-password</code>) are currently under development in the backend API. To update your password, please contact your institution administrator or super administrator.
              </div>
            </div>

            {/* Disabled Placeholder Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 opacity-60 pointer-events-none">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Current Password</label>
                <Input
                  type="password"
                  disabled
                  placeholder="••••••••••••"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">New Password</label>
                <Input
                  type="password"
                  disabled
                  placeholder="Min 8 characters"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Confirm Password</label>
                <Input
                  type="password"
                  disabled
                  placeholder="Repeat new password"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button disabled variant="outline" className="rounded-xl text-xs opacity-50">
                Update Password (Coming soon)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: INTERFACE & THEME */}
      {/* ==================================================================== */}
      {activeTab === "preferences" && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-white dark:bg-[#141824] p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white font-handwriting flex items-center gap-2">
                <Sun className="h-5 w-5 text-amber-500" />
                <span>Color Palette & Theme Mode</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Toggle between light paper mode and dark notebook palette across your entire dashboard.
              </p>
            </div>

            {/* Visual Theme Selection Cards - Fully Clickable */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Light Paper Option */}
              <button
                type="button"
                onClick={() => dispatch(setTheme("light"))}
                className={`text-left w-full rounded-2xl p-5 border-2 transition-all duration-200 flex flex-col justify-between space-y-3 cursor-pointer ${theme === "light"
                    ? "border-amber-400 dark:border-amber-400 bg-amber-50/70 dark:bg-amber-950/20 shadow-md ring-2 ring-amber-400/30 scale-[1.01]"
                    : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 bg-white dark:bg-[#141824] opacity-80 hover:opacity-100"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold shadow-xs">
                      <Sun className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Light Paper Mode</h4>
                      <p className="text-[11px] text-slate-500">Natural sketchbook style</p>
                    </div>
                  </div>
                  {theme === "light" ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-2.5 py-1 rounded-full border border-amber-300 dark:border-amber-700">
                      <Check className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /> Active
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-medium">Select</span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Warm natural paper background with sketchbook grid and high contrast ink tones.
                </p>
              </button>

              {/* Dark Notebook Option */}
              <button
                type="button"
                onClick={() => dispatch(setTheme("dark"))}
                className={`text-left w-full rounded-2xl p-5 border-2 transition-all duration-200 flex flex-col justify-between space-y-3 cursor-pointer ${theme === "dark"
                    ? "border-purple-500 dark:border-purple-500 bg-[#1F1934] dark:bg-[#1E1736] shadow-md ring-2 ring-purple-500/30 scale-[1.01]"
                    : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 bg-white dark:bg-[#141824] opacity-80 hover:opacity-100"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold shadow-xs border border-purple-200 dark:border-purple-800/60">
                      <Moon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">Dark Notebook Palette</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Midnight charcoal paper</p>
                    </div>
                  </div>
                  {theme === "dark" ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-purple-200 bg-purple-900/60 px-2.5 py-1 rounded-full border border-purple-500">
                      <Check className="h-3.5 w-3.5 text-purple-400" /> Active
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-medium">Select</span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Deep midnight slate palette with glowing neon accents and reduced eye strain.
                </p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* REVOKE SINGLE SESSION CONFIRMATION DIALOG */}
      {/* ==================================================================== */}
      <ConfirmationDialog
        isOpen={!!sessionToRevoke}
        onClose={() => setSessionToRevoke(null)}
        onConfirm={handleConfirmRevokeSession}
        title="Revoke Device Session"
        description={`Are you sure you want to revoke the session from "${sessionToRevoke ? parseUserAgent(sessionToRevoke.userAgent) : "device"}" (${sessionToRevoke?.ipAddress})? The device will be logged out immediately.`}
        confirmText="Yes, Revoke Session"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isRevokingSession}
      />

      {/* ==================================================================== */}
      {/* LOGOUT ALL DEVICES CONFIRMATION DIALOG */}
      {/* ==================================================================== */}
      <ConfirmationDialog
        isOpen={isLogoutAllDialogOpen}
        onClose={() => setIsLogoutAllDialogOpen(false)}
        onConfirm={handleConfirmLogoutAll}
        title="Logout From All Devices"
        description="Are you sure you want to terminate all active sessions across all devices? This will also end your current browser session and require you to log in again."
        confirmText="Yes, Logout All Devices"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isLoggingOutAll}
      />

      {/* ==================================================================== */}
      {/* EDIT PROFILE DETAILS MODAL */}
      {/* ==================================================================== */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#141824] p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-handwriting">
                    Edit Profile Details
                  </h3>
                  <p className="text-xs text-slate-500">
                    Update your display name and profile avatar image URL.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="rounded-xl"
                  placeholder="Your display name"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Profile Avatar URL (Optional)
                  </label>
                  {editAvatarUrl && (
                    <span className="text-[10px] text-slate-400 font-medium">Live Preview</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    value={editAvatarUrl}
                    onChange={(e) => setEditAvatarUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="rounded-xl flex-1 text-xs"
                  />
                  <UserAvatar
                    src={editAvatarUrl}
                    name={editName || currentUserData?.name}
                    size="md"
                    variant="purple"
                    className="border border-slate-200 dark:border-slate-700 ring-2 ring-purple-100 dark:ring-purple-950"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Paste any public image URL (JPG, PNG, WebP) to display as your avatar.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditProfileOpen(false)}
                  disabled={isUpdatingProfile}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isUpdatingProfile}
                  className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
