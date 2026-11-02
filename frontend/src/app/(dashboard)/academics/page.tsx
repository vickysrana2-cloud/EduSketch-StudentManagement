"use client";

import React, { useState } from "react";
import { BookOpen, Plus, Calendar, Layers, Hash, CheckCircle2 } from "lucide-react";
import {
  useGetAcademicSessionsQuery,
  useGetClassesQuery,
  useGetSubjectsQuery,
  useCreateClassMutation,
  useCreateSubjectMutation,
} from "@/store/api/academicApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { DoodleSpark, DoodleStar } from "@/components/ui/doodles";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const classSchema = z.object({
  name: z.string().min(2, "Class name required (e.g. Grade 10)"),
  sections: z.string().min(1, "Sections required (comma separated, e.g. A, B, C)"),
});

const subjectSchema = z.object({
  name: z.string().min(2, "Subject name required"),
  code: z.string().min(2, "Subject code required (e.g. MATH-101)"),
});

type ClassFormData = z.infer<typeof classSchema>;
type SubjectFormData = z.infer<typeof subjectSchema>;

const mockSessions = [
  { id: 1, year: "2026 - 2027", isCurrent: true, status: "Active" },
  { id: 2, year: "2025 - 2026", isCurrent: false, status: "Completed" },
];

const mockClasses = [
  { id: 1, name: "Class 9", sections: ["Section A", "Section B", "Section C"] },
  { id: 2, name: "Class 10", sections: ["Section A", "Section B"] },
  { id: 3, name: "Class 11 - Science", sections: ["Section A", "Section B"] },
  { id: 4, name: "Class 12 - Science", sections: ["Section A"] },
];

const mockSubjects = [
  { id: 1, name: "Mathematics", code: "MATH-101", class: "Class 10" },
  { id: 2, name: "Physics Fundamentals", code: "PHYS-201", class: "Class 11" },
  { id: 3, name: "English Literature", code: "ENG-102", class: "Class 10" },
  { id: 4, name: "Chemistry Lab", code: "CHEM-202", class: "Class 11" },
  { id: 5, name: "Computer Science", code: "CS-301", class: "Class 12" },
];

