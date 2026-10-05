"use client";

import React from "react";
import { Search, Bell, Sun, Moon, Menu, GraduationCap } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleMobileSidebar, toggleTheme } from "@/store/slices/uiSlice";
import { DoodleSpark } from "@/components/ui/doodles";

export function Header() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { theme } = useAppSelector((state) => state.ui);

  return (
    <header className="sticky top-0 z-30 w-full bg-white dark:bg-black border-b-[3px] border-black dark:border-white px-4 lg:px-8 py-3.5 transition-colors">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch(toggleMobileSidebar())}
            className="lg:hidden p-2 rounded-xl border-[3px] border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition sketch-shadow-sm active:translate-y-0.5"
            aria-label="Toggle Navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-black dark:bg-white text-white dark:text-black border-[3px] border-black dark:border-white flex items-center justify-center sketch-shadow-sm rotate-sketch-sm">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <span className="text-2xl font-bold font-handwriting tracking-wide text-black dark:text-white flex items-center gap-1">
                EduSketch <DoodleSpark className="h-4 w-4 text-black dark:text-white inline-block" />
              </span>
              <span className="hidden sm:block text-[10px] uppercase font-bold tracking-widest text-slate-700 dark:text-slate-300">
                Student Management
              </span>
            </div>
          </div>
        </div>

        {/* Middle: Search Input with 3px Hand-drawn border */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-700 dark:text-slate-300" />
            <input
              type="text"
              placeholder="Search students, teachers, subjects..."
              className="w-full pl-10 pr-4 py-2 text-sm font-medium rounded-xl border-[3px] border-black dark:border-white bg-white dark:bg-black text-black dark:text-white placeholder:text-slate-500 focus:outline-none sketch-shadow-sm"
            />
          </div>
        </div>

        {/* Right: Controls & Profile */}
        <div className="flex items-center gap-3">
          {/* Dark/Light Theme Switch */}
          <button
            onClick={() => dispatch(toggleTheme())}
            className="p-2.5 rounded-xl border-[3px] border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition sketch-shadow-sm active:scale-95"
            title="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-white" />
            ) : (
              <Moon className="h-4 w-4 text-black" />
            )}
          </button>

          {/* Notifications */}
          <button className="relative p-2.5 rounded-xl border-[3px] border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition sketch-shadow-sm">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-black dark:bg-white text-white dark:text-black border-2 border-white dark:border-black text-[10px] font-bold flex items-center justify-center">
              3
            </span>
          </button>

          {/* Profile Badge */}
          <div className="flex items-center gap-2.5 pl-3 border-l-[3px] border-black dark:border-white">
            <div className="h-9 w-9 rounded-full bg-black dark:bg-white text-white dark:text-black border-[3px] border-black dark:border-white flex items-center justify-center font-bold text-sm">
              {user?.name?.charAt(0) || "A"}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-black dark:text-white leading-tight">
                {user?.name || "Admin User"}
              </p>
              <p className="text-[10px] font-handwriting font-bold text-slate-700 dark:text-slate-300">
                {user?.role || "ADMIN"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
