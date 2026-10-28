import { Link } from 'react-router-dom'
import type { Article } from '../types.ts'
import { Button, DemoBadge, SectionTitle } from './ui.tsx'
import { CategoryLink, NewsImage, NewsTime } from './StoryMeta.tsx'

export function LatestNews({
  articles,
  hasMore,
  loading,
  onMore,
}: {
  articles: Article[]
  hasMore: boolean
  loading: boolean
  onMore: () => void
}) {
  if (articles.length === 0 && !hasMore) return null
  return (
    <section aria-labelledby="latest-heading">
      <SectionTitle id="latest-heading" title="آخر الأخبار" />
      <ul className="divide-y divide-brand-line border-y border-brand-line">
        {articles.map((article) => (
          <li key={article.id} className="py-3">
            <article className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <CategoryLink name={article.categoryName} slug={article.categorySlug} />
                  {article.isDemo ? <DemoBadge /> : null}
                </div>
                <h3 className="mt-2 text-base font-extrabold leading-snug sm:text-lg">
                  <Link to={`/article/${article.slug}`} className="hover:text-brand-green">
                    {article.title}
                  </Link>
                </h3>
                <div className="mt-2">
                  <NewsTime date={article.publishedAt} />
                </div>
              </div>
              <Link to={`/article/${article.slug}`} className="shrink-0" tabIndex={-1} aria-hidden="true">
                <NewsImage src={article.imageUrl} width={320} className="h-20 w-24 bg-brand-cream object-contain sm:h-24 sm:w-32" />
              </Link>
            </article>
          </li>
        ))}
      </ul>
      {hasMore ? (
        <div className="mt-5 text-center">
          <Button type="button" variant="ghost" onClick={onMore} disabled={loading} aria-busy={loading}>
            {loading ? 'جارٍ التحميل…' : 'عرض المزيد'}
          </Button>
        </div>
      ) : null}
    </section>
  )
}
