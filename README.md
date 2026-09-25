# TraderMind — Bitácora Personal

Bitácora privada de dos usuarios para documentar disciplina diaria, emociones,
metas personales, journal de trading y finanzas personales. Pensada como
complemento del sistema Hikman Capital (análisis fundamental).

## Relación con Hikman Capital

TraderMind y [Hikman Capital](https://hikman-prueba.vercel.app/) son **dos
apps y dos repos separados** (stacks distintos: esta es Next.js, Hikman es
Vite + React Router), pero comparten el **mismo proyecto de Supabase** — las
tablas de cada una tienen prefijos/nombres que no chocan entre sí. Cada app
tiene un botón en su navegación que abre la otra en pestaña nueva. Como por
ahora ambas corren en subdominios `.vercel.app` gratuitos (dominios distintos
para el navegador), el login **no se comparte** entre las dos — eso requiere
tener ambas bajo el mismo dominio propio.

## Stack

- **Next.js 16** (App Router, Server Actions) + TypeScript + Tailwind CSS v4
- **Supabase** (Postgres + Auth + Row Level Security)
- **Recharts** para gráficos, **react-markdown** para el journal
- Pensado para desplegar en **Vercel**

## Funcionalidades

1. **Autenticación en dos capas**: email/contraseña (Supabase Auth) + PIN de
   4-6 dígitos por sesión. Recuperación de contraseña por correo.
2. **Dashboard**: % de disciplina de hoy, racha de días completos, gráfico de
   cumplimiento (30/60/90 días), heatmap estilo GitHub, metas activas, última
   entrada de journal, distribución de emociones y balance financiero del mes.
3. **Disciplina diaria**: tareas 100% definidas por el usuario, con orden,
   checkboxes, historial navegable por día y resumen semanal.
4. **Metas**: corto/mediano/largo plazo, progreso 0-100%, estado
   (activa/completada/pausada) e historial de cambios de progreso.
5. **Journal / Bitácora**: entradas con markdown, multiselección de
   emociones, clasificación (personal/post-operación/reflexión), búsqueda por
   texto, tipo, emoción y fecha.
6. **Gestor financiero**: registro de ingresos y egresos por categoría,
   balance del mes, gráfico de ingresos vs. egresos (6 meses) y distribución
   de egresos por categoría — para saber en qué se usa el dinero.
7. **Notificaciones**: recordatorio diario configurable (hora + on/off),
   notificaciones del navegador (Notification API) y panel de notificaciones
   in-app.
8. **Perfil**: nombre/correo, cambio de contraseña, cambio de PIN,
   configuración de recordatorios, cerrar sesión.

Todas las tablas tienen Row Level Security: cada usuario solo puede leer y
escribir sus propios datos.

## Configuración

### 1. Crear el proyecto en Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecuta en orden los archivos de `supabase/migrations/`:
   - `0001_init.sql`
   - `0002_finanzas.sql`
   - `0003_default_light_theme.sql`
   - `0004_avatar.sql` (crea el bucket de Storage `avatars` para las fotos de perfil)
   - `0005_categorias_personalizadas.sql` (categorías de finanzas creadas por el usuario)
   - `0006_metas_vision.sql` (foto en metas logradas + tablero de visión; crea el bucket de Storage `metas`)
   - `0007_disciplina_habitos.sql` (rediseño de Disciplina: tareas/hábitos con racha, contador con objetivo y días de la semana; migra automáticamente el historial de `daily_tasks`)
3. En **Authentication → Providers**, deja habilitado el proveedor de Email.
4. En **Authentication → URL Configuration**, agrega la URL de tu app (por
   ejemplo `http://localhost:3000` en desarrollo y tu dominio de Vercel en
   producción) a **Site URL** y **Redirect URLs** (necesario para el enlace
   de recuperación de contraseña, que usa `/auth/callback`).

### 2. Variables de entorno

Copia `.env.example` a `.env.local` y completa:

```bash
NEXT_PUBLIC_SUPABASE_URL=...        # Project Settings → API
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # Project Settings → API
PIN_COOKIE_SECRET=...               # openssl rand -base64 32
```

`NEXT_PUBLIC_SITE_URL` es opcional (por defecto `http://localhost:3000`); en
producción, configúrala con la URL pública de tu despliegue para que los
enlaces de recuperación de contraseña apunten al dominio correcto.

### 3. Instalar y correr

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). El primer usuario que
inicie sesión deberá configurar su PIN en `/pin/configurar`.

### 4. Crear las dos cuentas

La app no restringe el registro por código, así que cada trader crea su
cuenta desde `/signup` con su propio correo y contraseña, y luego configura
su PIN. Los datos de cada cuenta están completamente aislados por RLS.

## Scripts

```bash
npm run dev     # servidor de desarrollo
npm run build   # build de producción
npm run start   # servidor de producción
npm run lint    # eslint
```

## Despliegue en Vercel

1. Importa el repositorio en Vercel.
2. Configura las variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `PIN_COOKIE_SECRET`, `NEXT_PUBLIC_SITE_URL`)
   en Project Settings → Environment Variables.
3. Agrega el dominio de Vercel a **Redirect URLs** en Supabase Auth.
4. Despliega. Next.js detecta automáticamente el App Router.

## Estructura del proyecto

```
src/
  app/
    (auth)/          login, signup, forgot-password, reset-password
    (app)/            dashboard, disciplina, metas, journal, finanzas, perfil
    pin/              verificación y configuración de PIN
    auth/callback/    intercambio de código de Supabase (magic link / reset)
  components/
    ui/               primitivas (Button, Card, Input, Badge, StatCard…)
    layout/           navegación, tema, notificaciones, recordatorios
    disciplina/ metas/ journal/ dashboard/ finanzas/ perfil/
  lib/
    actions/          Server Actions (auth, pin, disciplina, metas, journal, finanzas, perfil)
    supabase/         clientes de Supabase (browser/server) + tipos
    palette.ts         paleta de gráficos (validada para daltonismo/contraste)
supabase/
  migrations/         esquema SQL + RLS
```
