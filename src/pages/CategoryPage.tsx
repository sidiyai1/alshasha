import { useEffect, useState } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'
import { ArticleCard } from '../components/ArticleCard.tsx'
import type { PublicContext } from '../components/PublicLayout.tsx'
import { Alert, Button, EmptyState, Spinner } from '../components/ui.tsx'
import { toMessage } from '../lib/errors.ts'
import { usePageMeta } from '../lib/meta.ts'
import { listPublishedArticles } from '../services/content.ts'
import type { Article, PageCursor } from '../types.ts'

export function CategoryPage() {
  const { slug = '' } = useParams()
  const { categories } = useOutletContext<PublicContext>()
  const category = categories.find((item) => item.slug === slug)
  usePageMeta(category?.name ?? 'القسم', category?.description)
  const [items, setItems] = useState<Article[]>([])
  const [cursor, setCursor] = useState<PageCursor | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    listPublishedArticles({ categorySlug: slug })
      .then((page) => {
        if (!active) return
        setItems(page.items)
        setCursor(page.nextCursor)
        setHasMore(page.hasMore)
      })
      .catch((reason: unknown) => {
        if (active) setError(toMessage(reason))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [slug])

  async function loadMore() {
    if (!cursor) return
    setLoadingMore(true)
    try {
      const page = await listPublishedArticles({ categorySlug: slug, cursor })
      setItems((current) => [...current, ...page.items])
      setCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } catch (reason) {
      setError(toMessage(reason))
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div>
      <p className="text-sm font-bold text-brand-gold">قسم</p>
      <h1 className="mt-1 text-4xl font-extrabold text-brand-green">{category?.name ?? 'قسم غير موجود'}</h1>
      <p className="mt-3 max-w-2xl font-body text-lg leading-9 text-brand-muted">
        {category?.description ?? 'لا يوجد قسم بهذا العنوان ضمن أقسام الشاشة.'}
      </p>
      <div className="mt-8">
        {loading ? <Spinner label="جارٍ تحميل الأخبار" /> : null}
        {error ? <Alert tone="error">{error}</Alert> : null}
        {!loading && items.length === 0 ? (
          <EmptyState title="لا أخبار في هذا القسم" body="حين تُنشر مادة هنا ستظهر في هذه القائمة." />
        ) : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
        {hasMore ? (
          <div className="mt-6">
            <Button type="button" variant="ghost" onClick={() => void loadMore()} disabled={loadingMore}>
              {loadingMore ? 'جارٍ التحميل…' : 'عرض المزيد'}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
