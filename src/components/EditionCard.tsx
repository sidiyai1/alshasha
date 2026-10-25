import { Link } from 'react-router-dom'
import { formatArabicDate } from '../lib/dates.ts'
import type { Edition } from '../types.ts'
import { DemoBadge } from './ui.tsx'

export function EditionCard({ edition, heading = 'h3' }: { edition: Edition; heading?: 'h2' | 'h3' }) {
  const Title = heading
  return (
    <article className="h-full">
      <Link
        to={`/archive/${edition.id}`}
        className="group flex h-full flex-col border border-brand-line bg-white transition hover:-translate-y-0.5 hover:border-brand-green"
      >
        <div className="bg-brand-cream p-3">
          {edition.coverImageUrl ? (
            <img
              src={edition.coverImageUrl}
              alt=""
              loading="lazy"
              decoding="async"
              className="mx-auto aspect-[3/4] w-full border border-brand-line bg-white object-contain"
            />
          ) : (
            <div className="grid aspect-[3/4] place-items-center border border-dashed border-brand-line text-sm text-brand-muted">بلا غلاف</div>
          )}
        </div>
        <div className="bg-brand-green px-3 py-2 text-white">
          <p className="text-sm font-bold">العدد {edition.issueNumber}</p>
          {edition.publishedAt ? (
            <time className="mt-0.5 block text-xs text-white/85" dateTime={edition.publishedAt.toISOString()}>
              {formatArabicDate(edition.publishedAt)}
            </time>
          ) : (
            <p className="mt-0.5 text-xs text-white/85">بلا تاريخ</p>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 px-3 py-3">
          <Title className="text-lg font-extrabold text-brand-green group-hover:underline">{edition.title}</Title>
          {edition.isDemo ? <DemoBadge /> : null}
        </div>
      </Link>
    </article>
  )
}
