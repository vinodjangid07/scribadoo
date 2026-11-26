export interface BatchItem {
  id: string;
  name: string;
  subject: string | null;
  days: string[] | null;
  start_time: string | null;
  end_time: string | null;
  default_monthly_fee: number;
  student_count?: number;
}

export interface StudentItem {
  id: string;
  full_name: string;
  grade: string | null;
  parent_name: string | null;
  parent_phone: string;
  joined_date: string;
  notes: string | null;
  is_archived: boolean;
  enrollments?: Array<{
    batch_id: string;
    custom_fee: number | null;
    batch?: {
      id: string;
      name: string;
      default_monthly_fee: number;
    };
  }>;
}

export interface BatchEnrollmentInput {
  batchId: string;
  customFee?: number | null;
}

export interface BatchPayload {
  name: string;
  subject?: string;
  days: string[];
  startTime?: string;
  endTime?: string;
  defaultMonthlyFee: number;
}

export interface StudentPayload {
  fullName: string;
  grade?: string;
  parentName?: string;
  parentPhone: string;
  joinedDate?: string;
  notes?: string;
  enrollments: BatchEnrollmentInput[];
}

export type AttendanceStatus = "present" | "absent" | "late" | "holiday";

export interface AttendanceRecord {
  id: string;
  teacher_id: string;
  batch_id: string;
  student_id: string;
  date: string;
  status: AttendanceStatus;
  note?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface BatchAttendanceEntry {
  student_id: string;
  student_name: string;
  grade?: string | null;
  parent_name?: string | null;
  parent_phone?: string | null;
  status: AttendanceStatus;
  note?: string | null;
}

export interface StudentAttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  holidayDays?: number;
  attendancePercentage: number;
  recentRecords: Array<{
    id: string;
    date: string;
    status: AttendanceStatus;
    note?: string | null;
    batch_name?: string;
  }>;
}

export interface TodayBatchSchedule {
  id: string;
  name: string;
  subject: string | null;
  startTime: string | null;
  endTime: string | null;
  studentCount: number;
  isRecordedToday: boolean;
  attendanceStats?: {
    present: number;
    absent: number;
    late: number;
    holiday: number;
  };
}

export interface OverdueStudentItem {
  studentId: string;
  studentName: string;
  grade: string | null;
  parentName: string | null;
  parentPhone: string;
  enrolledBatchNames: string[];
  month: string;
  balanceRemaining: number;
  amountDue: number;
  feeRecordId: string;
}

export interface OverdueSummaryAlert {
  overdueCount: number;
  totalPendingAmount: number;
  month: string;
  daysOverdue: number;
}

export interface AttendanceDayPoint {
  date: string;
  batchId: string;
  batchName: string;
  present: number;
  absent: number;
  late: number;
  holiday: number;
  total: number;
  rate: number;
}

export interface AttendanceAnalyticsData {
  points: AttendanceDayPoint[];
  overallRate: number;
  totalSessions: number;
}

export interface AttendanceRiskStudent {
  studentId: string;
  studentName: string;
  grade: string | null;
  parentName: string | null;
  parentPhone: string;
  batchName: string;
  consecutiveAbsences: number;
  lastAbsentDate: string;
}

export interface TodayCollectionSummary {
  totalToday: number;
  cashToday: number;
  upiToday: number;
  transactionsCount: number;
}

export interface ExecutiveDashboardData {
  todayFormatted: string;
  todayBatches: TodayBatchSchedule[];
  allBatchesList: Array<{
    id: string;
    name: string;
    studentCount: number;
  }>;
  actionQueue: {
    consecutiveAbsences: AttendanceRiskStudent[];
    unrecordedTodayBatches: TodayBatchSchedule[];
    overdueSummary?: OverdueSummaryAlert | null;
  };
  todayCollections: TodayCollectionSummary;
  financials: {
    month: string;
    totalBilled: number;
    totalCollected: number;
    totalPending: number;
    clearanceRate: number;
    totalStudents: number;
    paidStudentsCount: number;
    pendingStudentsCount: number;
  };
  overdueStudents: OverdueStudentItem[];
  attendanceAnalytics: AttendanceAnalyticsData;
  batchSummaries: Array<{
    id: string;
    name: string;
    subject: string | null;
    studentCount: number;
    monthlyPotential: number;
  }>;
}

export * from "./fees";
