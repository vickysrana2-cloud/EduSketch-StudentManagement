/**
 * Mock Academic API Service
 * Provides mock data and simulated async operations for academic modules
 * that do not have dedicated backend controller endpoints in NestJS yet.
 * 
 * Included Modules:
 * 1. Attendance
 * 2. Examinations
 * 3. Marks Entry
 * 4. Academic Results & Transcripts
 * 5. Institutional Reports
 * 6. Student Fees Management
 */

// ============================================================================
// 1. ATTENDANCE MODULE
// ============================================================================

export interface MockAttendanceStudent {
  id: string;
  name: string;
  rollNumber: string;
  admissionNo: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
}

export interface MockAttendanceClass {
  classId: string;
  className: string;
  date: string;
  students: MockAttendanceStudent[];
}

export const INITIAL_MOCK_ATTENDANCE: MockAttendanceStudent[] = [
  { id: "std-001", name: "Aarav Sharma", rollNumber: "01", admissionNo: "ADM-2026-001", status: "PRESENT" },
  { id: "std-002", name: "Ananya Patel", rollNumber: "02", admissionNo: "ADM-2026-002", status: "PRESENT" },
  { id: "std-003", name: "Rohan Verma", rollNumber: "03", admissionNo: "ADM-2026-003", status: "LATE" },
  { id: "std-004", name: "Pooja Gupta", rollNumber: "04", admissionNo: "ADM-2026-004", status: "ABSENT" },
  { id: "std-005", name: "Kabir Mehta", rollNumber: "05", admissionNo: "ADM-2026-005", status: "PRESENT" },
  { id: "std-006", name: "Isha Nair", rollNumber: "06", admissionNo: "ADM-2026-006", status: "EXCUSED" },
  { id: "std-007", name: "Vikram Malhotra", rollNumber: "07", admissionNo: "ADM-2026-007", status: "PRESENT" },
  { id: "std-008", name: "Neha Joshi", rollNumber: "08", admissionNo: "ADM-2026-008", status: "PRESENT" },
];

// TODO: Replace with real backend API when endpoint is implemented (e.g. GET /api/attendance?classId=...&date=...)
export async function getAttendanceByClassAndDate(
  classId: string,
  date: string
): Promise<MockAttendanceStudent[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return INITIAL_MOCK_ATTENDANCE;
}

// TODO: Replace with real backend API when endpoint is implemented (e.g. POST /api/attendance)
export async function saveAttendanceRecords(payload: {
  classId: string;
  date: string;
  records: { studentId: string; status: string }[];
}): Promise<{ success: boolean; message: string; savedCount: number }> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    success: true,
    message: `Attendance marked successfully for ${payload.records.length} students.`,
    savedCount: payload.records.length,
  };
}

// ============================================================================
// 2. EXAMINATIONS MODULE
// ============================================================================

export interface MockExam {
  id: string;
  name: string;
  academicSession: string;
  startDate: string;
  endDate: string;
  status: "UPCOMING" | "ONGOING" | "COMPLETED";
  totalClasses: number;
}

export const INITIAL_MOCK_EXAMS: MockExam[] = [
  {
    id: "ex-01",
    name: "Mid-Term Examinations 2026",
    academicSession: "2026-2027",
    startDate: "2026-10-15",
    endDate: "2026-10-25",
    status: "ONGOING",
    totalClasses: 8,
  },
  {
    id: "ex-02",
    name: "Annual Finals Evaluation 2027",
    academicSession: "2026-2027",
    startDate: "2027-02-10",
    endDate: "2027-02-24",
    status: "UPCOMING",
    totalClasses: 12,
  },
  {
    id: "ex-03",
    name: "Term 1 Diagnostic Assessments",
    academicSession: "2026-2027",
    startDate: "2026-08-01",
    endDate: "2026-08-10",
    status: "COMPLETED",
    totalClasses: 6,
  },
];

// TODO: Replace with real backend API when endpoint is implemented (e.g. GET /api/examinations)
export async function getMockExaminations(): Promise<MockExam[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return INITIAL_MOCK_EXAMS;
}

