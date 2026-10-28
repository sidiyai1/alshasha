import { Link } from 'react-router-dom'
import type { Article, Edition } from '../types.ts'
import { EditionCard } from './EditionCard.tsx'
import { NewsTime } from './StoryMeta.tsx'

export function HomeSidebar({ headlines, edition }: { headlines: Article[]; edition: Edition | null }) {
  if (headlines.length === 0 && !edition) return null
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-4 space-y-6">
        {headlines.length > 0 ? (
          <section className="border border-brand-line bg-white" aria-labelledby="recent-headlines">
            <h2 id="recent-headlines" className="border-b border-brand-gold bg-brand-green px-4 py-3 text-lg font-extrabold text-white">
              أحدث العناوين
            </h2>
            <ul className="divide-y divide-brand-line">
              {headlines.map((article) => (
                <li key={article.id} className="px-4 py-3">
                  <Link to={`/article/${article.slug}`} className="block font-extrabold leading-snug hover:text-brand-green">
                    {article.title}
                  </Link>
                  <div className="mt-1">
                    <NewsTime date={article.publishedAt} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {edition ? (
          <section aria-labelledby="latest-edition">
            <h2 id="latest-edition" className="mb-3 border-b border-brand-line pb-2 text-lg font-extrabold text-brand-green">
              أحدث عدد
            </h2>
            <EditionCard edition={edition} compact />
          </section>
        ) : null}
      </div>
    </aside>
  )
}
