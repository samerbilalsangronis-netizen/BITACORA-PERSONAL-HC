"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import type { Meta } from "@/lib/supabase/types";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export function MetaLogradaCard({ meta, userId }: { meta: Meta; userId: string }) {
  const [preview, setPreview] = useState<string | null>(meta.foto_url);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setError(undefined);

    if (!file.type.startsWith("image/")) {
      setError("Selecciona un archivo de imagen.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("La imagen no puede pesar más de 5 MB.");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);

    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/metas/${meta.id}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("metas")
      .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });

    if (uploadError) {
      setError("No se pudo subir la imagen. Intenta de nuevo.");
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from("metas").getPublicUrl(path);
    const publicUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

    const { error: updateError } = await supabase.from("metas").update({ foto_url: publicUrl }).eq("id", meta.id);

    setUploading(false);

    if (updateError) {
      setError("La imagen se subió pero no se pudo guardar.");
      return;
    }

    setPreview(publicUrl);
    router.refresh();
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface transition-colors duration-200">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative block aspect-[4/3] w-full bg-surface-muted"
        aria-label="Subir foto de esta meta"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- imagen viene de Supabase Storage (dominio dinámico por proyecto)
          <img src={preview} alt={meta.titulo} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">
            <Camera size={22} />
          </div>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-transparent transition-all duration-200 group-hover:bg-black/40 group-hover:text-white">
          {uploading ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
        </span>
      </button>
      <div className="p-3">
        <h3 className="text-sm font-semibold">{meta.titulo}</h3>
        {meta.descripcion && <p className="mt-0.5 line-clamp-2 text-xs text-muted">{meta.descripcion}</p>}
        <p className="mt-1 text-xs text-muted">Lograda · {formatDate(meta.updated_at.slice(0, 10))}</p>
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
      <input ref={inputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
    </div>
  );
}
