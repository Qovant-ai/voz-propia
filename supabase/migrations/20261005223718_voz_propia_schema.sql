-- Documentos de la app: mismo modelo que la base del artefacto (rutas tipo "items/abc", "state/progress")
create table public.docs (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  path text not null check (char_length(path) between 3 and 300),
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, path)
);
alter table public.docs enable row level security;

create policy "docs: leer los propios" on public.docs for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "docs: crear los propios" on public.docs for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "docs: editar los propios" on public.docs for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "docs: borrar los propios" on public.docs for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.docs from anon;
grant select, insert, update, delete on public.docs to authenticated;

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;
create trigger docs_touch_updated_at before update on public.docs
  for each row execute function public.touch_updated_at();

-- Quién puede usar Claude a través de la función del servidor (sin políticas: solo el servidor la lee)
create table public.allowed_users (email text primary key);
alter table public.allowed_users enable row level security;
revoke all on public.allowed_users from anon, authenticated;

-- Datos iniciales que se copian a la cuenta al registrarse (esquema privado, no expuesto)
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table private.seed_docs (
  email text not null,
  path text not null,
  data jsonb not null,
  primary key (email, path)
);

create function private.copy_seed_docs() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.docs (user_id, path, data)
  select new.id, s.path, s.data
  from private.seed_docs s
  where lower(s.email) = lower(new.email)
  on conflict (user_id, path) do nothing;
  return new;
end $$;
revoke all on function private.copy_seed_docs() from public, anon, authenticated;

create trigger on_auth_user_created_copy_seed after insert on auth.users
  for each row execute function private.copy_seed_docs();
