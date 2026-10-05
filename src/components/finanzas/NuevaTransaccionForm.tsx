"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar as CalendarIcon, Plus, X } from "lucide-react";
import { createTransaccion } from "@/lib/actions/finanzas";
import { createCategoriaPersonalizada } from "@/lib/actions/categorias";
import type { ActionState } from "@/lib/actions/auth";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormError, FormSuccess } from "@/components/ui/FormMessage";
import {
  ICONOS_DISPONIBLES,
  ICONO_MAP,
  COLORES_DISPONIBLES,
  CATEGORIA_ICONO_KEY,
  CATEGORIA_COLOR,
  categoriasPara,
  iconoFor,
} from "@/lib/constants";
import { cn, daysAgoISO, labelize } from "@/lib/utils";
import type { CategoriaPersonalizada, Cuenta, TipoTransaccion } from "@/lib/supabase/types";
import type { LucideIcon } from "lucide-react";

const initialState: ActionState = {};

type Opcion = { value: string; label: string; Icon: LucideIcon; color: string };

function opcionesPara(tipo: TipoTransaccion, customCats: CategoriaPersonalizada[]): Opcion[] {
  const defaults = categoriasPara(tipo).map((slug) => ({
    value: slug,
    label: labelize(slug),
    Icon: iconoFor(CATEGORIA_ICONO_KEY[slug] ?? "otro"),
    color: CATEGORIA_COLOR[slug] ?? CATEGORIA_COLOR.otro,
  }));
  const customs = customCats
    .filter((c) => c.tipo === tipo)
    .map((c) => ({ value: c.nombre, label: c.nombre, Icon: iconoFor(c.icono), color: c.color }));
  return [...defaults, ...customs];
}

