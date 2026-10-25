const STOP_WORDS = new Set([
  'في',
  'من',
  'على',
  'إلى',
  'الى',
  'عن',
  'ان',
  'أن',
  'إن',
  'هذا',
  'هذه',
  'ذلك',
  'تلك',
  'التي',
  'الذي',
  'كان',
  'كانت',
  'قد',
  'كما',
  'بعد',
  'قبل',
  'مع',
  'أو',
  'او',
  'ثم',
  'بين',
  'كل',
  'لم',
  'لن',
  'هو',
  'هي',
  'هم',
  'ما',
  'لا',
  'حتى',
  'عند',
  'هناك',
  'اليوم',
  'تم',
  'يتم',
  'حول',
  'خلال',
  'دون',
  'منذ',
  'لكن',
  'بل',
  'إذا',
  'اذا',
])

export function normalizeArabic(input: string): string {
  return input
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function stemToken(token: string): string | null {
  if (token.length < 2 || STOP_WORDS.has(token)) return null
  const stemmed = token.startsWith('ال') && token.length > 4 ? token.slice(2) : token
  if (stemmed.length < 2 || STOP_WORDS.has(stemmed)) return null
  return stemmed
}

export function tokenize(input: string): string[] {
  const unique: string[] = []
  for (const raw of normalizeArabic(input).split(/[\s-]+/)) {
    const token = stemToken(raw)
    if (token && !unique.includes(token)) unique.push(token)
  }
  return unique
}

export function buildKeywords(...parts: string[]): string[] {
  const unique: string[] = []
  for (const part of parts) {
    for (const token of tokenize(part)) {
      if (!unique.includes(token)) unique.push(token)
      if (unique.length >= 32) return unique
    }
  }
  return unique
}

export function primarySearchToken(tokens: string[]): string | null {
  if (tokens.length === 0) return null
  return [...tokens].sort((left, right) => right.length - left.length)[0] ?? null
}

export function slugify(input: string): string {
  const slug = normalizeArabic(input)
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
  return slug || 'khabar'
}

export function plainTextFromHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
