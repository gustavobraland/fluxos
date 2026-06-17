// ─── Bandeiras por nome de seleção (flagcdn.com) ──────────────────────────────
// A API-Football devolve os nomes das seleções em inglês. Aqui mapeamos nome →
// código ISO-2 (o que o flagcdn usa). Bandeira: https://flagcdn.com/w160/{code}.png
//
// Uso: flagUrl(countryCode('Portugal'))  →  https://flagcdn.com/w160/pt.png

const NAME_TO_CODE: Record<string, string> = {
  // CONMEBOL
  brazil: 'br', argentina: 'ar', uruguay: 'uy', colombia: 'co', chile: 'cl',
  peru: 'pe', ecuador: 'ec', paraguay: 'py', venezuela: 've', bolivia: 'bo',
  // UEFA
  portugal: 'pt', france: 'fr', germany: 'de', spain: 'es', england: 'gb-eng',
  scotland: 'gb-sct', wales: 'gb-wls', netherlands: 'nl', holland: 'nl',
  croatia: 'hr', belgium: 'be', switzerland: 'ch', italy: 'it', serbia: 'rs',
  poland: 'pl', denmark: 'dk', sweden: 'se', norway: 'no', austria: 'at',
  ukraine: 'ua', 'czech republic': 'cz', czechia: 'cz', turkey: 'tr',
  'türkiye': 'tr', turkiye: 'tr', hungary: 'hu', greece: 'gr', romania: 'ro',
  slovakia: 'sk', slovenia: 'si', russia: 'ru', ireland: 'ie', iceland: 'is',
  finland: 'fi', albania: 'al',
  // CAF
  morocco: 'ma', senegal: 'sn', 'congo dr': 'cd', 'dr congo': 'cd',
  'democratic republic of congo': 'cd', ghana: 'gh', nigeria: 'ng',
  cameroon: 'cm', 'ivory coast': 'ci', "cote d'ivoire": 'ci', algeria: 'dz',
  tunisia: 'tn', egypt: 'eg', 'south africa': 'za', mali: 'ml',
  'cape verde': 'cv', 'burkina faso': 'bf',
  // AFC
  japan: 'jp', 'south korea': 'kr', 'korea republic': 'kr', iran: 'ir',
  'saudi arabia': 'sa', australia: 'au', qatar: 'qa', iraq: 'iq',
  uzbekistan: 'uz', jordan: 'jo', china: 'cn', 'united arab emirates': 'ae',
  uae: 'ae', oman: 'om',
  // CONCACAF
  'united states': 'us', usa: 'us', mexico: 'mx', canada: 'ca',
  'costa rica': 'cr', panama: 'pa', honduras: 'hn', jamaica: 'jm',
  'el salvador': 'sv', curacao: 'cw', curaçao: 'cw', haiti: 'ht',
  // OFC
  'new zealand': 'nz',
}

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos
    .replace(/\./g, '')
    .trim()
}

/** Código ISO-2 (flagcdn) para o nome da seleção, ou null se desconhecido. */
export function countryCode(teamName: string | null | undefined): string | null {
  if (!teamName) return null
  return NAME_TO_CODE[normalize(teamName)] ?? null
}

/** URL da bandeira no flagcdn (largura 160). */
export function flagUrl(code: string): string {
  return `https://flagcdn.com/w160/${code}.png`
}

// Nome em português da seleção (a API devolve em inglês). Canal brasileiro.
const PT_NAMES: Record<string, string> = {
  brazil: 'Brasil', argentina: 'Argentina', uruguay: 'Uruguai', colombia: 'Colômbia',
  chile: 'Chile', peru: 'Peru', ecuador: 'Equador', paraguay: 'Paraguai',
  venezuela: 'Venezuela', bolivia: 'Bolívia',
  portugal: 'Portugal', france: 'França', germany: 'Alemanha', spain: 'Espanha',
  england: 'Inglaterra', scotland: 'Escócia', wales: 'País de Gales',
  netherlands: 'Holanda', holland: 'Holanda', croatia: 'Croácia', belgium: 'Bélgica',
  switzerland: 'Suíça', italy: 'Itália', serbia: 'Sérvia', poland: 'Polônia',
  denmark: 'Dinamarca', sweden: 'Suécia', norway: 'Noruega', austria: 'Áustria',
  ukraine: 'Ucrânia', 'czech republic': 'Rep. Tcheca', czechia: 'Rep. Tcheca',
  turkey: 'Turquia', 'türkiye': 'Turquia', turkiye: 'Turquia', hungary: 'Hungria',
  greece: 'Grécia', romania: 'Romênia', russia: 'Rússia', ireland: 'Irlanda',
  morocco: 'Marrocos', senegal: 'Senegal', 'congo dr': 'Congo', 'dr congo': 'Congo',
  ghana: 'Gana', nigeria: 'Nigéria', cameroon: 'Camarões', 'ivory coast': 'Costa do Marfim',
  "cote d'ivoire": 'Costa do Marfim', algeria: 'Argélia', tunisia: 'Tunísia',
  egypt: 'Egito', 'south africa': 'África do Sul', mali: 'Mali', 'cape verde': 'Cabo Verde',
  japan: 'Japão', 'south korea': 'Coreia do Sul', 'korea republic': 'Coreia do Sul',
  iran: 'Irã', 'saudi arabia': 'Arábia Saudita', australia: 'Austrália', qatar: 'Catar',
  iraq: 'Iraque', uzbekistan: 'Uzbequistão', jordan: 'Jordânia', china: 'China',
  'united arab emirates': 'Emirados Árabes', uae: 'Emirados Árabes',
  'united states': 'Estados Unidos', usa: 'Estados Unidos', mexico: 'México',
  canada: 'Canadá', 'costa rica': 'Costa Rica', panama: 'Panamá', honduras: 'Honduras',
  jamaica: 'Jamaica', 'new zealand': 'Nova Zelândia',
}

/** Nome em português da seleção, ou o original se não mapeado. */
export function ptName(teamName: string | null | undefined): string {
  if (!teamName) return ''
  return PT_NAMES[normalize(teamName)] ?? teamName
}
