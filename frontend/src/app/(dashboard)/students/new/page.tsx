"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, UserPlus } from "lucide-react";

import { useCreateStudentMutation } from "@/store/api/studentApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { DoodleSpark } from "@/components/ui/doodles";

const studentSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  age: z.coerce.number().min(3, "Age must be at least 3 years").max(100, "Age must be realistic"),
});

type StudentFormData = z.infer<typeof studentSchema>;

export default function AddStudentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [createStudent, { isLoading }] = useCreateStudentMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema) as any,
    defaultValues: {
      name: "",
      email: "",
      age: 18,
    },
  });

  const onSubmit = async (data: StudentFormData) => {
    try {
      await createStudent(data).unwrap();
      toast({
        type: "success",
        title: "Student Created",
        description: `${data.name} has been added to the system successfully.`,
      });
      router.push("/students");
    } catch (err: any) {
      toast({
        type: "error",
        title: "Creation Failed",
        description:
          err?.data?.message || "Failed to create student. Please check input details.",
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/students"
          className="inline-flex items-center gap-2 text-sm font-bold text-black dark:text-white hover:underline transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Student Roster
        </Link>
      </div>

      {/* Sketch Card Form */}
      <div className="relative rounded-3xl border-[3px] border-black dark:border-white bg-white dark:bg-black p-8 sketch-shadow rotate-sketch-sm">
        <div className="tape-accent" />

        <div className="pb-6 border-b-[3px] border-black dark:border-white space-y-2">
          <h1 className="text-3xl font-extrabold font-handwriting text-black dark:text-white flex items-center gap-2">
            Enroll New Student <DoodleSpark className="h-6 w-6 text-black dark:text-white" />
          </h1>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Fill out personal & academic details to add a student to the database.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6 pt-6">
          <Input
            label="Full Name *"
            placeholder="e.g. Eleanor Vance"
            {...register("name")}
            error={errors.name?.message}
          />

          <Input
            label="Email Address *"
            type="email"
            placeholder="e.g. eleanor@school.edu"
            {...register("email")}
            error={errors.email?.message}
          />

          <Input
            label="Age (Years) *"
            type="number"
            placeholder="Enter age"
            {...register("age")}
            error={errors.age?.message}
          />

          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t-[3px] border-black dark:border-white">
            <Button
              type="submit"
              isLoading={isLoading}
              className="flex-1 font-handwriting text-lg h-12"
            >
              <UserPlus className="h-5 w-5 mr-2" /> Save & Enroll Student
            </Button>

            <Link href="/students" className="flex-1">
              <Button
                type="button"
                variant="outline"
                className="w-full font-handwriting text-lg h-12"
              >
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
