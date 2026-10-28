import { Link, useOutletContext } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { BreakingTicker } from '../components/BreakingTicker.tsx'
import { CategoryBands } from '../components/CategoryBands.tsx'
import { EditionCard } from '../components/EditionCard.tsx'
import { FeaturedStories } from '../components/FeaturedStories.tsx'
import { HomeSidebar } from '../components/HomeSidebar.tsx'
import { LatestNews } from '../components/LatestNews.tsx'
import { pageShell } from '../components/PageFrame.tsx'
import type { PublicContext } from '../components/PublicLayout.tsx'
import { SecondaryStories } from '../components/SecondaryStories.tsx'
import { Alert, EmptyState, SectionTitle, Spinner } from '../components/ui.tsx'
import { LIMITS } from '../config.ts'
import { toMessage } from '../lib/errors.ts'
import { selectCategoryStories } from '../lib/home.ts'
import { usePageMeta } from '../lib/meta.ts'
import { getHomeStories, listPublishedArticles } from '../services/content.ts'
import type { Article, Category, HomeStories, PageCursor } from '../types.ts'

export function HomePage() {
  usePageMeta('الشاشة', 'الشاشة صحيفة عربية. آخر الأخبار والأرشيف والتحقيقات.')
  const { settings, categories, ready } = useOutletContext<PublicContext>()
  const [stories, setStories] = useState<HomeStories | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [extra, setExtra] = useState<Article[]>([])
  const [cursor, setCursor] = useState<PageCursor | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [moreError, setMoreError] = useState<string | null>(null)
  const [bands, setBands] = useState<{ category: Category; articles: Article[] }[] | null>(null)
  const featuredKey = settings.featuredArticleIds.join('|')
  const categoryKey = categories.map((category) => `${category.id}:${category.slug}:${category.order}`).join('|')

  useEffect(() => {
    if (!ready) return
    let active = true
    getHomeStories(settings.featuredArticleIds)
      .then((value) => {
        if (!active) return
        setStories(value)
        setExtra([])
        setCursor(value.latestCursor)
        setHasMore(value.latestHasMore)
        setMoreError(null)
      })
      .catch((reason: unknown) => {
        if (active) setError(toMessage(reason))
      })
    return () => {
      active = false
    }
  }, [ready, featuredKey, settings.featuredArticleIds])

  useEffect(() => {
    if (!ready || categories.length === 0) {
      setBands([])
      return
    }
    let active = true
    const ordered = [...categories].sort((left, right) => left.order - right.order || left.name.localeCompare(right.name, 'ar'))
    Promise.all(
      ordered.map(async (category) => {
        try {
          const page = await listPublishedArticles({ categorySlug: category.slug, limit: 6 })
          return { category, articles: page.items }
        } catch {
          return { category, articles: [] as Article[] }
        }
      }),
    ).then((groups) => {
      if (active) setBands(groups)
    })
    return () => {
      active = false
    }
  }, [ready, categoryKey, categories])

  const reserved = useMemo(() => {
    if (!stories) return new Set<string>()
    return new Set([...stories.slides, ...stories.side].map((article) => article.id))
  }, [stories])

  const sections = useMemo(() => {
    if (!bands) return []
    return bands
      .map((band) => ({
        category: band.category,
        articles: selectCategoryStories(band.articles, reserved),
      }))
      .filter((band) => band.articles.length > 0)
  }, [bands, reserved])

  async function loadMore() {
    if (!cursor || !stories) return
    setLoadingMore(true)
    setMoreError(null)
    try {
      const page = await listPublishedArticles({ cursor, limit: LIMITS.homeLatest })
      setExtra((current) => {
        const seen = new Set([...stories.slides, ...stories.side, ...stories.latest, ...current].map((article) => article.id))
        return [...current, ...page.items.filter((article) => !seen.has(article.id))]
      })
      setCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } catch (reason) {
      setMoreError(toMessage(reason))
    } finally {
      setLoadingMore(false)
    }
  }

  if (error) {
    return (
      <div className={`${pageShell} py-6`}>
        <Alert tone="error">{error}</Alert>
      </div>
    )
  }
  if (!stories) {
    return (
      <div className={`${pageShell} py-6`}>
        <Spinner label="جارٍ تحميل الصفحة الرئيسية" />
      </div>
    )
  }

  const latest = [...stories.latest, ...extra]
  const headlines = [...stories.latest, ...stories.side].slice(0, 7)
  const edition = stories.editions[0] ?? null
  const showSidebar = headlines.length > 0 || Boolean(edition)

  return (
    <div>
      <h1 className="sr-only">الشاشة</h1>
      <BreakingTicker articles={stories.breaking} />
      <div className={`${pageShell} space-y-8 py-4 lg:space-y-10 lg:py-6`}>
        {stories.slides.length > 0 ? (
          <FeaturedStories slides={stories.slides} />
        ) : (
          <EmptyState title="لا أخبار منشورة بعد" body="حين ينشر فريق التحرير أول خبر سيظهر هنا." />
        )}
        <SecondaryStories articles={stories.side} />
        <div className={`grid items-start gap-8 ${showSidebar ? 'lg:grid-cols-[minmax(0,7fr)_minmax(16rem,3fr)]' : ''}`}>
          <div className="min-w-0 space-y-10">
            <LatestNews articles={latest} hasMore={hasMore} loading={loadingMore} onMore={() => void loadMore()} />
            {moreError ? <Alert tone="error">{moreError}</Alert> : null}
            <CategoryBands sections={sections} />
            <section aria-labelledby="paper-heading">
              <SectionTitle
                id="paper-heading"
                title="النسخة الورقية"
                action={
                  <Link className="mb-2 text-sm font-bold text-brand-green hover:text-brand-gold" to="/archive">
                    كل الأعداد
                  </Link>
                }
              />
              {stories.editions.length === 0 ? (
                <EmptyState title="لا أعداد منشورة" body="ستظهر أغلفة الأعداد هنا بعد إضافتها من لوحة الإدارة." />
              ) : (
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
                  {stories.editions.map((item) => (
                    <EditionCard key={item.id} edition={item} />
                  ))}
                </div>
              )}
            </section>
          </div>
          <HomeSidebar headlines={headlines} edition={edition} />
        </div>
      </div>
    </div>
  )
}
