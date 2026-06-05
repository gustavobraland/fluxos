-- Flux OS — Supabase schema
-- Rode UMA vez no SQL Editor do projeto (Dashboard → SQL Editor → New query → cole → Run).
--
-- Estratégia: um documento JSONB por domínio (prompts / calendar / approvals),
-- chaveado por `key`. Simples de sincronizar e zero migração de colunas.

create table if not exists public.flux_state (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.flux_state enable row level security;

-- Ambiente de teste: acesso total via publishable/anon key.
-- (Quando for produção, troque por policies por usuário/auth.)
drop policy if exists "flux_state anon all" on public.flux_state;
create policy "flux_state anon all"
  on public.flux_state
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- ─── Onboarding (mostra só no 1º login de cada pessoa) ───────────────────────
create table if not exists public.user_onboarding (
  id           uuid primary key default gen_random_uuid(),
  user_email   text unique not null,
  completed_at timestamptz not null default now(),
  role         text
);

alter table public.user_onboarding enable row level security;

-- Cada usuário lê/insere apenas o próprio registro (via JWT do Google login).
drop policy if exists "own onboarding read" on public.user_onboarding;
create policy "own onboarding read"
  on public.user_onboarding for select to authenticated
  using (auth.email() = user_email);

drop policy if exists "own onboarding insert" on public.user_onboarding;
create policy "own onboarding insert"
  on public.user_onboarding for insert to authenticated
  with check (auth.email() = user_email);

-- ─── Trava de papel no servidor ──────────────────────────────────────────────
-- Mapa de papéis da equipe (fonte server-side). can_choose = liderança, que
-- pode escolher o papel livremente; os demais têm o papel forçado pelo mapa.
create table if not exists public.team_roles (
  email      text primary key,
  role       text not null,
  can_choose boolean not null default false
);

alter table public.team_roles enable row level security;
drop policy if exists "team_roles read" on public.team_roles;
create policy "team_roles read" on public.team_roles
  for select to authenticated using (true);

-- Seed dos membros (idempotente — rode quantas vezes quiser).
insert into public.team_roles (email, role, can_choose) values
  ('jaden@braland.com.br',    'ceo',             true),
  ('gustavo@braland.com.br',  'admin',           true),
  ('larissa@braland.com.br',  'project_manager', true),
  ('joao@braland.com.br',     'project_manager', true),
  ('wesley@braland.com.br',   'redator',         false),
  ('mirelli@braland.com.br',  'produtor',        false),
  ('bruna@braland.com.br',    'social_media',    false),
  ('wesleyd@braland.com.br',  'designer_lider',  false),
  ('juliano@braland.com.br',  'designer',        false),
  ('davi@braland.com.br',     'designer',        false),
  ('nicolas@braland.com.br',  'designer',        false),
  ('silvonei@braland.com.br', 'influencer',      false),
  ('julietta@braland.com.br', 'influencer',      false),
  ('braga@braland.com.br',    'influencer',      false),
  ('barba@braland.com.br',    'influencer',      false),
  ('andressa@braland.com.br', 'rh',              false)
on conflict (email) do update
  set role = excluded.role, can_choose = excluded.can_choose;

-- Antes de gravar: para membro não-liderança, ignora o role enviado pelo front
-- e grava o do mapa. Liderança (can_choose) e e-mails fora do mapa passam livres.
create or replace function public.enforce_team_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  mapped public.team_roles%rowtype;
begin
  select * into mapped from public.team_roles where email = lower(new.user_email);
  if found and mapped.can_choose = false then
    new.role := mapped.role;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_team_role on public.user_onboarding;
create trigger trg_enforce_team_role
  before insert or update on public.user_onboarding
  for each row execute function public.enforce_team_role();

-- ─── Conexões sociais (OAuth: Instagram / Facebook / TikTok / YouTube) ───────
-- Uma conexão por (usuário, plataforma) — upsert no callback.
create table if not exists public.social_connections (
  id            uuid primary key default gen_random_uuid(),
  user_email    text not null,
  platform      text not null,                -- 'instagram' | 'facebook' | 'tiktok' | 'youtube'
  access_token  text not null,
  refresh_token text,                         -- TikTok/YouTube (renovação)
  account_id    text,                         -- open_id / channel id / IG business id
  account_name  text,                         -- @username / nome do canal
  avatar_url    text,                         -- foto do perfil (UI)
  expires_at    timestamptz,
  created_at    timestamptz not null default now(),
  unique (user_email, platform)
);

-- Migração idempotente (se a tabela já existia da versão anterior).
alter table public.social_connections add column if not exists refresh_token text;
alter table public.social_connections add column if not exists avatar_url text;
do $$ begin
  alter table public.social_connections add constraint social_connections_user_platform_key unique (user_email, platform);
exception when duplicate_table or duplicate_object then null; end $$;

alter table public.social_connections enable row level security;

-- Cada usuário lê/grava/apaga apenas as próprias conexões (via JWT do login).
drop policy if exists "social own read" on public.social_connections;
create policy "social own read" on public.social_connections
  for select to authenticated using (auth.email() = user_email);

drop policy if exists "social own insert" on public.social_connections;
create policy "social own insert" on public.social_connections
  for insert to authenticated with check (auth.email() = user_email);

drop policy if exists "social own update" on public.social_connections;
create policy "social own update" on public.social_connections
  for update to authenticated using (auth.email() = user_email) with check (auth.email() = user_email);

drop policy if exists "social own delete" on public.social_connections;
create policy "social own delete" on public.social_connections
  for delete to authenticated using (auth.email() = user_email);
