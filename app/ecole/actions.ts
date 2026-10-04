'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addSchoolNotice(formData: FormData) {
  const supabaseServer = await createClient();
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const category = formData.get('category') as string;
  const notice_date = formData.get('notice_date') as string;

  if (!title) return;

  await supabaseServer.from("school_notices").insert({
    title,
    content: content || '',
    category: category || 'info',
    notice_date: notice_date || new Date().toISOString()
  });

  revalidatePath('/ecole');
}

export async function updateNotice(formData: FormData) {
  const supabaseServer = await createClient();
  const id = formData.get('id') as string;
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const category = formData.get('category') as string;
  const notice_date = formData.get('notice_date') as string;

  if (!id || !title) return;

  await supabaseServer.from("school_notices").update({
    title,
    content: content || '',
    category: category || 'info',
    notice_date: notice_date || new Date().toISOString()
  }).eq('id', id);

  revalidatePath('/ecole');
}

export async function deleteNotice(formData: FormData) {
  const supabaseServer = await createClient();
  const id = formData.get('id') as string;
  if (!id) return;

  await supabaseServer.from("school_notices").delete().eq('id', id);
  revalidatePath('/ecole');
}