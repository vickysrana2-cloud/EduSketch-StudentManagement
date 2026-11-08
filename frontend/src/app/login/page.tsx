"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  GraduationCap,
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Sparkles,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSession } from "@/store/slices/authSlice";
import { authService } from "@/services/auth.service";
import { ApiError } from "@/services/api";
import { toggleTheme } from "@/store/slices/uiSlice";
import { useToast } from "@/components/ui/toast";
import { Role, UserRole } from "@/types";
import { AuthInput } from "@/components/auth/AuthInput";
import { RoleSelector, ROLE_OPTIONS } from "@/components/auth/RoleSelector";
import { SocialLogin } from "@/components/auth/SocialLogin";
import { ForgotPasswordModal } from "@/components/auth/ForgotPasswordModal";
import { LegalModal } from "@/components/auth/LegalModal";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email address is required")
    .email("Please enter a valid email address (e.g. name@school.edu)"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "STUDENT", "TEACHER", "SUPER_ADMIN"]),
});

type LoginFormData = z.infer<typeof loginSchema>;

const DEMO_PRESETS: Record<
  Role,
  { name: string; email: string; defaultPassword: string }
> = {
  SUPER_ADMIN: {
    name: "Platform Director",
    email: "superadmin@gmail.com",
    defaultPassword: "superadmin123",
  },
  ADMIN: {
    name: "School Administrator",
    email: "admin@school.com",
    defaultPassword: "AdminPass@123",
  },
  TEACHER: {
    name: "Faculty Instructor",
    email: "teacher@school.com",
    defaultPassword: "TeacherPass@123",
  },
  STUDENT: {
    name: "Enrolled Student",
    email: "student@school.com",
    defaultPassword: "StudentPass@123",
  },
};

const ROLE_BUTTON_THEMES: Record<
  Role,
  {
    bgClass: string;
    hoverClass: string;
    shadowClass: string;
    brandBadgeClass: string;
  }
