"use client";

import React from "react";
import { Shield, FileText, X } from "lucide-react";

interface LegalModalProps {
  type: "privacy" | "terms" | null;
  onClose: () => void;
}

export function LegalModal({ type, onClose }: LegalModalProps) {
  if (!type) return null;

  const isPrivacy = type === "privacy";
  const title = isPrivacy ? "Privacy Policy" : "Terms of Service";
  const Icon = isPrivacy ? Shield : FileText;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-4 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {title}
              </h3>
              <p className="text-[11px] text-slate-400">EduSketch EMS • Last updated 2026</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300 pr-1">
          {isPrivacy ? (
            <>
              <p>
                EduSketch EMS is committed to protecting student, faculty, and administrative information with the highest security standards.
              </p>
              <h4 className="font-semibold text-slate-900 dark:text-white pt-1">1. Information Collection</h4>
              <p>
                We collect personal information necessary for educational administration, including student enrollments, academic scores, attendance records, and faculty assignments.
              </p>
              <h4 className="font-semibold text-slate-900 dark:text-white pt-1">2. Data Security & Privacy</h4>
              <p>
                All student records and examination data are strictly partitioned by institutional tenancy. Data in transit and at rest is secured using industry-standard protocols.
              </p>
            </>
          ) : (
            <>
              <p>
                By accessing or using the EduSketch Education Management System, you agree to comply with our acceptable use policies and security guidelines.
              </p>
              <h4 className="font-semibold text-slate-900 dark:text-white pt-1">1. User Account Responsibilities</h4>
              <p>
                Users are responsible for maintaining the confidentiality of their credentials and all activities occurring under their allocated role (Admin, Teacher, Student, Super Admin).
              </p>
              <h4 className="font-semibold text-slate-900 dark:text-white pt-1">2. Acceptable Academic Conduct</h4>
              <p>
                Any unauthorized attempts to alter grades, attendance logs, or access administrative records outside your permissions are strictly prohibited.
              </p>
            </>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

