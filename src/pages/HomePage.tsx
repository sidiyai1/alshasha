import { Link, useOutletContext } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ArticleCard } from '../components/ArticleCard.tsx'
import { BreakingTicker } from '../components/BreakingTicker.tsx'
import { EditionCard } from '../components/EditionCard.tsx'
import type { PublicContext } from '../components/PublicLayout.tsx'
import { Alert, DemoBadge, EmptyState, SectionTitle, Spinner } from '../components/ui.tsx'
import { formatArabicDate } from '../lib/dates.ts'
import { usePageMeta } from '../lib/meta.ts'
import { toMessage } from '../lib/errors.ts'
import { getHomeStories } from '../services/content.ts'
import type { HomeStories } from '../types.ts'

export function HomePage() {
  usePageMeta('الشاشة', 'الشاشة صحيفة عربية. آخر الأخبار والأرشيف والتحقيقات.')
  const { settings, categories, ready } = useOutletContext<PublicContext>()
  const [stories, setStories] = useState<HomeStories | null>(null)
  const [error, setError] = useState<string | null>(null)
  const featuredKey = settings.featuredArticleIds.join('|')

  useEffect(() => {
    if (!ready) return
    let active = true
    getHomeStories(settings.featuredArticleIds)
      .then((value) => {
        if (active) setStories(value)
      })
      .catch((reason: unknown) => {
        if (active) setError(toMessage(reason))
      })
    return () => {
      active = false
    }
  }, [ready, featuredKey, settings.featuredArticleIds])

  if (error) return <Alert tone="error">{error}</Alert>
  if (!stories) return <Spinner label="جارٍ تحميل الصفحة الرئيسية" />

  const featured = stories.featured

  return (
    <div className="space-y-12">
      <BreakingTicker articles={stories.breaking} />
      {featured ? (
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(16rem,0.9fr)]">
          <article className="border border-brand-line bg-white">
            <div className="space-y-4 p-5 md:p-7">
              <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-brand-green">
                <Link to={`/category/${featured.categorySlug}`}>{featured.categoryName}</Link>
                {featured.isDemo ? <DemoBadge /> : null}
              </div>
              <h1 className="text-3xl font-extrabold leading-snug text-brand-ink md:text-5xl">
                <Link to={`/article/${featured.slug}`}>{featured.title}</Link>
              </h1>
              <p className="font-body text-lg leading-9 text-brand-muted">{featured.summary}</p>
              <p className="text-sm text-brand-muted">
                {featured.author}
                {featured.publishedAt ? ` · ${formatArabicDate(featured.publishedAt)}` : ''}
              </p>
            </div>
            {featured.imageUrl ? (
              <img src={featured.imageUrl} alt="" className="aspect-[16/9] w-full bg-brand-cream object-contain" />
            ) : null}
          </article>
          <aside className="border border-brand-line">
            <h2 className="border-b border-brand-line bg-brand-cream px-4 py-3 text-lg font-extrabold text-brand-green">
              في الواجهة
            </h2>
            <ul>
              {stories.side.map((article) => (
                <li key={article.id} className="border-b border-brand-line px-4 py-4 last:border-b-0">
                  <p className="text-sm font-bold text-brand-green">{article.categoryName}</p>
                  <Link to={`/article/${article.slug}`} className="mt-1 block text-lg font-extrabold leading-snug hover:text-brand-green">
                    {article.title}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        </section>
      ) : (
        <EmptyState title="لا أخبار منشورة بعد" body="حين ينشر فريق التحرير أول خبر سيظهر هنا." />
      )}

      <section>
        <SectionTitle title="آخر الأخبار" action={<Link className="text-sm font-bold text-brand-green" to="/search">بحث</Link>} />
        {stories.latest.length === 0 ? (
          <EmptyState title="لا مواد حديثة" body="ستظهر هنا الأخبار بعد نشرها." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {stories.latest.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle title="الأقسام" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.filter((category) => category.showInNav).map((category) => (
            <Link key={category.id} to={`/category/${category.slug}`} className="border border-brand-line p-4 hover:border-brand-green">
              <h3 className="text-xl font-extrabold text-brand-green">{category.name}</h3>
              <p className="mt-2 text-sm leading-7 text-brand-muted">{category.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle
          title="أرشيف الجريدة"
          action={
            <Link className="text-sm font-bold text-brand-green" to="/archive">
              كل الأعداد
            </Link>
          }
        />
        <p className="mb-4 text-brand-muted">أحدث الإصدارات</p>
        {stories.editions.length === 0 ? (
          <EmptyState title="لا أعداد منشورة" body="ستظهر أغلفة الأعداد هنا بعد إضافتها من لوحة الإدارة." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stories.editions.map((edition) => (
              <EditionCard key={edition.id} edition={edition} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
