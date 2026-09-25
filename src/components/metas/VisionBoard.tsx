"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createVisionItem, deleteVisionItem } from "@/lib/actions/vision";
import type { VisionBoardItem } from "@/lib/supabase/types";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export function VisionBoard({ items, userId }: { items: VisionBoardItem[]; userId: string }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
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

    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/vision/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("metas")
      .upload(path, file, { contentType: file.type, cacheControl: "3600" });

    if (uploadError) {
      setError("No se pudo subir la imagen. Intenta de nuevo.");
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("metas").getPublicUrl(path);
    const result = await createVisionItem(data.publicUrl, "");
    setUploading(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  function onDelete(id: string) {
    if (!confirm("¿Eliminar esta imagen del tablero?")) return;
    startTransition(async () => {
      await deleteVisionItem(id);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Imágenes que representan tus metas y sueños. Míralas seguido.</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium transition-colors hover:bg-surface-muted disabled:opacity-50"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Agregar imagen
        </button>
        <input ref={inputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
      </div>
      {error && <p className="mb-3 text-xs text-danger">{error}</p>}

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
          Tu tablero de visión está vacío. Sube imágenes que representen lo que quieres lograr.
        </p>
      ) : (
        <div className="columns-2 gap-3 sm:columns-3 [&>*]:mb-3">
          {items.map((item, i) => (
            <div
              key={item.id}
              className="group relative animate-fade-in-up overflow-hidden rounded-xl border border-border break-inside-avoid"
              style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- imagen viene de Supabase Storage (dominio dinámico por proyecto) */}
              <img src={item.imagen_url} alt={item.titulo || "Visión"} className="w-full object-cover" />
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                disabled={isPending}
                aria-label="Eliminar imagen"
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
