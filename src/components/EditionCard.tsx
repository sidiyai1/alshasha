import { Link } from 'react-router-dom'
import { coverThumbnail } from '../lib/cloudinary.ts'
import { formatArabicDate } from '../lib/dates.ts'
import { isSafeMediaUrl } from '../lib/validators.ts'
import type { Edition } from '../types.ts'
import { DemoBadge } from './ui.tsx'

export function EditionCard({
  edition,
  heading = 'h3',
  compact = false,
}: {
  edition: Edition
  heading?: 'h2' | 'h3'
  compact?: boolean
}) {
  const Title = heading
  const pdf = edition.pdfUrl.trim()
  const canDownload = isSafeMediaUrl(pdf)
  if (compact) {
    return (
      <article className="border border-brand-line bg-white">
        <Link to={`/archive/${edition.id}`} className="block">
          {edition.coverImageUrl ? (
            <img
              src={coverThumbnail(edition.coverImageUrl, 360)}
              alt=""
              loading="lazy"
              decoding="async"
              className="mx-auto aspect-[3/4] w-full bg-white object-contain object-center"
            />
          ) : (
            <div className="grid aspect-[3/4] place-items-center border border-dashed border-brand-line text-sm text-brand-muted">بلا غلاف</div>
          )}
          <div className="flex flex-col gap-1 px-3 py-3">
            <span className="text-sm font-bold text-brand-green">العدد {edition.issueNumber}</span>
            <Title className="text-base font-extrabold leading-snug text-brand-ink">{edition.title}</Title>
            {edition.publishedAt ? (
              <time className="text-sm text-brand-muted" dateTime={edition.publishedAt.toISOString()}>
                {formatArabicDate(edition.publishedAt)}
              </time>
            ) : (
              <span className="text-sm text-brand-muted">بلا تاريخ</span>
            )}
          </div>
        </Link>
      </article>
    )
  }
  return (
    <article className="flex h-full flex-col border border-brand-line bg-white">
      <Link to={`/archive/${edition.id}`} className="block bg-white p-2" aria-hidden="true" tabIndex={-1}>
        {edition.coverImageUrl ? (
          <img
            src={coverThumbnail(edition.coverImageUrl)}
            alt=""
            loading="lazy"
            decoding="async"
            className="mx-auto aspect-[3/4] w-full bg-white object-contain object-center"
          />
        ) : (
          <div className="grid aspect-[3/4] place-items-center border border-dashed border-brand-line text-sm text-brand-muted">بلا غلاف</div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 px-3 py-3">
        <p className="text-sm font-bold text-brand-green">العدد {edition.issueNumber}</p>
        <Title className="text-lg font-extrabold leading-snug text-brand-ink">
          <Link to={`/archive/${edition.id}`} className="hover:text-brand-green">
            {edition.title}
          </Link>
        </Title>
        {edition.publishedAt ? (
          <time className="text-sm text-brand-muted" dateTime={edition.publishedAt.toISOString()}>
            {formatArabicDate(edition.publishedAt)}
          </time>
        ) : (
          <p className="text-sm text-brand-muted">بلا تاريخ</p>
        )}
        {edition.isDemo ? <DemoBadge /> : null}
        <div className="mt-auto grid gap-2 pt-2">
          <Link to={`/archive/${edition.id}`} className="bg-brand-green px-3 py-2 text-center text-sm font-bold text-white">
            قراءة العدد
          </Link>
          {canDownload ? (
            <a
              href={pdf}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="border border-brand-green px-3 py-2 text-center text-sm font-bold text-brand-green"
            >
              تحميل PDF
            </a>
          ) : (
            <span className="border border-brand-line px-3 py-2 text-center text-sm font-bold text-brand-muted">الملف غير متوفر</span>
          )}
        </div>
      </div>
    </article>
  )
}
