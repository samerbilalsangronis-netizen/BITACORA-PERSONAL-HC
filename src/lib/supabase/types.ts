export type Tipo = "personal" | "post-operacion" | "reflexion";
export type TipoMeta = "corto_plazo" | "mediano_plazo" | "largo_plazo";
export type EstadoMeta = "activa" | "completada" | "pausada";
export type Theme = "dark" | "light";
export type TipoTransaccion = "ingreso" | "egreso";
export type CategoriaHabito = "tarea" | "habito";
export type TipoHabito = "check" | "contador";

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
  foto_url: string | null;
  created_at: string;
  updated_at: string;
};

export type VisionBoardItem = {
  id: string;
  user_id: string;
  imagen_url: string;
  titulo: string;
  orden: number;
  created_at: string;
};

export type MetaProgresoHistorial = {
  id: string;
  meta_id: string;
  user_id: string;
  progreso: number;
  nota: string | null;
  created_at: string;
};

export type Habito = {
  id: string;
  user_id: string;
  categoria: CategoriaHabito;
  tipo: TipoHabito;
  nombre: string;
  objetivo: number;
  unidad: string;
  icono: string;
  color: string;
  dias_semana: number[];
  activo: boolean;
  orden: number;
  created_at: string;
  updated_at: string;
};

export type HabitoRegistro = {
  id: string;
  habito_id: string;
  user_id: string;
  fecha: string;
  valor: number;
  hora_completada: string | null;
  created_at: string;
  updated_at: string;
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

export type CategoriaPersonalizada = {
  id: string;
  user_id: string;
  tipo: TipoTransaccion;
  nombre: string;
  icono: string;
  color: string;
  created_at: string;
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
      categorias_personalizadas: {
        Row: CategoriaPersonalizada;
        Insert: Partial<CategoriaPersonalizada>;
        Update: Partial<CategoriaPersonalizada>;
        Relationships: [];
      };
      vision_board_items: {
        Row: VisionBoardItem;
        Insert: Partial<VisionBoardItem>;
        Update: Partial<VisionBoardItem>;
        Relationships: [];
      };
      habitos: {
        Row: Habito;
        Insert: Partial<Habito>;
        Update: Partial<Habito>;
        Relationships: [];
      };
      habito_registros: {
        Row: HabitoRegistro;
        Insert: Partial<HabitoRegistro>;
        Update: Partial<HabitoRegistro>;
        Relationships: [];
      };
    };
    Views: EmptyRecord;
    Functions: EmptyRecord;
    Enums: EmptyRecord;
    CompositeTypes: EmptyRecord;
  };
};
