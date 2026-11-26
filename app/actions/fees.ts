"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type {
  FeeStatus,
  PaymentMethod,
  StudentFeeEntry,
  MonthlyFeeSummary,
  PaymentTransaction,
} from "@/types/fees";

export async function getMonthlyFees(month: string): Promise<{
  error?: string;
  entries: StudentFeeEntry[];
  summary: MonthlyFeeSummary;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "Authentication required.",
      entries: [],
      summary: {
        month,
        totalBilled: 0,
        totalCollected: 0,
        totalPending: 0,
        totalStudents: 0,
        paidCount: 0,
        pendingCount: 0,
        partiallyPaidCount: 0,
      },
    };
  }

  const { data: studentsData, error: studentsError } = await supabase
    .from("students")
    .select(`
      id,
      full_name,
      grade,
      parent_name,
      parent_phone,
      is_archived,
      batch_students (
        batch_id,
        custom_fee,
        batches (
          id,
          name,
          default_monthly_fee
        )
      )
    `)
    .eq("teacher_id", user.id)
    .eq("is_archived", false)
    .order("full_name", { ascending: true });

  if (studentsError) {
    return {
      error: studentsError.message,
      entries: [],
      summary: {
        month,
        totalBilled: 0,
        totalCollected: 0,
        totalPending: 0,
        totalStudents: 0,
        paidCount: 0,
        pendingCount: 0,
        partiallyPaidCount: 0,
      },
    };
  }

  const { data: existingRecordsData, error: recordsError } = await supabase
    .from("fee_records")
    .select("*")
    .eq("teacher_id", user.id)
    .eq("month", month);

  if (recordsError) {
    return {
      error: recordsError.message,
      entries: [],
      summary: {
        month,
        totalBilled: 0,
        totalCollected: 0,
        totalPending: 0,
        totalStudents: 0,
        paidCount: 0,
        pendingCount: 0,
        partiallyPaidCount: 0,
      },
    };
  }

  const recordMap = new Map<string, any>();
  (existingRecordsData || []).forEach((r) => recordMap.set(r.student_id, r));

  // Auto-generate missing monthly records for active students
  const missingRowsToInsert: any[] = [];
  (studentsData || []).forEach((s) => {
    if (!recordMap.has(s.id)) {
      const totalDue = (s.batch_students || []).reduce((sum: number, bs: any) => {
        if (bs.custom_fee !== null && bs.custom_fee !== undefined) {
          return sum + Number(bs.custom_fee);
        }
        return sum + Number(bs.batches?.default_monthly_fee || 0);
      }, 0);

      missingRowsToInsert.push({
        teacher_id: user.id,
        student_id: s.id,
        month,
        amount_due: totalDue,
        amount_paid: 0,
        discount: 0,
        status: "pending",
        due_date: `${month}-05`,
      });
    }
  });

  if (missingRowsToInsert.length > 0) {
    const { data: insertedRecords, error: insertError } = await supabase
      .from("fee_records")
      .insert(missingRowsToInsert)
      .select();

    if (!insertError && insertedRecords) {
      insertedRecords.forEach((r) => recordMap.set(r.student_id, r));
    }
  }

  const feeRecordIds = Array.from(recordMap.values()).map((r) => r.id);
  const transactionMap = new Map<string, PaymentTransaction>();

  if (feeRecordIds.length > 0) {
    const { data: transactionsData } = await supabase
      .from("payment_transactions")
      .select("*")
      .in("fee_record_id", feeRecordIds)
      .order("created_at", { ascending: false });

    (transactionsData || []).forEach((t: any) => {
      if (!transactionMap.has(t.fee_record_id)) {
        transactionMap.set(t.fee_record_id, {
          id: t.id,
          fee_record_id: t.fee_record_id,
          teacher_id: t.teacher_id,
          student_id: t.student_id,
          amount: Number(t.amount),
          payment_method: t.payment_method as PaymentMethod,
          payment_date: t.payment_date,
          receipt_number: t.receipt_number,
          notes: t.notes,
          created_at: t.created_at,
        });
      }
    });
  }

  let totalBilled = 0;
  let totalCollected = 0;
  let paidCount = 0;
  let pendingCount = 0;
  let partiallyPaidCount = 0;

  const entries: StudentFeeEntry[] = (studentsData || []).map((s: any) => {
    const record = recordMap.get(s.id);
    const amountDue = record ? Number(record.amount_due) : 0;
    const amountPaid = record ? Number(record.amount_paid) : 0;
    const discount = record ? Number(record.discount) : 0;
    const netDue = Math.max(0, amountDue - discount);
    const balanceRemaining = Math.max(0, netDue - amountPaid);
    const status: FeeStatus = record ? (record.status as FeeStatus) : "pending";

    totalBilled += netDue;
    totalCollected += amountPaid;

    if (status === "paid") {
      paidCount++;
    } else if (status === "partially_paid") {
      partiallyPaidCount++;
    } else {
      pendingCount++;
    }

    const enrolledBatches = (s.batch_students || []).map((bs: any) => ({
      batch_id: bs.batch_id,
      batch_name: bs.batches?.name || "Batch",
      fee:
        bs.custom_fee !== null && bs.custom_fee !== undefined
          ? Number(bs.custom_fee)
          : Number(bs.batches?.default_monthly_fee || 0),
    }));

    const lastTx = record ? transactionMap.get(record.id) : undefined;

    return {
      fee_record_id: record?.id || "",
      student_id: s.id,
      student_name: s.full_name,
      grade: s.grade,
      parent_name: s.parent_name,
      parent_phone: s.parent_phone,
      enrolled_batches: enrolledBatches,
      month,
      amount_due: amountDue,
      amount_paid: amountPaid,
      discount,
      balance_remaining: balanceRemaining,
      status,
      due_date: record?.due_date || null,
      last_payment_date: lastTx?.payment_date || null,
      last_payment_method: lastTx?.payment_method || null,
      latest_receipt_number: lastTx?.receipt_number || null,
    };
  });

  const totalPending = Math.max(0, totalBilled - totalCollected);

  return {
    entries,
    summary: {
      month,
      totalBilled,
      totalCollected,
      totalPending,
      totalStudents: entries.length,
      paidCount,
      pendingCount,
      partiallyPaidCount,
    },
  };
}

