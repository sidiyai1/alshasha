import { Link } from 'react-router-dom'
import type { Article } from '../types.ts'
import { CategoryLink, NewsImage, NewsTime } from './StoryMeta.tsx'
import { DemoBadge } from './ui.tsx'

export function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="group flex h-full flex-col border border-brand-line bg-white">
      <Link to={`/article/${article.slug}`} className="block overflow-hidden" tabIndex={-1} aria-hidden="true">
        <NewsImage src={article.imageUrl} width={720} className="aspect-[16/10] w-full bg-brand-cream object-contain" />
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryLink name={article.categoryName} slug={article.categorySlug} />
          {article.isDemo ? <DemoBadge /> : null}
        </div>
        <h3 className="text-xl font-extrabold leading-snug">
          <Link to={`/article/${article.slug}`} className="hover:text-brand-green">
            {article.title}
          </Link>
        </h3>
        {article.summary ? <p className="line-clamp-3 font-body text-base leading-8 text-brand-muted">{article.summary}</p> : null}
        <div className="mt-auto">
          <NewsTime date={article.publishedAt} />
        </div>
      </div>
    </article>
  )
}
