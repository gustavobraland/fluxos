/**
 * Upload em massa de fotos de jogadores para o Supabase Storage.
 *
 *   bun run scripts/upload-players.ts --folder="/caminho/da/pasta"
 *
 * Opções:
 *   --folder="..."   Pasta local com as fotos (obrigatório).
 *   --limit=N        Sobe no máximo N fotos (use --limit=5 para testar antes).
 *   --dry-run        Só lista o que faria, sem enviar nada.
 *
 * Destino:   bucket `media`  →  pasta `Players Photos 4K`
 * Requer:    SUPABASE_SERVICE_ROLE_KEY no .env.local (a anon key não faz upload).
 *            Supabase → Settings → API → service_role key
 */

import { readdir, readFile } from 'node:fs/promises'
import { join, basename, extname } from 'node:path'
import { homedir } from 'node:os'
import { createClient } from '@supabase/supabase-js'
import pLimit from 'p-limit'

const BUCKET = 'media'
const DEST = 'Players Photos 4K'
const EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const CONTENT_TYPE: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
}
const CONCURRENCY = 3
const RETRIES = 3
const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

// ─── Args ───────────────────────────────────────────────────────────────────
function arg(name: string): string | undefined {
  const hit = process.argv.find(a => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3).replace(/^["']|["']$/g, '') : undefined
}
const hasFlag = (name: string) => process.argv.includes(`--${name}`)

function expandHome(p: string): string {
  return p.startsWith('~') ? join(homedir(), p.slice(1)) : p
}

// Chave segura p/ o Supabase Storage: remove acentos (ç→c, ó→o, ã→a…) e troca
// qualquer caractere fora do conjunto permitido por "_". Evita "Invalid key".
function safeKey(name: string): string {
  return name
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // remove acentos/diacríticos
    .replace(/[^A-Za-z0-9 ._()\-]/g, '_')             // só ASCII seguro
    .replace(/_{2,}/g, '_')
    .trim()
}

// ─── Preflight ────────────────────────────────────────────────────────────────
const folderArg = arg('folder')
const limit = Number(arg('limit')) || Infinity
const dryRun = hasFlag('dry-run')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function die(msg: string): never {
  console.error(`\n✗ ${msg}\n`)
  process.exit(1)
}

if (!folderArg) die('Informe a pasta: --folder="/caminho/da/pasta"')
// Credenciais só são exigidas no envio real (dry-run lista localmente).
if (!dryRun) {
  if (!SUPABASE_URL) die('NEXT_PUBLIC_SUPABASE_URL ausente no .env.local')
  if (!SERVICE_KEY) {
    die(
      'SUPABASE_SERVICE_ROLE_KEY ausente no .env.local (a anon key não tem permissão de upload).\n' +
      '  Adicione:  SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key\n' +
      '  Encontre em: Supabase → Settings → API → service_role key',
    )
  }
}

const folder = expandHome(folderArg)
// Cliente criado só quando há credenciais (envio real); no dry-run fica nulo.
const supabase = (!dryRun && SUPABASE_URL && SERVICE_KEY)
  ? createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
  : null

// ─── Listar arquivos locais (recursivo) ───────────────────────────────────────
async function listLocalImages(dir: string): Promise<string[]> {
  let entries: { name: string; isDirectory(): boolean }[]
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    die(`Pasta não encontrada ou ilegível: ${dir}`)
  }
  const out: string[] = []
  for (const e of entries) {
    const full = join(dir, e.name)
    if (e.isDirectory()) {
      out.push(...await listLocalImages(full))
    } else if (EXTS.has(extname(e.name).toLowerCase())) {
      out.push(full)
    }
  }
  return out
}

// ─── Arquivos já existentes no destino (verificar antes) ───────────────────────
async function listExisting(): Promise<Set<string>> {
  const set = new Set<string>()
  if (!supabase) return set
  const PAGE = 1000
  let offset = 0
  for (;;) {
    const { data, error } = await supabase.storage.from(BUCKET).list(DEST, { limit: PAGE, offset })
    if (error) {
      console.warn(`  aviso: não consegui listar existentes (${error.message}) — seguindo sem skip prévio`)
      break
    }
    if (!data || data.length === 0) break
    for (const f of data) if (f.name) set.add(f.name)
    if (data.length < PAGE) break
    offset += PAGE
  }
  return set
}

// ─── Upload de 1 arquivo (com retry) ───────────────────────────────────────────
async function uploadOne(localPath: string): Promise<'sent' | 'skipped' | 'error'> {
  if (!supabase) return 'error'
  const name = basename(localPath)
  const key = safeKey(name)
  const ext = extname(name).toLowerCase()
  const contentType = CONTENT_TYPE[ext] ?? 'application/octet-stream'
  let buffer: Buffer
  try {
    buffer = await readFile(localPath)
  } catch {
    return 'error'
  }
  let lastErr = ''
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    const { error } = await supabase.storage.from(BUCKET).upload(`${DEST}/${key}`, buffer, {
      contentType,
      upsert: false,
    })
    if (!error) return 'sent'
    const msg = error.message || String(error)
    if (/exists|duplicate|already/i.test(msg)) return 'skipped' // já existe no Supabase
    lastErr = msg
    if (attempt < RETRIES) await sleep(500 * attempt)
  }
  console.error(`   ✗ ${name}: ${lastErr}`)
  return 'error'
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n📤 Upload de fotos → ${BUCKET}/${DEST}`)
  console.log(`   Pasta: ${folder}`)
  if (limit !== Infinity) console.log(`   Limite: ${limit} foto(s) (modo teste)`)
  if (dryRun) console.log('   DRY-RUN: nada será enviado\n')

  const all = await listLocalImages(folder)
  if (all.length === 0) die('Nenhuma imagem (jpg/jpeg/png/webp) encontrada na pasta.')

  const existing = await listExisting()
  console.log(`   ${all.length} imagem(ns) local · ${existing.size} já no Supabase\n`)

  // Define a fila respeitando o --limit (conta só os que NÃO existem ainda).
  const queue: string[] = []
  let preSkipped = 0
  for (const p of all) {
    // Compara pela chave segura (é o nome com que o arquivo fica no Storage).
    if (existing.has(safeKey(basename(p)))) { preSkipped++; continue }
    if (queue.length < limit) queue.push(p)
  }

  const total = queue.length
  let done = 0, sent = 0, skipped = preSkipped, errors = 0
  const run = pLimit(CONCURRENCY)

  await Promise.all(queue.map(localPath => run(async () => {
    const name = basename(localPath)
    if (dryRun) {
      done++
      console.log(`· ${done}/${total} (dry) ${name}`)
      return
    }
    const result = await uploadOne(localPath)
    done++
    if (result === 'sent') { sent++; console.log(`✓ ${done}/${total} ${name}`) }
    else if (result === 'skipped') { skipped++; console.log(`⏭ ${done}/${total} ${name} (já existe)`) }
    else { errors++; console.log(`✗ ${done}/${total} ${name} (erro)`) }
  })))

  console.log('\n──────── Resumo ────────')
  console.log(`✓ Enviados:  ${sent}`)
  console.log(`⏭ Ignorados: ${skipped} (já existiam)`)
  console.log(`✗ Erros:     ${errors}`)
  console.log(`Total local: ${all.length}\n`)
  if (errors > 0) process.exit(1)
}

main().catch((e) => die(e instanceof Error ? e.message : String(e)))