export async function recordPayment({
  feeRecordId,
  studentId,
  amount,
  paymentMethod,
  paymentDate,
  notes,
}: {
  feeRecordId: string;
  studentId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate?: string;
  notes?: string;
}): Promise<{
  success?: boolean;
  error?: string;
  receiptNumber?: string;
  transaction?: PaymentTransaction;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required." };
  }

  if (!amount || isNaN(amount) || amount <= 0) {
    return { error: "Please enter a valid payment amount." };
  }

  const { data: record, error: recordError } = await supabase
    .from("fee_records")
    .select("*")
    .eq("id", feeRecordId)
    .eq("teacher_id", user.id)
    .single();

  if (recordError || !record) {
    return { error: recordError?.message || "Fee record not found." };
  }

  const monthCode = (record.month || "2026-11").replace("-", "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const receiptNumber = `REC-${monthCode}-${randomSuffix}`;
  const effectiveDate = paymentDate || new Date().toISOString().split("T")[0];

  const { data: tx, error: txError } = await supabase
    .from("payment_transactions")
    .insert({
      fee_record_id: feeRecordId,
      teacher_id: user.id,
      student_id: studentId,
      amount,
      payment_method: paymentMethod,
      payment_date: effectiveDate,
      receipt_number: receiptNumber,
      notes: notes?.trim() || null,
    })
    .select()
    .single();

  if (txError || !tx) {
    return { error: txError?.message || "Failed to record payment transaction." };
  }

  const currentPaid = Number(record.amount_paid || 0);
  const newAmountPaid = currentPaid + Number(amount);
  const netDue = Math.max(0, Number(record.amount_due) - Number(record.discount || 0));
  const newStatus: FeeStatus = newAmountPaid >= netDue ? "paid" : "partially_paid";

  const { error: updateError } = await supabase
    .from("fee_records")
    .update({
      amount_paid: newAmountPaid,
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", feeRecordId);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/fees");
  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/batches");
  revalidatePath("/");

  return {
    success: true,
    receiptNumber,
    transaction: {
      id: tx.id,
      fee_record_id: tx.fee_record_id,
      teacher_id: tx.teacher_id,
      student_id: tx.student_id,
      amount: Number(tx.amount),
      payment_method: tx.payment_method,
      payment_date: tx.payment_date,
      receipt_number: tx.receipt_number,
      notes: tx.notes,
      created_at: tx.created_at,
    },
  };
}

export async function recordBulkPayments({
  payments,
  paymentMethod,
  paymentDate,
  notes,
}: {
  payments: Array<{
    feeRecordId: string;
    studentId: string;
    amount: number;
  }>;
  paymentMethod: PaymentMethod;
  paymentDate?: string;
  notes?: string;
}): Promise<{
  success?: boolean;
  error?: string;
  count?: number;
  totalCollected?: number;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required." };
  }

  if (!payments || payments.length === 0) {
    return { error: "No student payments provided." };
  }

  const effectiveDate = paymentDate || new Date().toISOString().split("T")[0];
  const recordIds = payments.map((p) => p.feeRecordId);

  const { data: recordsData, error: recordsError } = await supabase
    .from("fee_records")
    .select("*")
    .in("id", recordIds)
    .eq("teacher_id", user.id);

  if (recordsError || !recordsData) {
    return { error: recordsError?.message || "Failed to load fee records." };
  }

  const recordMap = new Map<string, any>(recordsData.map((r: any) => [r.id, r]));

  const transactionsToInsert: any[] = [];
  const updatesToExecute: Array<{ id: string; amount_paid: number; status: FeeStatus }> = [];
  let totalCollected = 0;

  for (const item of payments) {
    const record = recordMap.get(item.feeRecordId);
    if (!record) continue;

    const amount = Number(item.amount);
    if (isNaN(amount) || amount <= 0) continue;

    const monthCode = (record.month || "2026-11").replace("-", "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const receiptNumber = `REC-${monthCode}-${randomSuffix}`;

    transactionsToInsert.push({
      fee_record_id: item.feeRecordId,
      teacher_id: user.id,
      student_id: item.studentId,
      amount,
      payment_method: paymentMethod,
      payment_date: effectiveDate,
      receipt_number: receiptNumber,
      notes: notes?.trim() || null,
    });

    const currentPaid = Number(record.amount_paid || 0);
    const newAmountPaid = currentPaid + amount;
    const netDue = Math.max(0, Number(record.amount_due) - Number(record.discount || 0));
    const newStatus: FeeStatus = newAmountPaid >= netDue ? "paid" : "partially_paid";

    updatesToExecute.push({
      id: item.feeRecordId,
      amount_paid: newAmountPaid,
      status: newStatus,
    });

    totalCollected += amount;
  }

  if (transactionsToInsert.length === 0) {
    return { error: "No valid payment amounts to process." };
  }

  const { error: txInsertError } = await supabase
    .from("payment_transactions")
    .insert(transactionsToInsert);

  if (txInsertError) {
    return { error: txInsertError.message };
  }

  await Promise.all(
    updatesToExecute.map((u) =>
      supabase
        .from("fee_records")
        .update({
          amount_paid: u.amount_paid,
          status: u.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", u.id)
    )
  );

  revalidatePath("/fees");
  revalidatePath("/students");
  revalidatePath("/batches");
  revalidatePath("/");

  return {
    success: true,
    count: transactionsToInsert.length,
    totalCollected,
  };
}

export async function getStudentFeeHistory(studentId: string): Promise<{
  error?: string;
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
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "Authentication required.",
      records: [],
      transactions: [],
      totalLifetimePaid: 0,
      totalPendingDues: 0,
    };
  }

  const { data: recordsData, error: recordsError } = await supabase
    .from("fee_records")
    .select("*")
    .eq("student_id", studentId)
    .eq("teacher_id", user.id)
    .order("month", { ascending: false });

  if (recordsError) {
    return {
      error: recordsError.message,
      records: [],
      transactions: [],
      totalLifetimePaid: 0,
      totalPendingDues: 0,
    };
  }

  const { data: txData, error: txError } = await supabase
    .from("payment_transactions")
    .select("*")
    .eq("student_id", studentId)
    .eq("teacher_id", user.id)
    .order("payment_date", { ascending: false });

  if (txError) {
    return {
      error: txError.message,
      records: [],
      transactions: [],
      totalLifetimePaid: 0,
      totalPendingDues: 0,
    };
  }

  let totalLifetimePaid = 0;
  let totalPendingDues = 0;

  const records = (recordsData || []).map((r) => {
    const due = Number(r.amount_due);
    const paid = Number(r.amount_paid);
    const disc = Number(r.discount || 0);
    const net = Math.max(0, due - disc);
    const pending = Math.max(0, net - paid);

    totalLifetimePaid += paid;
    totalPendingDues += pending;

    return {
      id: r.id,
      month: r.month,
      amount_due: due,
      amount_paid: paid,
      discount: disc,
      status: r.status as FeeStatus,
      due_date: r.due_date,
    };
  });

  const transactions: PaymentTransaction[] = (txData || []).map((t) => ({
    id: t.id,
    fee_record_id: t.fee_record_id,
    teacher_id: t.teacher_id,
    student_id: t.student_id,
    amount: Number(t.amount),
    payment_method: t.payment_method,
    payment_date: t.payment_date,
    receipt_number: t.receipt_number,
    notes: t.notes,
    created_at: t.created_at,
  }));

  return {
    records,
    transactions,
    totalLifetimePaid,
    totalPendingDues,
  };
}
