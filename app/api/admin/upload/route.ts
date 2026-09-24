import { NextRequest, NextResponse } from "next/server";
import { hasAdminAccess } from "@/lib/admin-auth";
import { getServerSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: NextRequest) {
  if (!await hasAdminAccess()) return NextResponse.json({ message: "Accès administrateur requis." }, { status: 401 });
  const formData = await request.formData();
  const articleId = Number(formData.get("articleId"));
  const file = formData.get("file");
  if (!Number.isInteger(articleId) || articleId < 1 || !(file instanceof File) || !allowedTypes.has(file.type) || file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ message: "Image invalide : JPG, PNG ou WebP, 5 Mo maximum." }, { status: 400 });
  }
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `catalogue/${articleId}.${extension}`;
  try {
    const supabase = getServerSupabase();
    const { error: uploadError } = await supabase.storage.from("photos").upload(path, Buffer.from(await file.arrayBuffer()), { upsert: true, contentType: file.type });
    if (uploadError) throw uploadError;
    const { error: updateError } = await supabase.from("catalogue").update({ photo: path }).eq("id", articleId);
    if (updateError) throw updateError;
    return NextResponse.json({ photo: path });
  } catch (error) {
    console.error("Erreur upload image:", error);
    return NextResponse.json({ message: "Impossible d'enregistrer l'image." }, { status: 500 });
  }
}
