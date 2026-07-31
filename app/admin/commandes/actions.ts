"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function supprimerCommande(formData: FormData) {
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