// TODO: Replace with real backend API when endpoint is implemented (e.g. POST /api/examinations)
export async function createMockExamination(exam: Omit<MockExam, "id" | "totalClasses">): Promise<MockExam> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    id: `ex-${Date.now().toString().slice(-4)}`,
    ...exam,
    totalClasses: 6,
  };
}

// TODO: Replace with real backend API when endpoint is implemented (e.g. DELETE /api/examinations/:id)
export async function deleteMockExamination(id: string): Promise<{ success: boolean; message: string }> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return { success: true, message: "Examination session deleted successfully." };
}

// ============================================================================
// 3. MARKS MODULE
// ============================================================================

export interface MockStudentMarkEntry {
  studentId: string;
  studentName: string;
  rollNumber: string;
  subjectScores: { subjectName: string; marksObtained: number; maxMarks: number }[];
}

export const INITIAL_MOCK_MARKS: MockStudentMarkEntry[] = [
  {
    studentId: "std-001",
    studentName: "Aarav Sharma",
    rollNumber: "01",
    subjectScores: [
      { subjectName: "Mathematics", marksObtained: 94, maxMarks: 100 },
      { subjectName: "Physics", marksObtained: 88, maxMarks: 100 },
      { subjectName: "Chemistry", marksObtained: 91, maxMarks: 100 },
      { subjectName: "English Literature", marksObtained: 85, maxMarks: 100 },
    ],
  },
  {
    studentId: "std-002",
    studentName: "Ananya Patel",
    rollNumber: "02",
    subjectScores: [
      { subjectName: "Mathematics", marksObtained: 98, maxMarks: 100 },
      { subjectName: "Physics", marksObtained: 95, maxMarks: 100 },
      { subjectName: "Chemistry", marksObtained: 96, maxMarks: 100 },
      { subjectName: "English Literature", marksObtained: 92, maxMarks: 100 },
    ],
  },
  {
    studentId: "std-003",
    studentName: "Rohan Verma",
    rollNumber: "03",
    subjectScores: [
      { subjectName: "Mathematics", marksObtained: 76, maxMarks: 100 },
      { subjectName: "Physics", marksObtained: 80, maxMarks: 100 },
      { subjectName: "Chemistry", marksObtained: 72, maxMarks: 100 },
      { subjectName: "English Literature", marksObtained: 78, maxMarks: 100 },
    ],
  },
];

// TODO: Replace with real backend API when endpoint is implemented (e.g. GET /api/marks?examId=...&classId=...)
export async function getMockMarksByExamAndClass(
  examId: string,
  classId: string
): Promise<MockStudentMarkEntry[]> {
  await new Promise((resolve) => setTimeout(resolve, 350));
  return INITIAL_MOCK_MARKS;
}

// TODO: Replace with real backend API when endpoint is implemented (e.g. POST /api/marks)
export async function submitMockStudentMarks(payload: {
  examId: string;
  classId: string;
  marksData: MockStudentMarkEntry[];
}): Promise<{ success: boolean; message: string }> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return { success: true, message: "Student marks successfully recorded." };
}

// ============================================================================
// 4. RESULTS MODULE
// ============================================================================

export interface MockResultItem {
  id: string;
  studentName: string;
  rollNumber: string;
  className: string;
  totalMarksObtained: number;
  totalMaximumMarks: number;
  percentage: number;
  gpa: string;
  grade: "A+" | "A" | "B+" | "B" | "C" | "F";
  status: "PASSED" | "FAILED" | "DISTINCTION";
  rank: number;
}

