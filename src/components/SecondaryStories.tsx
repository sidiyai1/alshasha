import { Link } from 'react-router-dom'
import type { Article } from '../types.ts'
import { CategoryBadge, NewsImage, NewsTime } from './StoryMeta.tsx'

export function SecondaryStories({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null
  return (
    <section aria-label="أخبار إضافية">
      <ul className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-3 min-[400px]:gap-2.5 lg:gap-4">
        {articles.map((article) => (
          <li key={article.id} className="min-w-0 border border-brand-line bg-white">
            <article>
              <Link to={`/article/${article.slug}`} className="group block">
                <span className="relative block overflow-hidden">
                  <NewsImage
                    src={article.imageUrl}
                    width={640}
                    className="aspect-[16/10] w-full bg-brand-cream object-contain"
                  />
                  <span className="absolute start-2 top-2">
                    <CategoryBadge name={article.categoryName} slug={article.categorySlug} />
                  </span>
                </span>
                <div className="flex flex-col items-start gap-2 p-3 lg:p-4">
                  <h2 className="text-lg font-extrabold leading-snug text-brand-ink min-[400px]:text-[0.95rem] min-[400px]:leading-6 lg:text-xl">
                    {article.title}
                  </h2>
                  <NewsTime date={article.publishedAt} />
                </div>
              </Link>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}
