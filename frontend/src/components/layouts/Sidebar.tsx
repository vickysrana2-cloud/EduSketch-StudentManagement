"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleSidebar, setMobileSidebarOpen } from "@/store/slices/uiSlice";
import { logout } from "@/store/slices/authSlice";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
}

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
    roles: ["SUPER_ADMIN", "ADMIN", "TEACHER", "STUDENT"],
  },
  {
    name: "Students",
    href: "/students",
    icon: <Users className="h-5 w-5" />,
    roles: ["SUPER_ADMIN", "ADMIN", "TEACHER"],
  },
  {
    name: "Teachers",
    href: "/teachers",
    icon: <GraduationCap className="h-5 w-5" />,
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    name: "Academics",
    href: "/academics",
    icon: <BookOpen className="h-5 w-5" />,
    roles: ["SUPER_ADMIN", "ADMIN", "TEACHER"],
  },
  {
    name: "Attendance",
    href: "/attendance",
    icon: <CalendarCheck className="h-5 w-5" />,
    roles: ["SUPER_ADMIN", "ADMIN", "TEACHER", "STUDENT"],
  },
  {
    name: "Examinations",
    href: "/examinations",
    icon: <ClipboardList className="h-5 w-5" />,
    roles: ["SUPER_ADMIN", "ADMIN", "TEACHER", "STUDENT"],
  },
  {
    name: "Results",
    href: "/results",
    icon: <Award className="h-5 w-5" />,
    roles: ["SUPER_ADMIN", "ADMIN", "TEACHER", "STUDENT"],
  },
  {
    name: "Reports",
    href: "/reports",
    icon: <FileSpreadsheet className="h-5 w-5" />,
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    name: "Settings",
    href: "/settings",
    icon: <Settings className="h-5 w-5" />,
    roles: ["SUPER_ADMIN", "ADMIN", "TEACHER", "STUDENT"],
  },
];

export function Sidebar() {
  const currentPathname = usePathname() || "";
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { isSidebarCollapsed, isMobileSidebarOpen } = useAppSelector(
    (state) => state.ui
  );

  const userRole = user?.role || "ADMIN";
  const filteredNav = navItems.filter((item) => item.roles.includes(userRole));

  const renderNavList = () => (
    <nav className="space-y-2.5 py-4">
      {filteredNav.map((item) => {
        const isActive =
          currentPathname === item.href ||
          (item.href !== "/dashboard" && currentPathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => dispatch(setMobileSidebarOpen(false))}
            className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-200 border-[3px] ${
              isActive
                ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white sketch-shadow-sm"
                : "bg-white text-black dark:bg-black dark:text-white border-black dark:border-white hover:bg-slate-100 dark:hover:bg-slate-900 hover:rotate-sketch-sm"
            }`}
          >
            <span className="shrink-0">{item.icon}</span>
            {(!isSidebarCollapsed || isMobileSidebarOpen) && (
              <span className="font-handwriting text-base tracking-tight">{item.name}</span>
            )}
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
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col sticky top-[65px] h-[calc(100vh-65px)] bg-[#FAF9F6] dark:bg-[#090A0C] border-r-[3px] border-black dark:border-white transition-all duration-300 z-20 ${
          isSidebarCollapsed ? "w-20 px-3" : "w-64 px-4"
        }`}
      >
        <div className="flex-1 overflow-y-auto pt-4">{renderNavList()}</div>

        {/* Footer actions: Toggle collapse & Logout */}
        <div className="py-4 border-t-[3px] border-black dark:border-white space-y-2">
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-[3px] border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition sketch-shadow-sm text-xs font-bold font-handwriting"
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Collapse Menu</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#FAF9F6] dark:bg-[#090A0C] border-r-[3px] border-black dark:border-white p-6 flex flex-col justify-between transform transition-transform duration-300 lg:hidden ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          <div className="flex items-center justify-between pb-4 border-b-[3px] border-black dark:border-white">
            <span className="font-handwriting text-2xl font-bold text-black dark:text-white">
              Navigation Menu
            </span>
            <button
              onClick={() => dispatch(setMobileSidebarOpen(false))}
              className="p-2 rounded-xl border-[3px] border-black dark:border-white text-black dark:text-white hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {renderNavList()}
        </div>

        <div className="pt-4 border-t-[3px] border-black dark:border-white">
          <button
            onClick={() => dispatch(logout())}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-black text-white dark:bg-white dark:text-black border-[3px] border-black dark:border-white font-bold text-sm sketch-shadow-sm"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
