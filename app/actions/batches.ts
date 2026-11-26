"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { BatchPayload } from "@/types/dashboard";

export type { BatchPayload };

export async function createBatch(payload: BatchPayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required." };
  }

  if (!payload.name.trim()) {
    return { error: "Batch name is required." };
  }

  const { data, error } = await supabase
    .from("batches")
    .insert({
      teacher_id: user.id,
      name: payload.name.trim(),
      subject: payload.subject?.trim() || null,
      days: payload.days,
      start_time: payload.startTime || null,
      end_time: payload.endTime || null,
      default_monthly_fee: payload.defaultMonthlyFee || 0,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/batches");
  revalidatePath("/attendance");
  return { data };
}

export async function updateBatch(batchId: string, payload: BatchPayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required." };
  }

  if (!payload.name?.trim()) {
    return { error: "Batch name is required." };
  }

  const { data, error } = await supabase
    .from("batches")
    .update({
      name: payload.name.trim(),
      subject: payload.subject?.trim() || null,
      days: payload.days,
      start_time: payload.startTime || null,
      end_time: payload.endTime || null,
      default_monthly_fee: payload.defaultMonthlyFee || 0,
    })
    .eq("id", batchId)
    .eq("teacher_id", user.id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/batches");
  revalidatePath("/attendance");
  return { data };
}

export async function deleteBatch(batchId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required." };
  }

  // Delete enrollments before removing batch
  const { error: enrollError } = await supabase
    .from("batch_students")
    .delete()
    .eq("batch_id", batchId);

  if (enrollError) {
    return { error: enrollError.message };
  }

  const { data: deletedData, error } = await supabase
    .from("batches")
    .delete()
    .eq("id", batchId)
    .eq("teacher_id", user.id)
    .select();

  if (error) {
    return { error: error.message };
  }

  if (!deletedData || deletedData.length === 0) {
    return { error: "Unable to delete batch. Record not found or insufficient permissions." };
  }

  revalidatePath("/");
  revalidatePath("/batches");
  revalidatePath("/students");
  revalidatePath("/attendance");
  return { success: true };
}
