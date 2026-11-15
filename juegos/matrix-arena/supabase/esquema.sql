-- Matrix Arena · esquema de base de datos para Supabase
-- Pégalo completo en Supabase → SQL Editor → New query → Run. Se puede ejecutar varias veces.
--
-- Modelo de permisos (RLS):
--   · Estudiantes: entran sin correo (inicio de sesión anónimo) con un código de aula y un apodo.
--     Cada uno lee, escribe y borra SOLO sus propios datos.
--   · Docente (Alcalde): entra con correo y contraseña. Crea aulas y lee los datos de los
--     estudiantes de SUS aulas. Un usuario anónimo nunca puede crear aulas.

create table if not exists public.classes (
  code        text primary key check (code ~ '^[A-Z0-9]{4,10}$'),
  name        text not null default 'Mi aula' check (char_length(name) <= 60),
  teacher_id  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table if not exists public.citizens (
  user_id     uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  class_code  text not null references public.classes(code) on delete cascade,
  nick        text not null default 'Aprendiz' check (char_length(nick) <= 20),
  summary     jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

create table if not exists public.event_chunks (
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  chunk_key   text not null check (char_length(chunk_key) <= 40),
  events      jsonb not null default '[]'::jsonb,
  updated_at  timestamptz not null default now(),
  primary key (user_id, chunk_key)
);

create index if not exists citizens_class_idx on public.citizens(class_code);

alter table public.classes      enable row level security;
alter table public.citizens     enable row level security;
alter table public.event_chunks enable row level security;

-- ¿El usuario actual es docente de esta aula?
create or replace function public.is_teacher_of(p_code text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from classes where code = p_code and teacher_id = auth.uid());
$$;

-- ¿El usuario actual es docente de este estudiante?
create or replace function public.is_teacher_of_user(p_user uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from citizens c join classes k on k.code = c.class_code
                where c.user_id = p_user and k.teacher_id = auth.uid());
$$;

-- Aulas: solo su docente las ve y las gestiona; los anónimos no pueden crearlas.
drop policy if exists classes_select on public.classes;
drop policy if exists classes_insert on public.classes;
drop policy if exists classes_modify on public.classes;
drop policy if exists classes_delete on public.classes;
create policy classes_select on public.classes for select to authenticated using (teacher_id = auth.uid());
create policy classes_insert on public.classes for insert to authenticated
  with check (teacher_id = auth.uid() and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);
create policy classes_modify on public.classes for update to authenticated using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
create policy classes_delete on public.classes for delete to authenticated using (teacher_id = auth.uid());

-- Ciudadanos: cada uno el suyo; el docente ve y puede retirar a los de sus aulas.
drop policy if exists citizens_select on public.citizens;
drop policy if exists citizens_update on public.citizens;
drop policy if exists citizens_delete on public.citizens;
create policy citizens_select on public.citizens for select to authenticated
  using (user_id = auth.uid() or public.is_teacher_of(class_code));
-- Un estudiante actualiza su resumen, pero no puede cambiarse de aula por su cuenta (para eso, join_class).
create policy citizens_update on public.citizens for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and class_code = (select c.class_code from public.citizens c where c.user_id = auth.uid()));
create policy citizens_delete on public.citizens for delete to authenticated
  using (user_id = auth.uid() or public.is_teacher_of(class_code));
-- (No hay política de INSERT: se entra al aula solo con join_class, que comprueba el código.)

-- Registro de jugadas: cada uno el suyo; el docente lee los de sus estudiantes.
drop policy if exists chunks_own on public.event_chunks;
drop policy if exists chunks_teacher on public.event_chunks;
create policy chunks_own on public.event_chunks for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy chunks_teacher on public.event_chunks for select to authenticated
  using (public.is_teacher_of_user(user_id));

-- Entrar a un aula con su código (sin poder ver la lista de aulas).
create or replace function public.join_class(p_code text, p_nick text) returns text
language plpgsql security definer set search_path = public as $$
declare v_code text := upper(trim(p_code)); v_name text;
begin
  if auth.uid() is null then raise exception 'sin_sesion'; end if;
  select name into v_name from classes where code = v_code;
  if v_name is null then raise exception 'codigo_invalido'; end if;
  insert into citizens(user_id, class_code, nick) values (auth.uid(), v_code, left(coalesce(nullif(trim(p_nick), ''), 'Aprendiz'), 20))
  on conflict (user_id) do update set class_code = excluded.class_code, nick = excluded.nick, updated_at = now();
  return v_name;
end $$;

revoke all on function public.join_class(text, text) from public, anon;
grant execute on function public.join_class(text, text) to authenticated;
grant execute on function public.is_teacher_of(text) to authenticated;
grant execute on function public.is_teacher_of_user(uuid) to authenticated;
grant select, insert, update, delete on public.classes, public.citizens, public.event_chunks to authenticated;
