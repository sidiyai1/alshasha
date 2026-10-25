import { Link } from 'react-router-dom'
import type { Article } from '../types.ts'

export function BreakingTicker({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null
  const loop = [...articles, ...articles]
  return (
    <section className="border-y border-brand-gold bg-brand-green text-white" aria-label="أخبار عاجلة">
      <div className="mx-auto flex max-w-6xl items-stretch">
        <p className="shrink-0 bg-brand-gold px-4 py-2 font-extrabold text-brand-green">عاجل</p>
        <div className="ticker-viewport min-w-0 flex-1 py-2">
          <div className="ticker-track flex gap-8 px-4">
            {loop.map((article, index) => (
              <Link
                key={`${article.id}-${index}`}
                to={`/article/${article.slug}`}
                className="whitespace-nowrap font-semibold hover:text-brand-gold"
                aria-hidden={index >= articles.length ? true : undefined}
                tabIndex={index >= articles.length ? -1 : undefined}
              >
                {article.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
