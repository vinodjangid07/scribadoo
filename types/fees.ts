export type FeeStatus = "pending" | "partially_paid" | "paid" | "overdue";

export type PaymentMethod = "upi" | "cash" | "bank_transfer" | "other";

export interface FeeRecord {
  id: string;
  teacher_id: string;
  student_id: string;
  month: string; // 'YYYY-MM'
  amount_due: number;
  amount_paid: number;
  discount: number;
  status: FeeStatus;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransaction {
  id: string;
  fee_record_id: string;
  teacher_id: string;
  student_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  receipt_number: string;
  notes: string | null;
  created_at: string;
}

export interface StudentFeeEntry {
  fee_record_id: string;
  student_id: string;
  student_name: string;
  grade: string | null;
  parent_name: string | null;
  parent_phone: string;
  enrolled_batches: Array<{
    batch_id: string;
    batch_name: string;
    fee: number;
  }>;
  month: string;
  amount_due: number;
  amount_paid: number;
  discount: number;
  balance_remaining: number;
  status: FeeStatus;
  due_date: string | null;
  last_payment_date?: string | null;
  last_payment_method?: PaymentMethod | null;
  latest_receipt_number?: string | null;
}

export interface MonthlyFeeSummary {
  month: string;
  totalBilled: number;
  totalCollected: number;
  totalPending: number;
  totalStudents: number;
  paidCount: number;
  pendingCount: number;
  partiallyPaidCount: number;
}

export interface StudentFeeHistory {
  records: Array<{
    id: string;
    month: string;
    amount_due: number;
    amount_paid: number;
    discount: number;
    status: FeeStatus;
    due_date: string | null;
  }>;
  transactions: PaymentTransaction[];
  totalLifetimePaid: number;
  totalPendingDues: number;
  error?: string;
}

