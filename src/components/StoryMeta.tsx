import { Link } from 'react-router-dom'
import { deliveryImage } from '../lib/cloudinary.ts'
import { formatArabicDateTime, formatNewsTime } from '../lib/dates.ts'
import { categoryBadgeColor } from '../lib/home.ts'

export function NewsImage({
  src,
  alt = '',
  width,
  className = '',
  priority = false,
}: {
  src: string
  alt?: string
  width: number
  className?: string
  priority?: boolean
}) {
  if (!src) return <div className={`bg-brand-cream ${className}`} aria-hidden="true" />
  return (
    <img
      src={deliveryImage(src, width)}
      alt={alt}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      draggable={false}
    />
  )
}

export function CategoryBadge({ name, slug }: { name: string; slug: string }) {
  return (
    <span
      className="inline-block max-w-full truncate px-2 py-0.5 text-[0.7rem] font-bold leading-5 text-white"
      style={{ backgroundColor: categoryBadgeColor(slug || name) }}
    >
      {name}
    </span>
  )
}

export function NewsTime({ date, tone = 'muted' }: { date: Date | null; tone?: 'muted' | 'light' }) {
  if (!date) return null
  const className = tone === 'light' ? 'text-sm text-white/90' : 'text-xs font-semibold text-brand-muted'
  return (
    <time className={className} dateTime={date.toISOString()} title={formatArabicDateTime(date)}>
      {formatNewsTime(date)}
    </time>
  )
}

export function CategoryLink({ name, slug }: { name: string; slug: string }) {
  return (
    <Link
      to={`/category/${slug}`}
      className="inline-block max-w-full truncate px-2 py-0.5 text-[0.7rem] font-bold leading-5 text-white"
      style={{ backgroundColor: categoryBadgeColor(slug || name) }}
    >
      {name}
    </Link>
  )
}
