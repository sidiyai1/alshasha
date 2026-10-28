import { Link } from 'react-router-dom'
import type { Article, Category } from '../types.ts'
import { SectionTitle } from './ui.tsx'
import { CategoryBadge, NewsImage, NewsTime } from './StoryMeta.tsx'

function LeadList({ articles }: { articles: Article[] }) {
  const [lead, ...rest] = articles
  if (!lead) return null
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
      <article className="min-w-0">
        <Link to={`/article/${lead.slug}`} className="group block">
          <NewsImage src={lead.imageUrl} width={900} className="aspect-[16/10] w-full bg-brand-cream object-contain" />
          <div className="mt-3 flex flex-col items-start gap-2">
            <CategoryBadge name={lead.categoryName} slug={lead.categorySlug} />
            <h3 className="text-xl font-extrabold leading-snug group-hover:text-brand-green md:text-2xl">{lead.title}</h3>
            <NewsTime date={lead.publishedAt} />
          </div>
        </Link>
      </article>
      {rest.length > 0 ? (
        <ul className="divide-y divide-brand-line border-y border-brand-line">
          {rest.map((article) => (
            <li key={article.id} className="flex items-start gap-3 py-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-extrabold leading-snug">
                  <Link to={`/article/${article.slug}`} className="hover:text-brand-green">
                    {article.title}
                  </Link>
                </h3>
                <div className="mt-2">
                  <NewsTime date={article.publishedAt} />
                </div>
              </div>
              <NewsImage src={article.imageUrl} width={280} className="h-16 w-24 shrink-0 bg-brand-cream object-contain" />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function ImageGrid({ articles }: { articles: Article[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {articles.map((article) => (
        <li key={article.id} className="min-w-0">
          <article>
            <Link to={`/article/${article.slug}`} className="group block">
              <NewsImage src={article.imageUrl} width={640} className="aspect-[4/3] w-full bg-brand-cream object-contain" />
              <div className="mt-2 flex flex-col items-start gap-1.5">
                <CategoryBadge name={article.categoryName} slug={article.categorySlug} />
                <h3 className="line-clamp-3 text-sm font-extrabold leading-snug group-hover:text-brand-green sm:text-base">
                  {article.title}
                </h3>
                <NewsTime date={article.publishedAt} />
              </div>
            </Link>
          </article>
        </li>
      ))}
    </ul>
  )
}

function CompactList({ articles }: { articles: Article[] }) {
  return (
    <ul className="divide-y divide-brand-line border-y border-brand-line">
      {articles.map((article) => (
        <li key={article.id} className="flex items-start gap-3 py-3">
          <div className="min-w-0 flex-1">
            <CategoryBadge name={article.categoryName} slug={article.categorySlug} />
            <h3 className="mt-2 text-base font-extrabold leading-snug sm:text-lg">
              <Link to={`/article/${article.slug}`} className="hover:text-brand-green">
                {article.title}
              </Link>
            </h3>
            <div className="mt-2">
              <NewsTime date={article.publishedAt} />
            </div>
          </div>
          <Link to={`/article/${article.slug}`} tabIndex={-1} aria-hidden="true" className="shrink-0">
            <NewsImage src={article.imageUrl} width={320} className="h-20 w-24 bg-brand-cream object-contain sm:w-28" />
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function CategoryBands({ sections }: { sections: { category: Category; articles: Article[] }[] }) {
  if (sections.length === 0) return null
  return (
    <div className="space-y-10">
      {sections.map((section, index) => {
        const layout = index % 3
        return (
          <section key={section.category.id} aria-labelledby={`category-${section.category.slug}`}>
            <SectionTitle
              id={`category-${section.category.slug}`}
              title={section.category.name}
              action={
                <Link className="mb-2 text-sm font-bold text-brand-green hover:text-brand-gold" to={`/category/${section.category.slug}`}>
                  المزيد
                </Link>
              }
            />
            {layout === 0 ? <LeadList articles={section.articles} /> : null}
            {layout === 1 ? <ImageGrid articles={section.articles} /> : null}
            {layout === 2 ? <CompactList articles={section.articles} /> : null}
          </section>
        )
      })}
    </div>
  )
}
