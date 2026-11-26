"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { BatchEnrollmentInput, StudentPayload } from "@/types/dashboard";

export type { BatchEnrollmentInput, StudentPayload };

export async function createStudent(payload: StudentPayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required." };
  }

  if (!payload.fullName.trim()) {
    return { error: "Student name is required." };
  }

  if (!payload.parentPhone.trim()) {
    return { error: "Parent phone number is required." };
  }

  const { data: student, error: studentError } = await supabase
    .from("students")
    .insert({
      teacher_id: user.id,
      full_name: payload.fullName.trim(),
      grade: payload.grade?.trim() || null,
      parent_name: payload.parentName?.trim() || null,
      parent_phone: payload.parentPhone.trim(),
      joined_date: payload.joinedDate || new Date().toISOString().split("T")[0],
      notes: payload.notes?.trim() || null,
    })
    .select()
    .single();

  if (studentError || !student) {
    return { error: studentError?.message || "Failed to create student." };
  }

  if (payload.enrollments.length > 0) {
    const enrollmentsToInsert = payload.enrollments.map((enr) => ({
      batch_id: enr.batchId,
      student_id: student.id,
      custom_fee:
        typeof enr.customFee === "number" && !isNaN(enr.customFee)
          ? enr.customFee
          : null,
    }));

    const { error: enrollError } = await supabase
      .from("batch_students")
      .insert(enrollmentsToInsert);

    if (enrollError) {
      return { error: enrollError.message };
    }
  }

  revalidatePath("/");
  revalidatePath("/students");
  revalidatePath("/batches");
  revalidatePath("/attendance");
  return { data: student };
}

export async function updateStudent(
  studentId: string,
  payload: StudentPayload
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required." };
  }

  if (!payload.fullName?.trim()) {
    return { error: "Student name is required." };
  }

  if (!payload.parentPhone?.trim()) {
    return { error: "Parent phone number is required." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateFields: Record<string, any> = {
    full_name: payload.fullName.trim(),
    grade: payload.grade?.trim() || null,
    parent_name: payload.parentName?.trim() || null,
    parent_phone: payload.parentPhone.trim(),
    notes: payload.notes?.trim() || null,
  };

  if (payload.joinedDate?.trim()) {
    updateFields.joined_date = payload.joinedDate.trim();
  }

  const { error: studentError } = await supabase
    .from("students")
    .update(updateFields)
    .eq("id", studentId)
    .eq("teacher_id", user.id);

  if (studentError) {
    return { error: studentError.message };
  }

  const { error: deleteEnrollError } = await supabase
    .from("batch_students")
    .delete()
    .eq("student_id", studentId);

  if (deleteEnrollError) {
    return { error: deleteEnrollError.message };
  }

  if (payload.enrollments.length > 0) {
    const enrollmentsToInsert = payload.enrollments.map((enr) => ({
      batch_id: enr.batchId,
      student_id: studentId,
      custom_fee:
        typeof enr.customFee === "number" && !isNaN(enr.customFee)
          ? enr.customFee
          : null,
    }));

    const { error: enrollError } = await supabase
      .from("batch_students")
      .insert(enrollmentsToInsert);

    if (enrollError) {
      return { error: enrollError.message };
    }
  }

  revalidatePath("/");
  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/batches");
  revalidatePath("/attendance");
  return { success: true };
}

export async function toggleArchiveStudent(
  studentId: string,
  isArchived: boolean
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required." };
  }

  const { error } = await supabase
    .from("students")
    .update({ is_archived: isArchived })
    .eq("id", studentId)
    .eq("teacher_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/batches");
  revalidatePath("/attendance");
  return { success: true };
}

export async function deleteStudent(studentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required." };
  }

  const { error: batchStudentError } = await supabase
    .from("batch_students")
    .delete()
    .eq("student_id", studentId);

  if (batchStudentError) {
    return { error: batchStudentError.message };
  }

  const { data: deletedData, error: studentError } = await supabase
    .from("students")
    .delete()
    .eq("id", studentId)
    .eq("teacher_id", user.id)
    .select();

  if (studentError) {
    return { error: studentError.message };
  }

  if (!deletedData || deletedData.length === 0) {
    return { error: "Unable to delete student. Record not found or insufficient permissions." };
  }

  revalidatePath("/");
  revalidatePath("/students");
  revalidatePath("/batches");
  revalidatePath("/attendance");
  return { success: true };
}
