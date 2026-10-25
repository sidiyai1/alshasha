import { Link } from 'react-router-dom'
import { formatArabicDate } from '../lib/dates.ts'
import type { Article } from '../types.ts'
import { DemoBadge } from './ui.tsx'

export function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="group flex h-full flex-col border border-brand-line bg-white">
      <Link to={`/article/${article.slug}`} className="block overflow-hidden bg-brand-cream" tabIndex={-1} aria-hidden="true">
        {article.imageUrl ? (
          <img src={article.imageUrl} alt="" className="aspect-[16/10] w-full bg-brand-cream object-contain" />
        ) : (
          <div className="aspect-[16/10] bg-brand-cream" />
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-brand-green">
          <span>{article.categoryName}</span>
          {article.isDemo ? <DemoBadge /> : null}
        </div>
        <h3 className="text-xl font-extrabold leading-snug">
          <Link to={`/article/${article.slug}`} className="hover:text-brand-green">
            {article.title}
          </Link>
        </h3>
        <p className="line-clamp-3 font-body text-base leading-8 text-brand-muted">{article.summary}</p>
        {article.publishedAt ? (
          <time className="mt-auto text-sm text-brand-muted" dateTime={article.publishedAt.toISOString()}>
            {formatArabicDate(article.publishedAt)}
          </time>
        ) : null}
      </div>
    </article>
  )
}
