const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩'

export const ARCHIVE_FIRST_YEAR = 2010

export const ARABIC_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
] as const

export interface EditionBounds {
  empty: boolean
  issueNumber?: number
  start?: Date
  end?: Date
  searchError?: string
}

export function archiveYears(now = new Date()): number[] {
  const end = Math.max(now.getFullYear(), ARCHIVE_FIRST_YEAR)
  const years: number[] = []
  for (let year = end; year >= ARCHIVE_FIRST_YEAR; year -= 1) years.push(year)
  return years
}

export function latinDigits(value: string): string {
  return value.replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)))
}

function startOfLocalDay(year: number, monthIndex: number, day: number): Date {
  return new Date(year, monthIndex, day, 0, 0, 0, 0)
}

function validCalendarDay(year: number, month: number, day: number): Date | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  if (year < ARCHIVE_FIRST_YEAR || year > 2100) return null
  const start = startOfLocalDay(year, month - 1, day)
  if (start.getFullYear() !== year || start.getMonth() !== month - 1 || start.getDate() !== day) return null
  return start
}

function parseDay(value: string): { start: Date; end: Date } | null {
  const yearFirst = value.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/)
  const dayFirst = value.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/)
  const match = yearFirst ?? dayFirst
  if (!match) return null
  const year = Number(yearFirst ? match[1] : match[3])
  const month = Number(match[2])
  const day = Number(yearFirst ? match[3] : match[1])
  const start = validCalendarDay(year, month, day)
  if (!start) return null
  return { start, end: startOfLocalDay(year, month - 1, day + 1) }
}

function rangeFor(year: number, month?: number | null): { start: Date; end: Date } | null {
  if (!Number.isInteger(year) || year < ARCHIVE_FIRST_YEAR || year > 2100) return null
  if (month == null) {
    return { start: startOfLocalDay(year, 0, 1), end: startOfLocalDay(year + 1, 0, 1) }
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) return null
  return { start: startOfLocalDay(year, month - 1, 1), end: startOfLocalDay(year, month, 1) }
}

export function resolveEditionBounds(input: {
  year?: number | null
  month?: number | null
  search?: string
}): EditionBounds {
  const year = input.year ?? null
  const month = year ? (input.month ?? null) : null
  let start: Date | undefined
  let end: Date | undefined
  if (year) {
    const range = rangeFor(year, month)
    if (!range) return { empty: true, searchError: 'السنة أو الشهر غير صالح.' }
    start = range.start
    end = range.end
  }

  const search = latinDigits(input.search ?? '')
    .trim()
    .replace(/^العدد\s*/u, '')
    .trim()
  if (!search) return { empty: false, start, end }

  if (/^\d{1,6}$/.test(search)) {
    const issueNumber = Number(search)
    if (!Number.isInteger(issueNumber) || issueNumber < 1 || issueNumber > 100000) {
      return { empty: true, searchError: 'رقم العدد غير صالح.' }
    }
    return { empty: false, issueNumber, start, end }
  }

  const day = parseDay(search)
  if (!day) return { empty: true, searchError: 'ابحثوا برقم العدد أو بتاريخ مثل 2026-10-20.' }
  const nextStart = start && start > day.start ? start : day.start
  const nextEnd = end && end < day.end ? end : day.end
  if (nextStart >= nextEnd) return { empty: true }
  return { empty: false, start: nextStart, end: nextEnd }
}

export function editionWithinBounds(
  edition: { issueNumber: number; publishedAt: Date | null },
  bounds: EditionBounds,
): boolean {
  if (bounds.empty) return false
  if (bounds.issueNumber != null && edition.issueNumber !== bounds.issueNumber) return false
  if (!bounds.start && !bounds.end) return true
  if (!edition.publishedAt) return false
  if (bounds.start && edition.publishedAt < bounds.start) return false
  if (bounds.end && edition.publishedAt >= bounds.end) return false
  return true
}
