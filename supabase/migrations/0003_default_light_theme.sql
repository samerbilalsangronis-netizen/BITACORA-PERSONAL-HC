-- El diseño "warm paper" (Notion) es un tema claro; el default de la columna
-- seguía siendo 'dark' de la primera versión del esquema.
alter table public.profiles alter column theme set default 'light';
