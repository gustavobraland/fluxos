# Flux OS — Resumo do Projeto

Plataforma operacional AI-native para times de conteúdo esportivo e iGaming (BraLand/BraBet).
Última atualização: 2026-05-30.

---

## Stack

- **Next.js 16.2.6** (App Router + Turbopack) · **React 19** · **TypeScript** (strict)
- **Bun** (gerenciador de pacotes / runtime de dev)
- **Zustand v5** (estado) + `persist` (localStorage)
- **Framer Motion** (animações) · **lucide-react** (ícones) · **sonner** (toasts)
- Estilo: **inline styles + CSS custom properties** (tokens em `globals.css`); Tailwind v4 presente para utilitários pontuais
- Sem `vercel.json` (deploy zero-config no Vercel)

> ⚠️ Esta é uma versão modificada do Next.js (ver `AGENTS.md`) — APIs podem diferir do padrão.

---

## Módulos / Features

| Rota | O que faz |
|---|---|
| `/dashboard` | Métricas reais do pipeline, atividade recente, deadlines, plataformas. Botões navegam. |
| `/timeline` | Jogos dos próximos 7 dias (30 times prioritários), via API-Football. Busca/filtro por categoria, seleção → War Room. |
| `/warroom` | **Polling inteligente** do jogo (economia de créditos), escalação, pré-packs (win/draw/loss), 3 gatilhos de conteúdo (gol/intervalo/fim), deploy → Multipost. **Multi-jogos** com abas. Mock dev (`▶ Simular jogo`). |
| `/multipost` | Upload de mídia (img/vídeo), **refino de copy por IA** (3 tiers), copies por plataforma com char counter, preview por plataforma (IG/Shorts/TT/FB/X). Recebe drafts do War Room e dos Prompts. |
| `/prompts` | Biblioteca de prompts (8 padrão + custom), por categoria/tom, "Usar" → carrega no Multipost com **preenchimento de variáveis `{{var}}`**. |
| `/assets` | Galeria de emblemas dos 30 times + selecões + marca (CDN da API-Football, zero storage). Busca, filtros, copiar URL / download / inserir. |
| `/approvals` | Revisão com **arte em destaque (hero)**, **pins** numerados na imagem, comentários, **Pedir ajuste** (texto obrigatório), quick actions na lista, atalhos (A/R/↑↓/Esc). |
| `/calendar` | Eventos sincronizados do War Room (jogos com escudos + resultado no FT) + eventos manuais. |
| `/analytics` | Seção **"Produção interna"** com dados reais (pipeline, aprovações, prompts, jogos, gráfico 7 dias). Métricas de plataforma aguardam conexão. |
| `/reports` | Daily Reports — criar/listar/deletar + **"Gerar resumo do dia"** a partir da atividade real. |
| `/pipeline`, `/integrations`, `/settings` | Kanban de tasks · integrações · configurações (inclui **Brand Voice**). |

---

## Stores (Zustand) — `src/store/`

| Store | Conteúdo | Persiste? |
|---|---|---|
| `useWarRoomStore` | `activeFixtures[]`, `selectedFixtureId`, sessões por jogo (lineup/liveData/queue/prePacks/matchEnded), `isPolling`, `requestsUsed` | não (dado ao vivo) |
| `useFixturesStore` | fixtures do timeline, cache 10 min | não |
| `useCalendarStore` | eventos do calendário | ✅ `flux-calendar` |
| `useApprovalsStore` | itens de aprovação (status + comentários) | ✅ `flux-approvals` |
| `usePromptsStore` | prompts (uso/edição) | ✅ `flux-prompts` |
| `useReportStore` | daily reports | ✅ `flux-reports` |
| `useMultipostStore` | bridge de draft (warroom/prompt/manual) | não |
| `useWorkspaceStore` | brand voice | ✅ |
| `usePipelineStore`, `useAppStore`, `useIntegrationsStore`, `useTimelineStore`, `useFootballStore`, `useI18nStore` | tasks, tema/UI, integrações, SSE legado, etc. | varia |

---

## Serviços e rotas

**Services (`src/services/`)** — War Room:
- `warroom-polling.ts` — polling adaptativo (3min normal · 1min no fim · pausa no HT · para no FT · reserva 5 créditos · só o jogo selecionado).
- `warroom-lineup.ts` — escalação (1 fetch, cacheado).
- `warroom-content.ts` — gatilhos gol/intervalo/fim → fila + pré-pack + draft Multipost + evento no calendário.
- `warroom-mock.ts` — simulação dev (NS→gol→HT→gol→FT), sem gastar quota.