export function NuevaTransaccionForm({
  tipo,
  categoriasPersonalizadas,
  cuentas,
  today,
  onClose,
}: {
  tipo: TipoTransaccion;
  categoriasPersonalizadas: CategoriaPersonalizada[];
  cuentas: Cuenta[];
  today: string;
  onClose: () => void;
}) {
  const [customCats, setCustomCats] = useState(categoriasPersonalizadas);
  const [categoria, setCategoria] = useState(categoriasPara(tipo)[0]);
  const [cuentaId, setCuentaId] = useState("");
  const [fecha, setFecha] = useState(today);
  const [showCalendar, setShowCalendar] = useState(false);

  const [creating, setCreating] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoIcono, setNuevoIcono] = useState(ICONOS_DISPONIBLES[0].key);
  const [nuevoColor, setNuevoColor] = useState(COLORES_DISPONIBLES[0]);
  const [creandoError, setCreandoError] = useState<string>();
  const [creandoPending, startCreando] = useTransition();

  const router = useRouter();
  const [state, formAction, pending] = useActionState(createTransaccion, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  // El router cache de Next no siempre se invalida solo con revalidatePath
  // en la ruta actual: forzamos el refresh para que los totales/balances
  // se vean al instante en vez de requerir una recarga manual.
  useEffect(() => {
    if (!state.success) return;
    router.refresh();
    formRef.current?.reset();
  }, [state.success, router]);

  const opciones = useMemo(() => opcionesPara(tipo, customCats), [tipo, customCats]);
  const esIngreso = tipo === "ingreso";

  const chips = [
    { label: "Hoy", value: today },
    { label: "Ayer", value: daysAgoISO(1, today) },
    { label: "Hace 2 días", value: daysAgoISO(2, today) },
  ];

  function handleCrearCategoria() {
    if (!nuevoNombre.trim()) {
      setCreandoError("Ingresa un nombre.");
      return;
    }
    setCreandoError(undefined);
    startCreando(async () => {
      const result = await createCategoriaPersonalizada(tipo, nuevoNombre, nuevoIcono, nuevoColor);
      if (result.error || !result.data) {
        setCreandoError(result.error ?? "No se pudo crear la categoría.");
        return;
      }
      setCustomCats((prev) => [...prev, result.data as CategoriaPersonalizada]);
      setCategoria((result.data as CategoriaPersonalizada).nombre);
      setNuevoNombre("");
      setCreating(false);
      router.refresh();
    });
  }

  return (
    <Card className={cn("border-2", esIngreso ? "border-accent/30" : "border-danger/30")}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{esIngreso ? "Nuevo ingreso" : "Nuevo gasto"}</h3>
        <button onClick={onClose} className="text-muted hover:text-foreground" aria-label="Cerrar">
          <X size={16} />
        </button>
      </div>
      <form ref={formRef} action={formAction} className="space-y-4">
        <input type="hidden" name="tipo" value={tipo} />

        <div>
          <Label htmlFor={`monto-${tipo}`}>Monto</Label>
          <Input id={`monto-${tipo}`} name="monto" type="number" min={0} step="0.01" required placeholder="0.00" className="text-lg" />
        </div>

        {cuentas.length > 0 ? (
          <div>
            <Label htmlFor={`cuenta-${tipo}`}>{esIngreso ? "¿A qué cuenta entra?" : "¿De qué cuenta sale?"}</Label>
            <Select
              id={`cuenta-${tipo}`}
              name="cuenta_id"
              required
              value={cuentaId}
              onChange={(e) => setCuentaId(e.target.value)}
            >
              <option value="" disabled>
                Elige una cuenta…
              </option>
              {cuentas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </Select>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted">
            Aún no tienes cuentas creadas. Agrega una desde el panel &quot;Capital total&quot; para poder asignar tus
            transacciones.
          </p>
        )}

        <div>
          <Label>Categoría</Label>
          <input type="hidden" name="categoria" value={categoria} />
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {opciones.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setCategoria(opt.value);
                  setCreating(false);
                }}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border p-2 text-center transition-colors",
                  categoria === opt.value && !creating
                    ? "border-primary bg-primary-soft"
                    : "border-transparent hover:bg-surface-muted"
                )}
              >
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-full text-white"
                  style={{ background: opt.color }}
                >
                  <opt.Icon size={18} />
                </span>
                <span className="line-clamp-1 w-full text-xs font-medium">{opt.label}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCreating((c) => !c)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border p-2 text-center transition-colors",
                creating ? "border-primary bg-primary-soft" : "border-dashed border-border hover:bg-surface-muted"
              )}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-muted text-muted">
                <Plus size={18} />
              </span>
              <span className="line-clamp-1 w-full text-xs font-medium">Más</span>
            </button>
          </div>
        </div>

        {creating && (
          <div className="space-y-3 rounded-xl border border-border bg-surface-muted p-3">
            <Input
              placeholder="Nombre de la categoría"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
            />
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
              {ICONOS_DISPONIBLES.map((ic) => {
                const Icon = ICONO_MAP[ic.key];
                return (
                  <button
                    key={ic.key}
                    type="button"
                    title={ic.label}
                    onClick={() => setNuevoIcono(ic.key)}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
                      nuevoIcono === ic.key ? "border-primary ring-2 ring-primary/30" : "border-border"
                    )}
                    style={{ color: nuevoColor }}
                  >
                    <Icon size={16} />
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2">
              {COLORES_DISPONIBLES.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Color ${c}`}
                  onClick={() => setNuevoColor(c)}
                  className={cn(
                    "h-6 w-6 rounded-full border-2 transition-transform",
                    nuevoColor === c ? "border-foreground scale-110" : "border-transparent"
                  )}
                  style={{ background: c }}
                />
              ))}
            </div>
            <FormError message={creandoError} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setCreating(false)}>
                Cancelar
              </Button>
              <Button type="button" size="sm" loading={creandoPending} onClick={handleCrearCategoria}>
                Crear categoría
              </Button>
            </div>
          </div>
        )}

        <div>
          <Label>Fecha</Label>
          <input type="hidden" name="fecha" value={fecha} />
          <div className="flex flex-wrap items-center gap-2">
            {chips.map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={() => {
                  setFecha(c.value);
                  setShowCalendar(false);
                }}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  fecha === c.value && !showCalendar
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border text-muted hover:bg-surface-muted"
                )}
              >
                {c.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowCalendar((s) => !s)}
              aria-label="Elegir fecha"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border transition-colors",
                showCalendar ? "border-primary text-primary" : "border-border text-muted hover:bg-surface-muted"
              )}
            >
              <CalendarIcon size={14} />
            </button>
          </div>
          {showCalendar && (
            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="mt-2" />
          )}
        </div>

        <div>
          <Label htmlFor={`descripcion-${tipo}`}>Comentario (opcional)</Label>
          <Textarea id={`descripcion-${tipo}`} name="descripcion" rows={2} placeholder="Detalle de la transacción…" />
        </div>

        <FormError message={state.error} />
        <FormSuccess message={state.success} />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending} loading={pending}>
            {pending ? "Guardando…" : "Registrar"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
