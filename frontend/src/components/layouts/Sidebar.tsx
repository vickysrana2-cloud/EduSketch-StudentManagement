"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  Award,
  FileSpreadsheet,
  Settings,
  Building2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleSidebar, setMobileSidebarOpen } from "@/store/slices/uiSlice";
import { logout } from "@/store/slices/authSlice";
import { useLogoutMutation } from "@/store/api/authApi";
import { clearAccessToken } from "@/lib/auth-session";
import { useToast } from "@/components/ui/toast";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
  color: string;
  bgColor: string;
  borderColor: string;
}

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
    roles: ["SUPER_ADMIN", "ADMIN", "TEACHER", "STUDENT"],
    color: "#4D9FFF",
    bgColor: "#EAF6FF",
    borderColor: "#8DD8FF",
  },
  {
    name: "Institutions",
    href: "/super-admin/institutions",
    icon: <Building2 className="h-5 w-5" />,
    roles: ["SUPER_ADMIN"],
    color: "#8B6DFF",
    bgColor: "#F4EEFF",
    borderColor: "#C5A7FF",
  },
  {
    name: "Students",
    href: "/students",
    icon: <Users className="h-5 w-5" />,
    roles: ["SUPER_ADMIN", "ADMIN", "TEACHER"],
    color: "#FF6FAE",
    bgColor: "#FFF0F6",
    borderColor: "#FFB3D1",
  },
  {
    name: "Teachers",
    href: "/teachers",
    icon: <GraduationCap className="h-5 w-5" />,
    roles: ["SUPER_ADMIN", "ADMIN"],
    color: "#8B6DFF",
    bgColor: "#F4EEFF",
    borderColor: "#C5A7FF",
  },
  {
    name: "Academics",
    href: "/academics",
    icon: <BookOpen className="h-5 w-5" />,
    roles: ["SUPER_ADMIN", "ADMIN", "TEACHER"],
    color: "#FFC83D",
    bgColor: "#FFFBE5",
    borderColor: "#FFE27A",
  },
  {
    name: "Attendance",
    href: "/attendance",
    icon: <CalendarCheck className="h-5 w-5" />,
    roles: ["SUPER_ADMIN", "ADMIN", "TEACHER", "STUDENT"],
    color: "#48C78E",
    bgColor: "#EFFFF7",
    borderColor: "#8DE5C1",
  },
  {
    name: "Examinations",
    href: "/examinations",
    icon: <ClipboardList className="h-5 w-5" />,
    roles: ["SUPER_ADMIN", "ADMIN", "TEACHER", "STUDENT"],
    color: "#FF8066",
    bgColor: "#FFF1E8",
    borderColor: "#FFC49B",
  },
  {
    name: "Results",
    href: "/results",
    icon: <Award className="h-5 w-5" />,
    roles: ["SUPER_ADMIN", "ADMIN", "TEACHER", "STUDENT"],
    color: "#36CFC9",
    bgColor: "#EAF6FF",
    borderColor: "#86E8E0",
  },
  {
    name: "Reports",
    href: "/reports",
    icon: <FileSpreadsheet className="h-5 w-5" />,
    roles: ["SUPER_ADMIN", "ADMIN"],
    color: "#FF9F43",
    bgColor: "#FFFBE5",
    borderColor: "#FFE27A",
  },
  {
    name: "Settings",
    href: "/settings",
    icon: <Settings className="h-5 w-5" />,
    roles: ["SUPER_ADMIN", "ADMIN", "TEACHER", "STUDENT"],
    color: "#8B6DFF",
    bgColor: "#F4EEFF",
    borderColor: "#C5A7FF",
  },
];