export const INITIAL_MOCK_RESULTS: MockResultItem[] = [
  {
    id: "res-01",
    studentName: "Ananya Patel",
    rollNumber: "02",
    className: "Class 10-A",
    totalMarksObtained: 381,
    totalMaximumMarks: 400,
    percentage: 95.25,
    gpa: "4.0",
    grade: "A+",
    status: "DISTINCTION",
    rank: 1,
  },
  {
    id: "res-02",
    studentName: "Aarav Sharma",
    rollNumber: "01",
    className: "Class 10-A",
    totalMarksObtained: 358,
    totalMaximumMarks: 400,
    percentage: 89.5,
    gpa: "3.8",
    grade: "A",
    status: "PASSED",
    rank: 2,
  },
  {
    id: "res-03",
    studentName: "Kabir Mehta",
    rollNumber: "05",
    className: "Class 10-A",
    totalMarksObtained: 340,
    totalMaximumMarks: 400,
    percentage: 85.0,
    gpa: "3.6",
    grade: "A",
    status: "PASSED",
    rank: 3,
  },
  {
    id: "res-04",
    studentName: "Rohan Verma",
    rollNumber: "03",
    className: "Class 10-A",
    totalMarksObtained: 306,
    totalMaximumMarks: 400,
    percentage: 76.5,
    gpa: "3.2",
    grade: "B+",
    status: "PASSED",
    rank: 4,
  },
  {
    id: "res-05",
    studentName: "Pooja Gupta",
    rollNumber: "04",
    className: "Class 10-A",
    totalMarksObtained: 236,
    totalMaximumMarks: 400,
    percentage: 59.0,
    gpa: "2.4",
    grade: "C",
    status: "PASSED",
    rank: 5,
  },
];

// TODO: Replace with real backend API when endpoint is implemented (e.g. GET /api/results?examId=...&classId=...)
export async function getMockResults(filter?: {
  examId?: string;
  classId?: string;
}): Promise<MockResultItem[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return INITIAL_MOCK_RESULTS;
}

// TODO: Replace with real backend API when endpoint is implemented (e.g. GET /api/results/students/:studentId)
export async function getMockStudentReportCard(studentId: string): Promise<MockResultItem & {
  subjectBreakdown: { subject: string; score: number; max: number; grade: string }[];
  remarks: string;
}> {
  await new Promise((resolve) => setTimeout(resolve, 350));
  return {
    ...INITIAL_MOCK_RESULTS[0],
    subjectBreakdown: [
      { subject: "Mathematics", score: 98, max: 100, grade: "A+" },
      { subject: "Physics", score: 95, max: 100, grade: "A+" },
      { subject: "Chemistry", score: 96, max: 100, grade: "A+" },
      { subject: "English Literature", score: 92, max: 100, grade: "A" },
    ],
    remarks: "Exceptional academic performance and analytical grasp.",
  };
}

// ============================================================================
// 5. REPORTS MODULE
// ============================================================================

export interface MockReportType {
  id: string;
  title: string;
  description: string;
  format: string;
  category: "Academic" | "Attendance" | "Administrative" | "Financial";
  lastGenerated: string;
}

export const INITIAL_MOCK_REPORTS: MockReportType[] = [
  {
    id: "rep-01",
    title: "Comprehensive Student Enrollment Roster",
    description: "Full directory of enrolled students, age demographics, guardian emails, and active classes.",
    format: "CSV / Excel / PDF",
    category: "Administrative",
    lastGenerated: "2026-11-05",
  },
  {
    id: "rep-02",
    title: "Monthly Institutional Attendance Log",
    description: "Detailed daily attendance rates, absenteeism alerts, and monthly class attendance averages.",
    format: "Excel / PDF",
    category: "Attendance",
    lastGenerated: "2026-11-07",
  },
  {
    id: "rep-03",
    title: "Academic Examination Transcripts & Scorecards",
    description: "Subject score marksheets, GPA distributions, cohort ranks, and faculty assessment remarks.",
    format: "Official PDF Transcript",
    category: "Academic",
    lastGenerated: "2026-10-28",
  },
  {
    id: "rep-04",
    title: "Faculty Teaching Load & Course Distribution",
    description: "Teacher contacts, department allocations, class weekly lecture distribution, and subject assignments.",
    format: "PDF / CSV",
    category: "Administrative",
    lastGenerated: "2026-11-01",
  },
  {
    id: "rep-05",
    title: "Tuition Fee Collection & Dues Reconciliation",
    description: "Summary of paid tuition installments, overdue invoices, and online gateway receipts.",
    format: "Financial Excel / CSV",
    category: "Financial",
    lastGenerated: "2026-11-06",
  },
];

