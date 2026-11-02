"use client";

import React, { useState } from "react";
import { Settings, Save, Moon, Sun, Bell, School, User, Shield } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleTheme } from "@/store/slices/uiSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { DoodleSpark } from "@/components/ui/doodles";

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { user } = useAppSelector((state) => state.auth);
  const { theme } = useAppSelector((state) => state.ui);

  const [schoolName, setSchoolName] = useState("EduSketch Academy");
  const [academicYear, setAcademicYear] = useState("2026 - 2027");
  const [userName, setUserName] = useState(user?.name || "Admin User");
  const [userEmail, setUserEmail] = useState(user?.email || "admin@school.com");

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      type: "success",
      title: "Settings Saved",
      description: "System configurations updated successfully.",
    });
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 flex items-center gap-2">
            System Preferences <DoodleSpark className="h-6 w-6 text-[#8B6DFF]" />
          </h1>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
            Manage school organization details, user account settings, and interface theme
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* School Information Card */}
        <div className="rounded-3xl bg-[#F4EEFF] dark:bg-[#231B3C] p-8 sketch-shadow space-y-6">
          <div className="pb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold font-handwriting text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <School className="h-6 w-6 text-[#8B6DFF]" /> Organization Profile
            </h2>
            <Badge variant="purple">School Settings</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="School / Institution Name"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
            />
            <Input
              label="Active Academic Session"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
            />
          </div>
        </div>

        {/* User Account Settings */}
        <div className="rounded-3xl bg-[#EAF6FF] dark:bg-[#112338] p-8 sketch-shadow space-y-6">
          <div className="pb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold font-handwriting text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <User className="h-6 w-6 text-[#4D9FFF]" /> User Profile Credentials
            </h2>
            <Badge variant="blue">Role: {user?.role || "ADMIN"}</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Display Name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
            <Input
              label="Email Address"
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
            />
          </div>
        </div>

        {/* Appearance & Theme Card */}
        <div className="rounded-3xl bg-[#FFFBE5] dark:bg-[#362E12] p-8 sketch-shadow space-y-6">
          <div className="pb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold font-handwriting text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sun className="h-6 w-6 text-[#FFC83D]" /> Interface Theme Mode
            </h2>
            <Badge variant="yellow">Visual Theme</Badge>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-[#141824]">
            <div>
              <h4 className="text-lg font-bold font-handwriting text-slate-900 dark:text-slate-100">
                Current Theme: <span className="text-[#FFC83D] capitalize">{theme} Mode</span>
              </h4>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Switch between high contrast dark notebook mode and standard light paper mode.
              </p>
            </div>

            <Button
              type="button"
              variant="yellow"
              onClick={() => dispatch(toggleTheme())}
              className="font-handwriting text-sm gap-2"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} Switch Mode
            </Button>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" variant="purple" className="font-handwriting text-lg px-8 h-12 gap-2">
            <Save className="h-5 w-5" /> Save Preferences
          </Button>
        </div>
      </form>
    </div>
  );
}
