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

-- ─── Storage: bucket público p/ hospedar mídia antes de publicar ─────────────
-- TikTok (PULL_FROM_URL) e YouTube precisam de uma URL pública do vídeo.
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects
  for select to public using (bucket_id = 'media');

drop policy if exists "media auth upload" on storage.objects;
create policy "media auth upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'media');

drop policy if exists "media auth update" on storage.objects;
create policy "media auth update" on storage.objects
  for update to authenticated using (bucket_id = 'media') with check (bucket_id = 'media');

-- ─── Pipeline Tasks ───────────────────────────────────────────────────────────
-- Tabela principal de tarefas do Pipeline. Persiste entre sessões/dispositivos.
-- RLS: todos os usuários autenticados podem ler e editar (workspace compartilhado).
create table if not exists public.pipeline_tasks (
  id             uuid primary key default gen_random_uuid(),
  workspace_id   text not null default 'braland',
  title          text not null,
  description    text,
  type           text,                          -- TaskType: 'Copy' | 'Design' | 'Motion' | 'Copy + Design' | 'Estratégia'
  status         text not null default 'backlog', -- TaskStatus: 'backlog' | 'production' | 'review' | 'ready' | 'published'
  platforms      text[],                        -- PlatformId[]
  assigned_to    text[],                        -- emails dos responsáveis
  due_date       date,
  created_by     text,                          -- email de quem criou
  priority       boolean default false,
  priority_level text,                          -- 'low' | 'medium' | 'high'
  tags           text[],
  reference_url  text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.pipeline_tasks enable row level security;

-- RLS: anon + authenticated (auth real feita pelo proxy.ts no nível do Next.js,
-- assim como flux_state — a anon key é pública por design do Supabase).
drop policy if exists "pipeline workspace" on public.pipeline_tasks;
create policy "pipeline workspace" on public.pipeline_tasks
  for all to anon, authenticated using (true) with check (true);

-- updated_at automático
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_pipeline_updated_at on public.pipeline_tasks;
create trigger trg_pipeline_updated_at
  before update on public.pipeline_tasks
  for each row execute function public.set_updated_at();

-- ─── Approvals (histórico de tarefas publicadas via Pipeline) ─────────────────
create table if not exists public.approvals (
  id           uuid primary key default gen_random_uuid(),
  task_id      uuid references public.pipeline_tasks(id) on delete set null,
  workspace_id text not null default 'braland',
  title        text,
  platform     text,
  asset_url    text,
  status       text not null default 'pending', -- 'pending' | 'approved' | 'rejected' | 'published'
  approved_by  text,
  approved_at  timestamptz,
  published_at timestamptz,
  created_at   timestamptz not null default now()
);

alter table public.approvals enable row level security;

drop policy if exists "approvals workspace" on public.approvals;
create policy "approvals workspace" on public.approvals
  for all to anon, authenticated using (true) with check (true);

-- ─── Daily Reports ────────────────────────────────────────────────────────────
-- Um relatório por usuário por dia (UNIQUE). CEO e Admin veem todos, demais só o próprio.
create table if not exists public.daily_reports (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      text not null default 'braland',
  user_email        text not null,
  user_name         text,
  role              text,
  report_date       date not null default current_date,
  content           text not null,
  tasks_completed   integer default 0,
  tasks_in_progress integer default 0,
  blockers          text,
  created_at        timestamptz not null default now(),
  unique (user_email, report_date)
);

alter table public.daily_reports enable row level security;

drop policy if exists "reports own or admin" on public.daily_reports;
create policy "reports own or admin" on public.daily_reports
  for select to authenticated
  using (
    auth.email() = user_email
    or auth.email() in ('gustavo@braland.com.br', 'jaden@braland.com.br')
  );

drop policy if exists "reports own insert" on public.daily_reports;
create policy "reports own insert" on public.daily_reports
  for insert to authenticated with check (auth.email() = user_email);

drop policy if exists "reports own update" on public.daily_reports;
create policy "reports own update" on public.daily_reports
  for update to authenticated
  using (auth.email() = user_email) with check (auth.email() = user_email);

drop policy if exists "reports own delete" on public.daily_reports;
create policy "reports own delete" on public.daily_reports
  for delete to authenticated using (auth.email() = user_email);

-- ─── Migrations idempotentes (se as tabelas já existiam antes destas versões) ──
-- Se você criou pipeline_tasks antes de Jun/2026, rode estas linhas no SQL Editor:

-- Adiciona coluna reference_url se não existir
alter table public.pipeline_tasks add column if not exists reference_url text;

-- Corrige RLS para incluir anon (necessário para o store usar anon key diretamente)
-- (já está no bloco acima — rode o schema completo ou só estes DROPs/CREATEs)
-- drop policy if exists "pipeline workspace" on public.pipeline_tasks;
-- create policy "pipeline workspace" on public.pipeline_tasks
--   for all to anon, authenticated using (true) with check (true);
-- drop policy if exists "approvals workspace" on public.approvals;
-- create policy "approvals workspace" on public.approvals
--   for all to anon, authenticated using (true) with check (true);

-- ─── Chat interno da equipe ───────────────────────────────────────────────────
create table if not exists public.chat_messages (
  id           uuid primary key default gen_random_uuid(),
  workspace_id text not null default 'braland',
  user_email   text,                 -- autor (email do Flux)
  user_name    text,                 -- nome exibido
  text         text not null,
  created_at   timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

-- RLS: anon + authenticated (mesmo padrão de pipeline_tasks/flux_state).
drop policy if exists "chat workspace" on public.chat_messages;
create policy "chat workspace" on public.chat_messages
  for all to anon, authenticated using (true) with check (true);

-- índice p/ leitura cronológica
create index if not exists idx_chat_created on public.chat_messages (workspace_id, created_at);

-- Realtime: habilita broadcast de INSERT na tabela (chat instantâneo).
-- Idempotente: ignora se já estiver na publication.
do $$ begin
  alter publication supabase_realtime add table public.chat_messages;
exception when duplicate_object then null; end $$;