**API routes (`src/app/api/`)**:
- `football/live`, `football/upcoming`, `football/fixture?id=`, `football/lineup?fixture=`, `fixtures` (date-based) — proxy server-side da API-Football (chave só no servidor).
- `ai/refine-copy` — refino de copy em 3 tiers (ver IA).
- `ai/enrich`, `events/stream` (SSE legado).

**Libs úteis (`src/lib/`)**: `teams.ts` / `teams30.ts` (30 times, IDs **verificados**), `insights.ts` (agregações reais), `platform-limits.ts`, `fixtures-client.ts` (helpers BRT), `supabase.ts` + `supabaseSync.ts`.

---

## IA — refino de copy (`/api/ai/refine-copy`)

Três tiers com fallback automático (nunca quebra a UI):
1. **Anthropic** — só se `ANTHROPIC_API_KEY` setada (melhor qualidade).
2. **Pollinations** — grátis e sem chave (ambiente de teste, best-effort, timeout 6s). `AI_FREE_TIER=off` desliga.
3. **Adaptação local** determinística — sempre funciona, sem rede.

> Histórico: tentamos Gemini, mas o projeto da chave fornecida vinha com `403 PERMISSION_DENIED` (bloqueio no lado Google). Por isso a rota usa Anthropic + Pollinations + local.

---

## Persistência

- **localStorage** (já ativo): prompts, calendário, aprovações, reports sobrevivem ao reload.
- **Supabase** (REST/PostgREST, sem SDK): `src/lib/supabase.ts` + `supabaseSync.ts`. Na carga, **nuvem vence**; em cada mudança, **push** (debounce 800ms). Gated por env — no-op se não configurado.
  - ⚠️ **Pendente:** rodar `supabase/schema.sql` no SQL Editor do projeto (cria a tabela `flux_state`). Sem isso, fica só no localStorage.

---

## Identidade visual

- **Tema claro como padrão** (`:root`), com `[data-theme="dark"]`. Toggle funciona.
- Marca **vermelho `#E0201A`** (sem gradiente — `--grad`/`--coral` resolvem pra vermelho sólido).
- **`FluxLogo`** (`components/layout/FluxLogo.tsx`): "F" em 3 blocos (meio vermelho) + wordmark FLUX/OS (Arial Black). Favicon SVG em `public/favicon.svg`.
- Fonte **Inter**. Tokens em `src/app/globals.css`.

---

## Variáveis de ambiente (nomes — ver `.env.example`)

**Obrigatórias:** `FOOTBALL_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
**Recomendada:** `NEXT_PUBLIC_APP_URL`
**Opcionais:** `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `AI_FREE_TIER`, `AI_FREE_MODEL`, `NEXT_PUBLIC_WORKSPACE_NAME`, `FOOTBALL_POLL_INTERVAL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

> `.env.local` é gitignored. Nenhuma chave hardcoded em `src/` (auditado).

---

## Regras permanentes (importante)

- **Nunca inventar dados de jogos** — sempre da API. Deduplicar por `fixture.id`. Horários em **BRT**.
- **IDs de times verificados** em `teams30.ts`/`teams.ts` (os IDs dos specs vinham errados; usar os verificados).
- **Chaves só em env**, server-side, **nunca hardcoded**.
- **Economia de créditos** no War Room: monitorar só gol/HT/FT; não pollar com `requestsUsed ≥ 95`; pausar no HT; parar no FT.

---

## Git / Deploy

- Repo: `https://github.com/gustavobraland/fluxos.git` · branch `main` · remote `origin` configurado.
- Commits prontos localmente (último: identidade visual). **Falta autenticar e dar `git push`** (ver `DEPLOY_COPILOT.md`).
- Deploy: Vercel (zero-config Next.js) + domínio Hostinger (A `76.76.21.21` na raiz, CNAME `cname.vercel-dns.com` no www).
- **`DEPLOY_COPILOT.md`** — prompt pronto pra colar no GitHub Copilot conduzir o deploy.

### Pendências
1. `git push` (autenticar com `gh` ou PAT).
2. Conectar no Vercel + setar env vars.
3. Apontar domínio Hostinger.
4. Rodar `supabase/schema.sql` (persistência na nuvem).
5. (Opcional) IA real confiável: chave Anthropic ou Groq.
6. (Opcional) Publicação real nas redes — aguardando acesso às contas do Canal BRA.

---

## Verificação rápida

```bash
bun install
bun run dev        # http://localhost:3000
bun run build      # 20 rotas, 0 erros TS
bun run lint
```
