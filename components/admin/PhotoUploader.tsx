"use client";

import { useEffect, useRef, useState } from "react";

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

  const imageUrl = currentPhoto && process.env.NEXT_PUBLIC_SUPABASE_URL
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${currentPhoto}?t=${Date.now()}`
    : null;

  async function upload(file: File) {
    if (!file || !articleId) return;

    try {
      setLoading(true);

      const formData = new FormData();
      formData.set("articleId", String(articleId));
      formData.set("file", file);
      const response = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const result = await response.json() as { photo?: string; message?: string };
      if (!response.ok || !result.photo) {
        alert(result.message ?? "Impossible d'enregistrer l'image.");
        return;
      }

      // Mise à jour de l'interface
      setCurrentPhoto(result.photo);
      onUploaded(result.photo);
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
          if (file) upload(file);
        }}
      />
  
      <div className="flex flex-col items-center gap-5">
  
        <div
          className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border bg-white"
        >
          {loading ? (
            <div className="text-gray-500">Upload...</div>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt="Photo"
              className="h-full w-full object-contain p-6"
            />
          ) : (
            <div className="text-center text-gray-500">
              <div className="mb-2 text-5xl">📷</div>
              <div>Aucune photo</div>
            </div>
          )}
        </div>
  
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 transition hover:bg-slate-100"
        >
          📷 Changer l'image
        </button>
  
      </div>
    </>
  );
}
