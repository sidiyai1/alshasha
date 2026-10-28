import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Article } from '../types.ts'

export function BreakingTicker({ articles }: { articles: Article[] }) {
  const [paused, setPaused] = useState(false)
  if (articles.length === 0) return null
  const loop = [...articles, ...articles]
  return (
    <section className="bg-brand-breaking text-white" aria-label="أخبار عاجلة">
      <div className="flex min-w-0 items-stretch">
        <p className="shrink-0 bg-white px-3 py-2.5 text-sm font-extrabold text-brand-breaking sm:px-4 sm:text-base">عاجل</p>
        <div className={`ticker-viewport min-w-0 flex-1 overflow-hidden py-2.5 ${paused ? 'is-paused' : ''}`}>
          <div className="ticker-track flex items-center gap-8 px-4">
            {loop.map((article, index) => (
              <Link
                key={`${article.id}-${index}`}
                to={`/article/${article.slug}`}
                className="whitespace-nowrap text-sm font-bold text-white hover:text-brand-gold sm:text-base"
                aria-hidden={index >= articles.length ? true : undefined}
                tabIndex={index >= articles.length ? -1 : undefined}
              >
                {article.title}
              </Link>
            ))}
          </div>
        </div>
        <button
          type="button"
          className="shrink-0 border-s border-white/25 px-3 text-xs font-bold text-white hover:bg-white/10"
          aria-pressed={paused}
          onClick={() => setPaused((value) => !value)}
        >
          {paused ? 'تشغيل' : 'إيقاف'}
        </button>
      </div>
    </section>
  )
}
