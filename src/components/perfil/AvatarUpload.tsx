"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/Avatar";
import { FormError, FormSuccess } from "@/components/ui/FormMessage";

const MAX_SIZE_BYTES = 3 * 1024 * 1024;

export function AvatarUpload({
  userId,
  nombre,
  avatarUrl,
}: {
  userId: string;
  nombre: string;
  avatarUrl: string | null;
}) {
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(undefined);
    setSuccess(undefined);

    if (!file.type.startsWith("image/")) {
      setError("Selecciona un archivo de imagen (JPG, PNG, WEBP…).");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("La imagen no puede pesar más de 3 MB.");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);

    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });

    if (uploadError) {
      setError("No se pudo subir la imagen. Intenta de nuevo.");
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", userId);

    setUploading(false);

    if (updateError) {
      setError("La imagen se subió pero no se pudo guardar en tu perfil.");
      return;
    }

    setPreview(publicUrl);
    setSuccess("Foto de perfil actualizada.");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative rounded-full transition-transform duration-150 active:scale-95"
        aria-label="Cambiar foto de perfil"
      >
        <Avatar nombre={nombre} avatarUrl={preview} size="lg" />
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 text-transparent transition-all duration-200 group-hover:bg-black/40 group-hover:text-white">
          {uploading ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
        </span>
      </button>
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
        >
          {uploading ? "Subiendo…" : "Cambiar foto"}
        </button>
        <p className="text-xs text-muted">JPG, PNG o WEBP. Máximo 3 MB.</p>
        <FormError message={error} />
        <FormSuccess message={success} />
      </div>
      <input ref={inputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
    </div>
  );
}
