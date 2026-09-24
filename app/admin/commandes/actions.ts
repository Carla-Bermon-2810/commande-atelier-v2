"use server";

import { getServerSupabase } from "@/lib/supabase-server";
import { requireAdminAccess } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";

export async function supprimerCommande(formData: FormData) {
  await requireAdminAccess();
  const supabase = getServerSupabase();
  const id = formData.get("id") as string;

  const { error } = await supabase
    .from("commandes")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/commandes");
}