export function Sidebar() {
  const currentPathname = usePathname() || "";
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { isMobileSidebarOpen } = useAppSelector((state) => state.ui);
  const [logoutMutation, { isLoading: isLoggingOut }] = useLogoutMutation();
  const { toast } = useToast();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleConfirmLogout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch {
      // Proceed with local logout regardless of network error
    } finally {
      clearAccessToken();
      dispatch(logout());
      dispatch(setMobileSidebarOpen(false));
      setIsLogoutModalOpen(false);
      toast({
        type: "info",
        title: "Signed Out",
        description: "Your session has ended safely.",
      });
      router.push("/login");
    }
  };

  const [isHovered, setIsHovered] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 120);
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const userRole = user?.role || "ADMIN";
  const filteredNav = navItems.filter((item) => item.roles.includes(userRole));

  const renderNavList = (isExpanded: boolean) => (
    <nav className="space-y-3 py-4 px-1.5">
      {filteredNav.map((item) => {
        const isActive =
          currentPathname === item.href ||
          (item.href !== "/dashboard" && currentPathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => dispatch(setMobileSidebarOpen(false))}
            className={`group flex items-center ${
              isExpanded ? "gap-3.5 px-4" : "justify-center px-0"
            } py-3 rounded-2xl font-bold text-sm transition-all duration-200 sketch-shadow-sm ${
              isActive
                ? "text-white dark:text-slate-900 shadow-[0_4px_12px_rgba(0,0,0,0.15)] scale-[1.02]"
                : "bg-white text-slate-700 hover:bg-slate-50 dark:bg-[#141824] dark:text-slate-200"
            }`}
            style={{
              backgroundColor: isActive ? item.color : undefined,
            }}
            title={!isExpanded ? item.name : undefined}
          >
            <span
              className="shrink-0 transition-transform duration-200 group-hover:scale-110"
              style={{ color: isActive ? "#FFFFFF" : item.color }}
            >
              {item.icon}
            </span>
            <span
              className={`font-handwriting text-base tracking-tight whitespace-nowrap overflow-hidden transition-all duration-200 ${
                isExpanded ? "opacity-100 max-w-xs" : "opacity-0 max-w-0 pointer-events-none"
              }`}
            >
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => dispatch(setMobileSidebarOpen(false))}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Desktop Sidebar with Hover to Open / Remove Arrow to Collapse */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`hidden lg:flex flex-col sticky top-[65px] h-[calc(100vh-65px)] bg-[#FAF9F6] dark:bg-[#0B0E14] transition-all duration-300 ease-in-out z-20 ${
          isHovered ? "w-72 px-5 shadow-xl" : "w-20 px-3 shadow-xs"
        }`}
      >
        <div
          className="flex-1 overflow-y-auto no-scrollbar pt-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {renderNavList(isHovered)}
        </div>

        {/* Footer Sign Out Button */}
        <div className="py-4 space-y-2">
          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className={`w-full flex items-center ${
              isHovered ? "justify-start gap-3 px-4" : "justify-center px-0"
            } py-2.5 rounded-xl bg-[#FFF1E8] dark:bg-[#3A1F1B] text-[#FF8066] hover:bg-[#FF8066] hover:text-white transition-all duration-200 sketch-shadow-sm text-xs font-bold font-handwriting`}
            title="Sign Out"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span
              className={`whitespace-nowrap overflow-hidden transition-all duration-200 ${
                isHovered ? "opacity-100 max-w-xs" : "opacity-0 max-w-0"
              }`}
            >
              Sign Out
            </span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#FAF9F6] dark:bg-[#0B0E14] shadow-2xl p-6 flex flex-col justify-between transform transition-transform duration-300 lg:hidden ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div
          className="overflow-y-auto no-scrollbar"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="flex items-center justify-between pb-4">
            <span className="font-handwriting text-2xl font-bold text-slate-900 dark:text-slate-100">
              Navigation Menu
            </span>
            <button
              onClick={() => dispatch(setMobileSidebarOpen(false))}
              className="p-2 rounded-xl text-[#4D9FFF] hover:bg-[#EAF6FF]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {renderNavList(true)}
        </div>

        <div className="pt-4">
          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#FF8066] text-white font-bold text-sm sketch-shadow-sm hover:bg-[#E66B51] transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        title="Sign Out"
        description="Are you sure you want to end your active session on this device? Your refresh token will be revoked on the server."
        confirmText="Yes, Sign Out"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isLoggingOut}
      />
    </>
  );
}

