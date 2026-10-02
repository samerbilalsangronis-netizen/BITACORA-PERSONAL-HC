import { requireUser } from "@/lib/session";
import { todayISOForUser } from "@/lib/server-date";
import { NuevaMetaForm } from "@/components/metas/NuevaMetaForm";
import { MetasTabs } from "@/components/metas/MetasTabs";
import type { Meta, MetaObjetivo, MetaObjetivoAvance, VisionBoardItem } from "@/lib/supabase/types";

export default async function MetasPage() {
  const { supabase, user } = await requireUser();
  const today = await todayISOForUser();

  const [{ data: metasData }, { data: visionData }, { data: objetivosData }, { data: avancesData }] = await Promise.all([
    supabase.from("metas").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("vision_board_items").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("meta_objetivos").select("*").eq("user_id", user.id).order("orden"),
    supabase.from("meta_objetivo_avances").select("*").eq("user_id", user.id),
  ]);

  const metas = (metasData ?? []) as Meta[];
  const visionItems = (visionData ?? []) as VisionBoardItem[];
  const objetivos = (objetivosData ?? []) as MetaObjetivo[];
  const avances = (avancesData ?? []) as MetaObjetivoAvance[];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Metas</h1>
          <p className="text-sm text-muted">Corto, mediano y largo plazo. Actualiza tu progreso a medida que avanzas.</p>
        </div>
        <NuevaMetaForm />
      </div>

      <MetasTabs metas={metas} visionItems={visionItems} userId={user.id} objetivos={objetivos} avances={avances} today={today} />
    </div>
  );
}
