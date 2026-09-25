export type Tipo = "personal" | "post-operacion" | "reflexion";
export type TipoMeta = "corto_plazo" | "mediano_plazo" | "largo_plazo";
export type EstadoMeta = "activa" | "completada" | "pausada";
export type Theme = "dark" | "light";
export type TipoTransaccion = "ingreso" | "egreso";

// Nota: estos tipos usan `type` (no `interface`) a propósito. Un `interface`
// no satisface el `extends Record<string, unknown>` que exige el generic
// `Database` de @supabase/supabase-js, y todas las consultas tipadas colapsan
// silenciosamente a `never`.
export type Profile = {
  id: string;
  email: string;
  nombre: string;
  avatar_url: string | null;
  pin_hash: string | null;
  pin_set: boolean;
  theme: Theme;
  reminder_time: string;
  reminder_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type JournalEntry = {
  id: string;
  user_id: string;
  titulo: string;
  contenido: string;
  emociones: string[];
  tipo: Tipo;
  created_at: string;
  updated_at: string;
};

export type Meta = {
  id: string;
  user_id: string;
  titulo: string;
  descripcion: string;
  tipo: TipoMeta;
  estado: EstadoMeta;
  progreso: number;
  fecha_inicio: string;
  fecha_objetivo: string | null;
  created_at: string;
  updated_at: string;
};

export type MetaProgresoHistorial = {
  id: string;
  meta_id: string;
  user_id: string;
  progreso: number;
  nota: string | null;
  created_at: string;
};

export type TareaDiaria = {
  id: string;
  descripcion: string;
  orden: number;
  completada: boolean;
  hora_completada: string | null;
};

export type DailyTasks = {
  id: string;
  user_id: string;
  fecha: string;
  tareas: TareaDiaria[];
  created_at: string;
  updated_at: string;
};

export type DisciplinaStats = {
  id: string;
  user_id: string;
  fecha: string;
  tareas_totales: number;
  tareas_completadas: number;
  porcentaje_cumplimiento: number;
};

export type Notificacion = {
  id: string;
  user_id: string;
  titulo: string;
  mensaje: string;
  tipo: "recordatorio" | "sistema";
  leida: boolean;
  created_at: string;
};

export type Transaccion = {
  id: string;
  user_id: string;
  tipo: TipoTransaccion;
  categoria: string;
  monto: number;
  descripcion: string;
  fecha: string;
  created_at: string;
  updated_at: string;
};

type EmptyRecord = Record<never, never>;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
        Relationships: [];
      };
      journal_entries: {
        Row: JournalEntry;
        Insert: Partial<JournalEntry>;
        Update: Partial<JournalEntry>;
        Relationships: [];
      };
      metas: {
        Row: Meta;
        Insert: Partial<Meta>;
        Update: Partial<Meta>;
        Relationships: [];
      };
      meta_progreso_historial: {
        Row: MetaProgresoHistorial;
        Insert: Partial<MetaProgresoHistorial>;
        Update: Partial<MetaProgresoHistorial>;
        Relationships: [];
      };
      daily_tasks: {
        Row: DailyTasks;
        Insert: Partial<DailyTasks>;
        Update: Partial<DailyTasks>;
        Relationships: [];
      };
      disciplina_stats: {
        Row: DisciplinaStats;
        Insert: Partial<DisciplinaStats>;
        Update: Partial<DisciplinaStats>;
        Relationships: [];
      };
      notificaciones: {
        Row: Notificacion;
        Insert: Partial<Notificacion>;
        Update: Partial<Notificacion>;
        Relationships: [];
      };
      transacciones: {
        Row: Transaccion;
        Insert: Partial<Transaccion>;
        Update: Partial<Transaccion>;
        Relationships: [];
      };
    };
    Views: EmptyRecord;
    Functions: EmptyRecord;
    Enums: EmptyRecord;
    CompositeTypes: EmptyRecord;
  };
};
