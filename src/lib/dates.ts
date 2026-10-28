const dateFormat = new Intl.DateTimeFormat('ar-EG', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  numberingSystem: 'latn',
})

const dateTimeFormat = new Intl.DateTimeFormat('ar-EG', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  numberingSystem: 'latn',
})

export function formatArabicDate(date: Date): string {
  return dateFormat.format(date)
}

export function formatArabicDateTime(date: Date): string {
  return dateTimeFormat.format(date)
}

const relativeFormat = new Intl.RelativeTimeFormat('ar', { numeric: 'auto' })

/** Short publication age for news cards. Older stories keep a full date. */
export function formatNewsTime(date: Date, now = new Date()): string {
  const minutes = Math.round((date.getTime() - now.getTime()) / 60000)
  const absMinutes = Math.abs(minutes)
  if (absMinutes < 1) return 'الآن'
  if (absMinutes < 60) return relativeFormat.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return relativeFormat.format(hours, 'hour')
  const days = Math.round(hours / 24)
  if (Math.abs(days) < 7) return relativeFormat.format(days, 'day')
  return formatArabicDate(date)
}

export function toDateTimeLocal(date: Date | null): string {
  if (!date) return ''
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function atLocalDate(isoDate: string, hours = 9, minutes = 0): Date {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1, hours, minutes, 0, 0)
}
