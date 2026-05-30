# Deploy do Flux OS — Prompt para o GitHub Copilot

Cole **tudo o que está entre as linhas `---`** no **GitHub Copilot Chat do VS Code em modo agente**
(o seletor de modo fica no topo do chat → escolha **Agent**), e siga as instruções.
O Copilot vai rodar comandos no terminal e parar quando precisar de uma ação sua.

> **Importante:** nunca cole chaves/segredos neste arquivo nem no chat. Os valores reais
> ficam no seu `.env.local` (que não vai pro Git) e você os digita nos prompts da CLI do Vercel.

---

Você é meu assistente de deploy. O projeto é um app **Next.js 16** (App Router, Turbopack, gerenciador **Bun**) chamado **Flux OS**, já com commits prontos na branch `main` e remote `origin` = `https://github.com/gustavobraland/fluxos.git`. Quero publicá-lo no **Vercel** e apontar um **domínio da Hostinger**. Execute e me guie **uma tarefa por vez**, parando quando precisar de uma ação minha (login, colar valor, mexer em painel web). **Regra de ouro: nunca escreva segredos em arquivos nem no chat — valores sensíveis só via prompt da CLI ou no dashboard.**

**TAREFA 1 — Subir pro GitHub**
- Rode `git status`, `git remote -v`, `git log --oneline -3` para confirmar o estado.
- **NÃO** rode `git init`, **NÃO** crie README nem um "first commit" — o repositório já está pronto, isso quebraria o histórico.
- Rode `git push -u origin main`. Se pedir autenticação, me oriente a usar **`gh auth login`** (GitHub CLI, login pelo navegador) **ou** um **Personal Access Token** com escopo `repo`. Se falhar, mostre o erro exato e pare.

**TAREFA 2 — Deploy no Vercel (via CLI)**
- Instale a CLI: `npm i -g vercel`.
- `vercel login` (me avise para autenticar no navegador).
- Na raiz: `vercel link` para criar/conectar o projeto (framework Next.js é detectado automaticamente; **não** crie `vercel.json`).
- Configure as variáveis de ambiente lendo os **nomes** do arquivo `.env.example`. Para cada uma, use `vercel env add <NOME> production` e **eu colo o valor no prompt da CLI** (não me peça para colar segredo em arquivo):
  - **Obrigatórias:** `FOOTBALL_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - **Recomendada:** `NEXT_PUBLIC_APP_URL` (a URL final do domínio)
  - **Opcionais:** `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `AI_FREE_TIER`, `AI_FREE_MODEL`, `NEXT_PUBLIC_WORKSPACE_NAME`, `FOOTBALL_POLL_INTERVAL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- Rode `vercel --prod` para o deploy de produção. Se o build falhar por causa do **Bun**, me mostre o erro e ajuste o **Install Command** para `bun install` em Project → Settings → General. Me dê a URL `*.vercel.app` resultante.

**TAREFA 3 — Domínio da Hostinger**
- No Vercel, adicione o domínio raiz e o `www` (`vercel domains add <dominio>` ou no dashboard → Settings → Domains).
- Me diga exatamente os registros DNS para criar na **Hostinger** (hPanel → Domínios → DNS / Zona DNS):
  - Raiz (`@`): registro **A** → `76.76.21.21`
  - `www`: registro **CNAME** → `cname.vercel-dns.com`
  - Se a Hostinger não aceitar **A** na raiz, use o registro alternativo (ALIAS/ANAME) que o Vercel sugerir.
- Me lembre de **remover registros A/CNAME antigos conflitantes**. O SSL é emitido automaticamente pelo Vercel após a propagação.

**TAREFA 4 — Pós-deploy**
- Me lembre de rodar o SQL em `supabase/schema.sql` no **SQL Editor do Supabase** (cria a tabela `flux_state` usada pela persistência).
- Quando o domínio propagar, atualize `NEXT_PUBLIC_APP_URL` no Vercel para a URL final e faça **redeploy** (as `NEXT_PUBLIC_*` são embutidas no build).

Comece pela Tarefa 1 e confirme comigo antes de avançar para a próxima.

---

## Referência rápida (caso queira fazer manual)

| Variável | Obrigatória | Observação |
|---|---|---|
| `FOOTBALL_API_KEY` | ✅ | dados de jogos (api-sports.io) |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | persistência |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | publishable key (pública) |
| `NEXT_PUBLIC_APP_URL` | 🔸 recomendada | URL final do domínio |
| `ANTHROPIC_API_KEY` | ⬜ opcional | IA tier 1 |
| `AI_FREE_TIER` | ⬜ opcional | `on`/`off` (default on) |
| demais | ⬜ opcional | ver `.env.example` |

- **DNS Hostinger:** raiz `@` → A `76.76.21.21` · `www` → CNAME `cname.vercel-dns.com`
- **Sem `vercel.json`** — Next.js é zero-config no Vercel.
