-- =====================================================================
-- Valle de las Oportunidades · Base de datos (Supabase)
-- Ejecuta este archivo UNA vez en: Supabase → SQL Editor → New query → Run
--
-- Privacidad: nadie puede leer ni escribir las tablas directamente.
-- Todo pasa por funciones que comprueban el código de clase, la clave
-- del docente o la clave personal de cada estudiante. Los estudiantes
-- se identifican solo con un código anónimo (por ejemplo EST-7F3KQ).
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.clases (
  codigo      text primary key,
  nombre      text not null default '',
  clave_hash  text not null,
  config      jsonb not null default '{}'::jsonb,
  creada      timestamptz not null default now()
);

create table if not exists public.eventos (
  id      bigserial primary key,
  clase   text not null references public.clases(codigo) on delete cascade,
  alumno  text not null,
  t       timestamptz not null default now(),
  datos   jsonb not null
);
create index if not exists eventos_clase_alumno on public.eventos (clase, alumno);

create table if not exists public.partidas (
  clase       text not null references public.clases(codigo) on delete cascade,
  alumno      text not null,
  slot        int  not null check (slot between 1 and 3),
  token_hash  text not null,
  estado      jsonb not null,
  actualizado timestamptz not null default now(),
  primary key (clase, alumno, slot)
);

alter table public.clases   enable row level security;
alter table public.eventos  enable row level security;
alter table public.partidas enable row level security;
-- Sin políticas: el acceso directo queda bloqueado para todos.
revoke all on public.clases, public.eventos, public.partidas from anon, authenticated;

-- ---------- utilidades ----------
create or replace function public._clave_ok(p_codigo text, p_clave text) returns boolean
language sql stable security definer set search_path = public, extensions as $$
  select exists (select 1 from public.clases c where c.codigo = upper(p_codigo) and c.clave_hash = crypt(p_clave, c.clave_hash));
$$;

-- ---------- docente ----------
create or replace function public.crear_clase(p_codigo text, p_nombre text, p_clave text) returns text
language plpgsql security definer set search_path = public, extensions as $$
begin
  if length(coalesce(p_codigo, '')) < 4 then raise exception 'El código de clase debe tener al menos 4 caracteres'; end if;
  if length(coalesce(p_clave, '')) < 6 then raise exception 'La clave del docente debe tener al menos 6 caracteres'; end if;
  if exists (select 1 from public.clases where codigo = upper(p_codigo)) then raise exception 'Ese código de clase ya existe'; end if;
  insert into public.clases (codigo, nombre, clave_hash) values (upper(p_codigo), coalesce(p_nombre, ''), crypt(p_clave, gen_salt('bf')));
  return upper(p_codigo);
end $$;

create or replace function public.guardar_config_clase(p_codigo text, p_clave text, p_config jsonb) returns boolean
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public._clave_ok(p_codigo, p_clave) then raise exception 'Clave incorrecta'; end if;
  update public.clases set config = coalesce(p_config, '{}'::jsonb) where codigo = upper(p_codigo);
  return true;
end $$;

create or replace function public.datos_clase(p_codigo text, p_clave text)
returns table (alumno text, t timestamptz, datos jsonb)
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public._clave_ok(p_codigo, p_clave) then raise exception 'Clave incorrecta'; end if;
  return query select e.alumno, e.t, e.datos from public.eventos e where e.clase = upper(p_codigo) order by e.t;
end $$;

create or replace function public.borrar_datos_clase(p_codigo text, p_clave text) returns int
language plpgsql security definer set search_path = public, extensions as $$
declare n int;
begin
  if not public._clave_ok(p_codigo, p_clave) then raise exception 'Clave incorrecta'; end if;
  delete from public.eventos where clase = upper(p_codigo);
  get diagnostics n = row_count;
  delete from public.partidas where clase = upper(p_codigo);
  return n;
end $$;

-- ---------- estudiantes ----------
create or replace function public.info_clase(p_codigo text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('nombre', c.nombre, 'config', c.config) from public.clases c where c.codigo = upper(p_codigo);
$$;

create or replace function public.registrar_eventos(p_clase text, p_alumno text, p_eventos jsonb) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not exists (select 1 from public.clases where codigo = upper(p_clase)) then raise exception 'Clase no encontrada'; end if;
  if jsonb_typeof(p_eventos) <> 'array' or jsonb_array_length(p_eventos) > 300 then raise exception 'Lote inválido'; end if;
  if p_alumno !~ '^[A-Z]{3,5}-[A-Z0-9]{4,8}$' then raise exception 'Código de estudiante inválido'; end if;
  insert into public.eventos (clase, alumno, datos)
    select upper(p_clase), p_alumno, x from jsonb_array_elements(p_eventos) as x;
  get diagnostics n = row_count;
  return n;
end $$;

create or replace function public.guardar_partida(p_clase text, p_alumno text, p_token text, p_slot int, p_estado jsonb) returns boolean
language plpgsql security definer set search_path = public, extensions as $$
declare h text;
begin
  if not exists (select 1 from public.clases where codigo = upper(p_clase)) then raise exception 'Clase no encontrada'; end if;
  if length(coalesce(p_token, '')) < 6 then raise exception 'Clave personal inválida'; end if;
  if pg_column_size(p_estado) > 2000000 then raise exception 'Partida demasiado grande'; end if;
  select token_hash into h from public.partidas where clase = upper(p_clase) and alumno = p_alumno and slot = p_slot;
  if h is not null and h <> crypt(p_token, h) then raise exception 'Clave personal incorrecta'; end if;
  insert into public.partidas (clase, alumno, slot, token_hash, estado, actualizado)
    values (upper(p_clase), p_alumno, p_slot, coalesce(h, crypt(p_token, gen_salt('bf'))), p_estado, now())
  on conflict (clase, alumno, slot) do update set estado = excluded.estado, actualizado = now();
  return true;
end $$;

create or replace function public.cargar_partida(p_clase text, p_alumno text, p_token text, p_slot int) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare r record;
begin
  select * into r from public.partidas where clase = upper(p_clase) and alumno = upper(p_alumno) and slot = p_slot;
  if r is null then return null; end if;
  if r.token_hash <> crypt(p_token, r.token_hash) then raise exception 'Clave personal incorrecta'; end if;
  return r.estado;
end $$;

-- Solo estas funciones son accesibles con la clave pública (anon).
revoke all on function public._clave_ok(text, text) from public, anon, authenticated;
grant execute on function public.crear_clase(text, text, text) to anon;
grant execute on function public.guardar_config_clase(text, text, jsonb) to anon;
grant execute on function public.datos_clase(text, text) to anon;
grant execute on function public.borrar_datos_clase(text, text) to anon;
grant execute on function public.info_clase(text) to anon;
grant execute on function public.registrar_eventos(text, text, jsonb) to anon;
grant execute on function public.guardar_partida(text, text, text, int, jsonb) to anon;
grant execute on function public.cargar_partida(text, text, text, int) to anon;