export default function AcademicsPage() {
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);

  const { toast } = useToast();
  const { data: classesData, isLoading: isLoadingClasses } = useGetClassesQuery();
  const { data: subjectsData, isLoading: isLoadingSubjects } = useGetSubjectsQuery({});

  const [createClass, { isLoading: isCreatingClass }] = useCreateClassMutation();
  const [createSubject, { isLoading: isCreatingSubject }] = useCreateSubjectMutation();

  // Class Form
  const {
    register: registerClass,
    handleSubmit: handleSubmitClass,
    reset: resetClass,
    formState: { errors: classErrors },
  } = useForm<ClassFormData>({
    resolver: zodResolver(classSchema) as any,
  });

  // Subject Form
  const {
    register: registerSubject,
    handleSubmit: handleSubmitSubject,
    reset: resetSubject,
    formState: { errors: subjectErrors },
  } = useForm<SubjectFormData>({
    resolver: zodResolver(subjectSchema) as any,
  });

  const onSubmitClass = async (formData: ClassFormData) => {
    try {
      const sectionArray = formData.sections.split(",").map((s) => s.trim()).filter(Boolean);
      await createClass({ name: formData.name, sections: sectionArray }).unwrap();
      toast({
        type: "success",
        title: "Class Created",
        description: `${formData.name} added to academic structure.`,
      });
      resetClass();
      setIsAddClassOpen(false);
    } catch (err: any) {
      toast({
        type: "error",
        title: "Creation Failed",
        description: err?.data?.message || "Failed to add class.",
      });
    }
  };

  const onSubmitSubject = async (formData: SubjectFormData) => {
    try {
      await createSubject({ name: formData.name, code: formData.code }).unwrap();
      toast({
        type: "success",
        title: "Subject Created",
        description: `${formData.name} (${formData.code}) registered in syllabus.`,
      });
      resetSubject();
      setIsAddSubjectOpen(false);
    } catch (err: any) {
      toast({
        type: "error",
        title: "Creation Failed",
        description: err?.data?.message || "Failed to add subject.",
      });
    }
  };

  const classes = classesData?.data && classesData.data.length > 0 ? classesData.data : mockClasses;
  const subjects = subjectsData?.data && subjectsData.data.length > 0 ? subjectsData.data : mockSubjects;

  return (
    <div className="space-y-8 pb-10">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-handwriting text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Academic Management <DoodleSpark className="h-6 w-6 text-[#FFC83D]" />
          </h1>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
            Manage academic sessions, grade levels, class sections, and course curriculum
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="yellow" onClick={() => setIsAddClassOpen(true)} className="font-handwriting text-base gap-1.5">
            <Plus className="h-4 w-4" /> Add Class
          </Button>
          <Button variant="purple" onClick={() => setIsAddSubjectOpen(true)} className="font-handwriting text-base gap-1.5">
            <Plus className="h-4 w-4" /> Add Subject
          </Button>
        </div>
      </div>

      {/* Academic Sessions Overview */}
      <div className="rounded-3xl bg-[#FFFBE5] dark:bg-[#362E12] p-6 sketch-shadow space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold font-handwriting text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Academic Sessions <Calendar className="h-5 w-5 text-[#FF9F43]" />
          </h2>
          <Badge variant="yellow">Active Academic Year</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mockSessions.map((session) => (
            <div
              key={session.id}
              className={`p-4 rounded-2xl ${
                session.isCurrent
                  ? "bg-white dark:bg-[#141824] sketch-shadow-sm"
                  : "bg-white/50 dark:bg-black/40"
              } flex items-center justify-between`}
            >
              <div>
                <p className="text-lg font-bold font-handwriting text-slate-900 dark:text-slate-100">
                  {session.year}
                </p>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Status: <span className="text-[#FF9F43]">{session.status}</span>
                </p>
              </div>

              {session.isCurrent && (
                <div className="h-8 w-8 rounded-full bg-[#FFC83D] text-slate-900 flex items-center justify-center font-bold">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Classes & Sections Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold font-handwriting text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Classes & Sections Directory <Layers className="h-5 w-5 text-[#4D9FFF]" />
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {classes.map((c, idx) => (
            <div
              key={c.id || idx}
              className="rounded-3xl bg-[#EAF6FF] dark:bg-[#112338] p-6 sketch-shadow space-y-3 hover:-translate-y-1 transition-all duration-200"
            >
              <div className="flex items-center justify-between pb-2">
                <h3 className="text-xl font-bold font-handwriting text-slate-900 dark:text-slate-100">
                  {c.name}
                </h3>
                <Badge variant="blue">{c.sections?.length || 2} Sections</Badge>
              </div>

              <div className="space-y-1.5 pt-1">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Assigned Sections:</p>
                <div className="flex flex-wrap gap-1.5">
                  {c.sections?.map((sec: string, i: number) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#141824] text-xs font-bold font-handwriting text-[#4D9FFF]"
                    >
                      {sec}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Curriculum & Subjects */}
      <div className="rounded-3xl bg-[#F4EEFF] dark:bg-[#231B3C] p-6 sketch-shadow space-y-6">
        <div className="flex items-center justify-between pb-4">
          <div>
            <h2 className="text-2xl font-bold font-handwriting text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Subjects Directory <DoodleStar className="h-5 w-5 text-[#8B6DFF]" />
            </h2>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Registered academic subjects and examination course codes
            </p>
          </div>
          <Button variant="purple" size="sm" onClick={() => setIsAddSubjectOpen(true)}>
            + Add New Subject
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((sub, idx) => (
            <div
              key={sub.id || idx}
              className="p-4 rounded-2xl bg-white dark:bg-[#141824] sketch-shadow-sm flex items-center justify-between"
            >
              <div className="space-y-1">
                <h4 className="text-lg font-bold font-handwriting text-slate-900 dark:text-slate-100">
                  {sub.name}
                </h4>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <Hash className="h-3 w-3 text-[#8B6DFF]" /> Code: <span className="text-[#8B6DFF] font-extrabold">{sub.code}</span>
                </p>
              </div>
              <Badge variant="purple">{(sub as any).class || "All Classes"}</Badge>
            </div>
          ))}
        </div>
      </div>


      {/* Add Class Dialog */}
      {isAddClassOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-[#FFFBE5] dark:bg-[#362E12] p-8 sketch-shadow">
            <div className="tape-accent" />
            <h3 className="text-2xl font-bold font-handwriting text-slate-900 dark:text-slate-100 pb-4">
              Add New Academic Class
            </h3>
            <form onSubmit={handleSubmitClass(onSubmitClass as any)} className="space-y-4 pt-4">
              <Input label="Class Name *" placeholder="e.g. Class 11 - Commerce" {...registerClass("name")} error={classErrors.name?.message} />
              <Input label="Sections *" placeholder="e.g. A, B, C" {...registerClass("sections")} error={classErrors.sections?.message} />
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddClassOpen(false)}>Cancel</Button>
                <Button type="submit" variant="yellow" isLoading={isCreatingClass}>Create Class</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subject Dialog */}
      {isAddSubjectOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-[#F4EEFF] dark:bg-[#231B3C] p-8 sketch-shadow">
            <div className="tape-accent" />
            <h3 className="text-2xl font-bold font-handwriting text-slate-900 dark:text-slate-100 pb-4">
              Register New Subject
            </h3>
            <form onSubmit={handleSubmitSubject(onSubmitSubject as any)} className="space-y-4 pt-4">
              <Input label="Subject Name *" placeholder="e.g. Advanced Biology" {...registerSubject("name")} error={subjectErrors.name?.message} />
              <Input label="Course Code *" placeholder="e.g. BIO-301" {...registerSubject("code")} error={subjectErrors.code?.message} />
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddSubjectOpen(false)}>Cancel</Button>
                <Button type="submit" variant="purple" isLoading={isCreatingSubject}>Save Subject</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
