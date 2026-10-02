"use client";

import { useState, useTransition } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import { evaluarAvanceConIA, aplicarAvance, type AtribucionPropuesta } from "@/lib/actions/metaAvances";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { FormError } from "@/components/ui/FormMessage";
import type { MetaObjetivo } from "@/lib/supabase/types";

interface AtribucionEditable extends AtribucionPropuesta {
  incluido: boolean;
}

export function RegistrarAvancePanel({
  metaId,
  objetivos,
  onClose,
  onAplicado,
}: {
  metaId: string;
  objetivos: MetaObjetivo[];
  onClose: () => void;
  onAplicado: () => void;
}) {
  const [texto, setTexto] = useState("");
  const [estado, setEstado] = useState<"escribir" | "evaluando" | "revisar" | "aplicando">("escribir");
  const [resumen, setResumen] = useState("");
  const [atribuciones, setAtribuciones] = useState<AtribucionEditable[]>([]);
  const [error, setError] = useState<string>();
  const [, startTransition] = useTransition();

  function evaluar() {
    setError(undefined);
    if (!texto.trim()) {
      setError("Describe qué hiciste para esta meta.");
      return;
    }
    setEstado("evaluando");
    startTransition(async () => {
      const result = await evaluarAvanceConIA(metaId, texto);
      if (result.error) {
        setError(result.error);
        setEstado("escribir");
        return;
      }
      setResumen(result.resumen ?? "");
      setAtribuciones((result.atribuciones ?? []).map((a) => ({ ...a, incluido: true })));
      setEstado("revisar");
    });
  }

  function actualizarCantidad(objetivoId: string, cantidad: number) {
    setAtribuciones((prev) => prev.map((a) => (a.objetivo_id === objetivoId ? { ...a, cantidad } : a)));
  }

  function toggleIncluido(objetivoId: string) {
    setAtribuciones((prev) => prev.map((a) => (a.objetivo_id === objetivoId ? { ...a, incluido: !a.incluido } : a)));
  }

  function agregarObjetivoManual(objetivoId: string) {
    const objetivo = objetivos.find((o) => o.id === objetivoId);
    if (!objetivo || atribuciones.some((a) => a.objetivo_id === objetivoId)) return;
    setAtribuciones((prev) => [
      ...prev,
      { objetivo_id: objetivo.id, nombre: objetivo.nombre, unidad: objetivo.unidad, cantidad: 1, nota: "Agregado manualmente", incluido: true },
    ]);
  }

  function aplicar() {
    setError(undefined);
    setEstado("aplicando");
    startTransition(async () => {
      const confirmadas = atribuciones.filter((a) => a.incluido).map(({ objetivo_id, cantidad, nota }) => ({ objetivo_id, cantidad, nota }));
      const result = await aplicarAvance(metaId, texto, confirmadas);
      if (result.error) {
        setError(result.error);
        setEstado("revisar");
        return;
      }
      onAplicado();
      onClose();
    });
  }

  const objetivosSinAtribucion = objetivos.filter((o) => !atribuciones.some((a) => a.objetivo_id === o.id));

  return (
    <Card className="border-primary/30">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="flex items-center gap-1.5 text-sm font-semibold">
          <Sparkles size={15} className="text-primary" /> Registrar avance
        </h4>
        <button onClick={onClose} className="text-muted hover:text-foreground" aria-label="Cerrar">
          <X size={16} />
        </button>
      </div>

      {objetivos.length === 0 ? (
        <p className="text-sm text-muted">Esta meta todavía no tiene objetivos. Genera o agrega objetivos primero.</p>
      ) : (
        <div className="space-y-3">
          <Textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            disabled={estado !== "escribir"}
            placeholder="Cuenta qué hiciste, ej: dediqué 15 minutos a editar 2 posts para Instagram y las historias…"
            rows={3}
          />

          {estado === "escribir" && (
            <div className="flex justify-end">
              <Button type="button" size="sm" onClick={evaluar}>
                Evaluar con IA
              </Button>
            </div>
          )}

          {estado === "evaluando" && (
            <div className="flex items-center gap-2 py-4 text-sm text-muted">
              <Loader2 size={16} className="animate-spin" /> Evaluando tu avance…
            </div>
          )}

          {(estado === "revisar" || estado === "aplicando") && (
            <div className="space-y-3">
              {resumen && <p className="rounded-lg bg-surface-muted px-3 py-2 text-xs text-muted">{resumen}</p>}

              {atribuciones.length === 0 && (
                <p className="text-sm text-muted">La IA no encontró avance claro para ningún objetivo. Puedes agregarlo manualmente abajo.</p>
              )}

              {atribuciones.map((a) => (
                <div key={a.objetivo_id} className="flex items-center gap-2 rounded-lg border border-border p-2.5">
                  <input
                    type="checkbox"
                    checked={a.incluido}
                    onChange={() => toggleIncluido(a.objetivo_id)}
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{a.nombre}</p>
                    {a.nota && <p className="text-xs text-muted">{a.nota}</p>}
                  </div>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    value={a.cantidad}
                    disabled={!a.incluido}
                    onChange={(e) => actualizarCantidad(a.objetivo_id, Number(e.target.value) || 0)}
                    className="w-20 text-xs"
                  />
                  {a.unidad && <span className="text-xs text-muted">{a.unidad}</span>}
                </div>
              ))}

              {objetivosSinAtribucion.length > 0 && (
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) agregarObjetivoManual(e.target.value);
                    e.target.value = "";
                  }}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-muted"
                >
                  <option value="">+ Agregar avance a otro objetivo…</option>
                  {objetivosSinAtribucion.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nombre}
                    </option>
                  ))}
                </select>
              )}

              <FormError message={error} />

              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => setEstado("escribir")}>
                  Volver a escribir
                </Button>
                <Button type="button" size="sm" onClick={aplicar} disabled={estado === "aplicando"} loading={estado === "aplicando"}>
                  Aplicar avance
                </Button>
              </div>
            </div>
          )}

          {estado === "escribir" && <FormError message={error} />}
        </div>
      )}
    </Card>
  );
}