// TODO: Replace with real backend API when endpoint is implemented (e.g. GET /api/reports/catalog)
export async function getMockReportsCatalog(): Promise<MockReportType[]> {
  await new Promise((resolve) => setTimeout(resolve, 250));
  return INITIAL_MOCK_REPORTS;
}

// TODO: Replace with real backend API when endpoint is implemented (e.g. POST /api/reports/generate)
export async function generateMockReport(
  reportId: string,
  format: string
): Promise<{ success: boolean; downloadUrl: string; fileName: string }> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    success: true,
    downloadUrl: "#",
    fileName: `EduSketch-Report-${reportId}-${Date.now()}.${format.toLowerCase().includes("pdf") ? "pdf" : "csv"}`,
  };
}

// ============================================================================
// 6. FEES MODULE
// ============================================================================

export interface MockFeeInvoice {
  id: string;
  invoiceNo: string;
  studentName: string;
  rollNumber: string;
  className: string;
  title: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: "PAID" | "PENDING" | "OVERDUE";
  paymentMethod?: string;
  paidAt?: string;
}

export const INITIAL_MOCK_FEES: MockFeeInvoice[] = [
  {
    id: "inv-001",
    invoiceNo: "INV-2026-0891",
    studentName: "Aarav Sharma",
    rollNumber: "01",
    className: "Class 10-A",
    title: "Term 2 Tuition & Science Lab Fee",
    amount: 14500,
    paidAmount: 14500,
    dueDate: "2026-11-15",
    status: "PAID",
    paymentMethod: "UPI / Net Banking",
    paidAt: "2026-11-02",
  },
  {
    id: "inv-002",
    invoiceNo: "INV-2026-0892",
    studentName: "Ananya Patel",
    rollNumber: "02",
    className: "Class 10-A",
    title: "Term 2 Tuition & Science Lab Fee",
    amount: 14500,
    paidAmount: 14500,
    dueDate: "2026-11-15",
    status: "PAID",
    paymentMethod: "Credit Card",
    paidAt: "2026-11-04",
  },
  {
    id: "inv-003",
    invoiceNo: "INV-2026-0893",
    studentName: "Rohan Verma",
    rollNumber: "03",
    className: "Class 10-A",
    title: "Term 2 Tuition & Science Lab Fee",
    amount: 14500,
    paidAmount: 7000,
    dueDate: "2026-11-15",
    status: "PENDING",
  },
  {
    id: "inv-004",
    invoiceNo: "INV-2026-0894",
    studentName: "Pooja Gupta",
    rollNumber: "04",
    className: "Class 10-A",
    title: "Term 2 Tuition & Science Lab Fee",
    amount: 14500,
    paidAmount: 0,
    dueDate: "2026-10-31",
    status: "OVERDUE",
  },
  {
    id: "inv-005",
    invoiceNo: "INV-2026-0895",
    studentName: "Kabir Mehta",
    rollNumber: "05",
    className: "Class 10-A",
    title: "Term 2 Tuition & Science Lab Fee",
    amount: 14500,
    paidAmount: 14500,
    dueDate: "2026-11-15",
    status: "PAID",
    paymentMethod: "Bank Transfer",
    paidAt: "2026-11-05",
  },
];

// TODO: Replace with real backend API when endpoint is implemented (e.g. GET /api/fees)
export async function getMockFeeInvoices(): Promise<MockFeeInvoice[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return INITIAL_MOCK_FEES;
}

// TODO: Replace with real backend API when endpoint is implemented (e.g. POST /api/fees/collect)
export async function collectMockFeePayment(payload: {
  invoiceId: string;
  amount: number;
  paymentMethod: string;
}): Promise<{ success: boolean; receiptNumber: string }> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    success: true,
    receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
  };
}

