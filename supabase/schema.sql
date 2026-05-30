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