> = {
  ADMIN: {
    bgClass: "bg-blue-600 hover:bg-blue-700 text-white",
    hoverClass: "focus-visible:ring-blue-500/40",
    shadowClass: "shadow-blue-500/25",
    brandBadgeClass: "text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-900",
  },
  STUDENT: {
    bgClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
    hoverClass: "focus-visible:ring-emerald-500/40",
    shadowClass: "shadow-emerald-500/25",
    brandBadgeClass: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900",
  },
  TEACHER: {
    bgClass: "bg-violet-600 hover:bg-violet-700 text-white",
    hoverClass: "focus-visible:ring-violet-500/40",
    shadowClass: "shadow-violet-500/25",
    brandBadgeClass: "text-violet-600 bg-violet-50 dark:bg-violet-950/60 dark:text-violet-400 border-violet-200 dark:border-violet-900",
  },
  SUPER_ADMIN: {
    bgClass: "bg-amber-600 hover:bg-amber-700 text-white",
    hoverClass: "focus-visible:ring-amber-500/40",
    shadowClass: "shadow-amber-500/25",
    brandBadgeClass: "text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-900",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { theme } = useAppSelector((state) => state.ui);

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<"privacy" | "terms" | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema) as any,
    defaultValues: {
      email: DEMO_PRESETS.ADMIN.email,
      password: DEMO_PRESETS.ADMIN.defaultPassword,
      role: "ADMIN",
    },
  });

  const selectedRole = watch("role");
  const currentEmail = watch("email");
  const roleTheme = ROLE_BUTTON_THEMES[selectedRole] || ROLE_BUTTON_THEMES.ADMIN;

  const handleRoleChange = (newRole: Role) => {
    setValue("role", newRole);
    const preset = DEMO_PRESETS[newRole];
    if (preset) {
      setValue("email", preset.email);
      setValue("password", preset.defaultPassword);
    }
  };

  const handleGoogleSignIn = () => {
    toast({
      type: "info",
      title: "Google Authentication (UI Demo)",
      description: "Google OAuth sign-in integration is simulated for frontend preview.",
    });
  };

  const onSubmit = async (data: LoginFormData) => {
    // Prevent repeated concurrent submissions
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Connect using centralized Axios client
      const response = await authService.login({
        email: data.email.trim(),
        password: data.password,
        role: data.role as UserRole,
      });

      // Clear password field immediately after submission
      setValue("password", "");

      // Read authoritative user response from backend
      const verifiedUser = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: response.user.role,
        avatar: response.user.avatar,
        profileImage: (response.user as any).profileImage || response.user.avatar || null,
        institutionId: response.user.institutionId,
      };

      // Store access token in client memory and update auth state
      dispatch(
        setSession({
          user: verifiedUser,
          accessToken: response.accessToken,
        })
      );

      toast({
        type: "success",
        title: "Signed In Successfully",
        description: `Welcome back, ${response.user.name} (${response.user.role}).`,
      });

      // Redirect strictly according to verified role returned by backend
      switch (response.user.role) {
        case UserRole.SUPER_ADMIN:
          router.push("/super-admin/dashboard");
          break;
        case UserRole.ADMIN:
          router.push("/admin/dashboard");
          break;
        case UserRole.TEACHER:
          router.push("/teacher/dashboard");
          break;
        case UserRole.STUDENT:
          router.push("/student/dashboard");
          break;
        default:
          router.push("/dashboard");
      }
    } catch (err: unknown) {
      // Do not store passwords after failed submission
      setValue("password", "");

      let errorTitle = "Sign In Failed";
      let errorDescription = "An unexpected error occurred. Please try again.";

      if (err instanceof ApiError) {
        if (err.isNetworkError) {
          errorTitle = "Connection Error";
          errorDescription =
            "Unable to connect to the backend server. Please check your network connection.";
        } else if (err.isUnauthorized) {
          errorTitle = "Authentication Failed";
          errorDescription = err.message || "Invalid email or password.";
        } else if (err.isBadRequest || err.isUnprocessableEntity) {
          errorTitle = "Validation Error";
          errorDescription =
            err.formattedValidationErrors ||
            err.message ||
            "Please check your input details.";
        } else if (err.statusCode === 429) {
          errorTitle = "Rate Limit Exceeded";
          errorDescription =
            "Too many login attempts. Please wait a minute and try again.";
        } else {
          errorDescription = err.message;
        }
      } else if (err instanceof Error) {
        errorDescription = err.message;
      }

      toast({
        type: "error",
        title: errorTitle,
        description: errorDescription,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between relative selection:bg-blue-500/20 selection:text-blue-700 dark:selection:text-blue-300">
      {/* Background Decorative Mesh Glow */}
      <div
        className="fixed inset-0 pointer-events-none opacity-40 dark:opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(at 15% 15%, rgba(37, 99, 235, 0.15) 0px, transparent 50%), radial-gradient(at 85% 85%, rgba(124, 58, 237, 0.12) 0px, transparent 50%)",
        }}
      />

      {/* Top Header Bar */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              EduSketch
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                EMS
              </span>
            </span>
          </div>
        </div>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={() => dispatch(toggleTheme())}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 shadow-xs"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          aria-label="Toggle visual theme"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-slate-600" />
          )}
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12 relative z-10">
        <div className="w-full max-w-xl mx-auto">
          {/* Main SaaS Card */}
          <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl shadow-slate-200/40 dark:shadow-black/40 p-6 sm:p-9 space-y-7 transition-all duration-200">
            {/* Branding & Heading */}
            <div className="space-y-2 text-center">

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white pt-1">
                Welcome Back
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Sign in to access your education dashboard.
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-5">
              {/* Account Role Selector */}
              <RoleSelector
                value={selectedRole}
                onChange={handleRoleChange}
                disabled={isSubmitting}
              />

              {/* Email Address */}
              <AuthInput
                label="Email Address"
                type="email"
                placeholder="Enter your email address"
                icon={Mail}
                autoComplete="email"
                disabled={isSubmitting}
                {...register("email")}
                error={errors.email?.message}
              />

              {/* Password */}
              <AuthInput
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                icon={Lock}
                autoComplete="current-password"
                disabled={isSubmitting}
                {...register("password")}
                error={errors.password?.message}
                labelAction={
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors focus:outline-none focus:underline"
                  >
                    Forgot Password?
                  </button>
                }
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
              />

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isSubmitting}
                    className="h-4 w-4 rounded-md border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500/20 dark:bg-slate-800 transition"
                  />
                  <span>Remember me on this device</span>
                </label>

                <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  <span>Demo credentials filled</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "w-full h-11 px-6 rounded-xl text-sm font-semibold shadow-md transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed",
                  roleTheme.bgClass,
                  roleTheme.shadowClass,
                  roleTheme.hoverClass
                )}
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in to portal...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    <span>Sign In</span>
                  </>
                )}
              </button>

              {/* Social Login Divider & Button */}
              <SocialLogin
                onGoogleSignIn={handleGoogleSignIn}
                isLoading={isSubmitting}
              />
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-5 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2 relative z-10">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium">
          <button
            type="button"
            onClick={() => setLegalModalType("privacy")}
            className="hover:text-slate-900 dark:hover:text-slate-200 transition underline-offset-4 hover:underline"
          >
            Privacy Policy
          </button>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <button
            type="button"
            onClick={() => setLegalModalType("terms")}
            className="hover:text-slate-900 dark:hover:text-slate-200 transition underline-offset-4 hover:underline"
          >
            Terms of Service
          </button>
        </div>

        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          © {new Date().getFullYear()} EduSketch EMS. All rights reserved.
        </p>
      </footer>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        defaultEmail={currentEmail}
      />

      {/* Privacy / Terms Modal */}
      <LegalModal
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />
    </div>
  );
}
