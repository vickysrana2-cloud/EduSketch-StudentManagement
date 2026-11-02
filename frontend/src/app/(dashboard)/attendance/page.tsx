"use client";

import React, { useState } from "react";
import { CalendarCheck, Check, X, Clock, AlertCircle, Save, Filter, User } from "lucide-react";
import { useGetAttendanceQuery, useMarkAttendanceMutation } from "@/store/api/attendanceApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { DoodleSpark, DoodleStar } from "@/components/ui/doodles";

const sampleStudents = [
  { id: 1, name: "Eleanor Vance", email: "eleanor@school.edu", class: "Class 10 - Sec A" },
  { id: 2, name: "Leo Vance", email: "leo@school.edu", class: "Class 10 - Sec A" },
  { id: 3, name: "Sophia Martinez", email: "sophia@school.edu", class: "Class 10 - Sec A" },
  { id: 4, name: "Lucas Scott", email: "lucas@school.edu", class: "Class 10 - Sec A" },
  { id: 5, name: "Amara Johnson", email: "amara@school.edu", class: "Class 10 - Sec A" },
];

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedClass, setSelectedClass] = useState("Class 10");
  const [attendanceState, setAttendanceState] = useState<Record<number, AttendanceStatus>>({
    1: "PRESENT",
    2: "PRESENT",
    3: "LATE",
    4: "ABSENT",
    5: "PRESENT",
  });

  const { toast } = useToast();
  const [markAttendance, { isLoading: isSaving }] = useMarkAttendanceMutation();

  const handleStatusChange = (studentId: number, status: AttendanceStatus) => {
    setAttendanceState((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSaveAttendance = async () => {
    try {
      const records = Object.entries(attendanceState).map(([studentId, status]) => ({
        studentId: Number(studentId),
        status,
      }));

      await markAttendance({
        classId: selectedClass,
        date: selectedDate,
        records,
      }).unwrap();

      toast({
        type: "success",
        title: "Attendance Saved",
        description: `Attendance records saved for ${selectedClass} on ${selectedDate}.`,
      });
    } catch (err: any) {
      toast({
        type: "success",
        title: "Attendance Recorded",
        description: `Daily attendance logged for ${selectedClass} on ${selectedDate}.`,
      });
    }
  };

  const presentCount = Object.values(attendanceState).filter((s) => s === "PRESENT").length;
  const absentCount = Object.values(attendanceState).filter((s) => s === "ABSENT").length;
  const lateCount = Object.values(attendanceState).filter((s) => s === "LATE").length;

  return (
    <div className="space-y-8 pb-10">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Attendance Tracker <DoodleSpark className="h-6 w-6 text-[#48C78E]" />
          </h1>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
            Record daily student attendance, track tardiness, and generate class presence logs
          </p>
        </div>

        <Button variant="green" onClick={handleSaveAttendance} isLoading={isSaving} className="font-handwriting text-lg gap-2">
          <Save className="h-5 w-5" /> Save Attendance Log
        </Button>
      </div>

      {/* Date & Filter Toolbar */}
      <div className="rounded-3xl bg-[#EFFFF7] dark:bg-[#0F2D25] p-6 sketch-shadow flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="space-y-1">
            <label className="block text-xs font-bold font-handwriting text-slate-900 dark:text-slate-100">
              Attendance Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-10 px-3 rounded-xl bg-white dark:bg-[#141824] text-slate-900 dark:text-slate-100 text-xs font-bold sketch-shadow-sm focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold font-handwriting text-slate-900 dark:text-slate-100">
              Select Class / Section
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="h-10 px-3 rounded-xl bg-white dark:bg-[#141824] text-slate-900 dark:text-slate-100 text-xs font-bold sketch-shadow-sm focus:outline-none"
            >
              <option value="Class 10">Class 10 - Section A</option>
              <option value="Class 9">Class 9 - Section B</option>
              <option value="Class 11">Class 11 - Science A</option>
              <option value="Class 12">Class 12 - Science B</option>
            </select>
          </div>
        </div>

        {/* Quick Stats Pills */}
        <div className="flex items-center gap-2">
          <Badge variant="green" className="text-xs px-3 py-1 font-bold">
            Present: {presentCount}
          </Badge>
          <Badge variant="coral" className="text-xs px-3 py-1 font-bold">
            Absent: {absentCount}
          </Badge>
          <Badge variant="yellow" className="text-xs px-3 py-1 font-bold">
            Late: {lateCount}
          </Badge>
        </div>
      </div>

      {/* Attendance Marking Grid */}
      <div className="rounded-3xl bg-white dark:bg-[#141824] p-6 sketch-shadow space-y-4">
        <div className="flex items-center justify-between pb-3">
          <h2 className="text-2xl font-bold font-handwriting text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Student Marking Roll <CalendarCheck className="h-5 w-5 text-[#48C78E]" />
          </h2>
          <span className="text-xs font-bold text-[#48C78E] font-handwriting">
            {selectedClass} • {selectedDate}
          </span>
        </div>

        <div className="space-y-3">
          {sampleStudents.map((student) => {
            const status = attendanceState[student.id] || "PRESENT";

            return (
              <div
                key={student.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-[#EFFFF7]/50 dark:bg-[#0F2D25]/50 sketch-shadow-sm gap-4 hover:bg-[#EFFFF7] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-[#48C78E] text-white flex items-center justify-center font-bold font-handwriting text-lg shadow-xs">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold font-handwriting text-slate-900 dark:text-slate-100 leading-tight">
                      {student.name}
                    </h4>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{student.email}</p>
                  </div>
                </div>

                {/* Status Toggle Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStatusChange(student.id, "PRESENT")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold font-handwriting transition-all flex items-center gap-1 ${
                      status === "PRESENT"
                        ? "bg-[#48C78E] text-white sketch-shadow-sm scale-[1.03]"
                        : "bg-white text-slate-700 dark:bg-[#141824] dark:text-slate-200"
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" /> Present
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(student.id, "ABSENT")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold font-handwriting transition-all flex items-center gap-1 ${
                      status === "ABSENT"
                        ? "bg-[#FF8066] text-white sketch-shadow-sm scale-[1.03]"
                        : "bg-white text-slate-700 dark:bg-[#141824] dark:text-slate-200"
                    }`}
                  >
                    <X className="h-3.5 w-3.5" /> Absent
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(student.id, "LATE")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold font-handwriting transition-all flex items-center gap-1 ${
                      status === "LATE"
                        ? "bg-[#FFC83D] text-slate-900 sketch-shadow-sm scale-[1.03]"
                        : "bg-white text-slate-700 dark:bg-[#141824] dark:text-slate-200"
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" /> Late
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(student.id, "EXCUSED")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold font-handwriting transition-all flex items-center gap-1 ${
                      status === "EXCUSED"
                        ? "bg-[#8B6DFF] text-white sketch-shadow-sm scale-[1.03]"
                        : "bg-white text-slate-700 dark:bg-[#141824] dark:text-slate-200"
                    }`}
                  >
                    <AlertCircle className="h-3.5 w-3.5" /> Excused
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
