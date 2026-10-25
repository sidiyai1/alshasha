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

export function toDateTimeLocal(date: Date | null): string {
  if (!date) return ''
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function atLocalDate(isoDate: string, hours = 9, minutes = 0): Date {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1, hours, minutes, 0, 0)
}
