-- App personal sin cuentas: los datos los lee y escribe solo la función "vp" (con la clave de servicio),
-- y cada dispositivo entra con una llave de acceso (en la base solo se guarda su huella SHA-256).

create table public.vp_docs (
  path text primary key check (char_length(path) between 3 and 300),
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.vp_docs enable row level security;
revoke all on public.vp_docs from anon, authenticated;
create trigger vp_docs_touch_updated_at before update on public.vp_docs
  for each row execute function public.touch_updated_at();

create table public.app_keys (
  hash text primary key check (hash ~ '^[0-9a-f]{64}$'),
  label text not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
alter table public.app_keys enable row level security;
revoke all on public.app_keys from anon, authenticated;

-- Datos iniciales (perfil, temas y lecturas guardadas)
insert into public.vp_docs (path, data)
select path, data from private.seed_docs where email = 'hello@qovant.ai'
on conflict (path) do nothing;

