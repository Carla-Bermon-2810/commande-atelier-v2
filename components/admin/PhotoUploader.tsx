"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  articleId: number;
  photo: string | null;
  onUploaded: (photo: string) => void;
};

export default function PhotoUploader({
  articleId,
  photo,
  onUploaded,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState(photo);

  // Si le parent change la photo, on met à jour l'aperçu
  useEffect(() => {
    setCurrentPhoto(photo);
  }, [photo]);

  const imageUrl = currentPhoto
    ? `${supabase.storage.from("photos").getPublicUrl(currentPhoto).data.publicUrl}?t=${Date.now()}`
    : null;

  async function upload(file: File) {
    if (!file || !articleId) return;

    try {
      setLoading(true);

      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const chemin = `catalogue/${articleId}.${extension}`;

      // Upload dans le bucket
      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(chemin, file, {
          upsert: true,
        });

      if (uploadError) {
        alert(uploadError.message);
        return;
      }

      // Mise à jour de la base
      const { data, error } = await supabase
        .from("catalogue")
        .update({
          photo: chemin,
        })
        .eq("id", articleId)
        .select();

      console.log("ARTICLE ID :", articleId);
      console.log("CHEMIN :", chemin);
      console.log("DATA :", data);
      console.log("ERROR :", error);

if (error) {
  alert(error.message);
  return;
}

      // Mise à jour de l'interface
      setCurrentPhoto(chemin);
      onUploaded(chemin);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            upload(file);
          }
        }}
      />

      <div
        onClick={() => inputRef.current?.click()}
        className="flex h-72 w-72 cursor-pointer items-center justify-center overflow-hidden rounded-xl border bg-gray-100 transition hover:bg-gray-200"
      >
        {loading ? (
          <div className="text-gray-500">Upload...</div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt="Photo"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="text-center text-gray-500">
            <div className="mb-2 text-5xl">📷</div>
            <div>Cliquer pour ajouter une photo</div>
          </div>
        )}
      </div>
    </>
  );
}