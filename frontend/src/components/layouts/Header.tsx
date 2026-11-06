"use client";

import React from "react";
import { Search, Bell, Sun, Moon, Menu, GraduationCap } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleMobileSidebar, toggleTheme } from "@/store/slices/uiSlice";
import { DoodleSpark } from "@/components/ui/doodles";
import { UserProfileMenu } from "./UserProfileMenu";

export function Header() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { theme } = useAppSelector((state) => state.ui);

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-[#0B0E14]/95 backdrop-blur-md shadow-sm px-4 lg:px-8 py-3.5 transition-all duration-300">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch(toggleMobileSidebar())}
            className="lg:hidden p-2 rounded-xl bg-[#EAF6FF] dark:bg-[#112338] text-[#4D9FFF] hover:bg-[#8DD8FF]/20 transition-all duration-200 sketch-shadow-sm active:translate-y-0.5"
            aria-label="Toggle Navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-[#4D9FFF] text-white flex items-center justify-center sketch-shadow-sm rotate-sketch-sm shadow-[0_4px_10px_rgba(77,159,255,0.35)]">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <span className="text-2xl font-bold font-handwriting tracking-wide text-slate-900 dark:text-slate-100 flex items-center gap-1">
                EduSketch <DoodleSpark className="h-4 w-4 text-[#FF6FAE] inline-block" />
              </span>
              <span className="hidden sm:block text-[10px] uppercase font-bold tracking-widest text-[#8B6DFF] dark:text-[#C5A7FF]">
                Student Management
              </span>
            </div>
          </div>
        </div>

        {/* Middle: Search Input */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4D9FFF]" />
            <input
              type="text"
              placeholder="Search students, teachers, subjects..."
              className="w-full pl-10 pr-4 py-2 text-sm font-medium rounded-xl bg-[#EAF6FF]/50 dark:bg-[#112338]/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-[#141824] transition-all duration-200 sketch-shadow-sm"
            />
          </div>
        </div>

        {/* Right: Controls & Profile */}
        <div className="flex items-center gap-3">
          {/* Dark/Light Theme Switch */}
          <button
            onClick={() => dispatch(toggleTheme())}
            className="p-2.5 rounded-xl bg-[#FFFBE5] dark:bg-[#362E12] text-[#FFC83D] hover:scale-105 transition-all duration-200 sketch-shadow-sm active:scale-95"
            title="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-[#FFC83D]" />
            ) : (
              <Moon className="h-4 w-4 text-[#8B6DFF]" />
            )}
          </button>

          {/* Notifications */}
          <button className="relative p-2.5 rounded-xl bg-[#FFF0F6] dark:bg-[#361726] text-[#FF6FAE] hover:scale-105 transition-all duration-200 sketch-shadow-sm">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-[#FF6FAE] text-white ring-2 ring-white dark:ring-[#0B0E14] text-[10px] font-bold flex items-center justify-center shadow-xs">
              3
            </span>
          </button>

          {/* Interactive User Profile Dropdown & Session Controls */}
          <UserProfileMenu />
        </div>
      </div>
    </header>
  );
}

