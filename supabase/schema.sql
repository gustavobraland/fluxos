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
