import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArticleCard } from '../components/ArticleCard.tsx'
import { PageFrame } from '../components/PageFrame.tsx'
import { Alert, Button, EmptyState, Spinner, TextInput } from '../components/ui.tsx'
import { toMessage } from '../lib/errors.ts'
import { usePageMeta } from '../lib/meta.ts'
import { tokenize } from '../lib/text.ts'
import { searchPublishedArticles } from '../services/content.ts'
import type { Article, PageCursor } from '../types.ts'

export function SearchPage() {
  usePageMeta('بحث', 'ابحثوا في عناوين أخبار الشاشة وكلماتها المفتاحية.')
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const [draft, setDraft] = useState(q)
  const [items, setItems] = useState<Article[]>([])
  const [cursor, setCursor] = useState<PageCursor | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hint, setHint] = useState('')

  useEffect(() => {
    setDraft(q)
    const tokens = tokenize(q)
    if (!q.trim()) {
      setItems([])
      setHint('')
      setHasMore(false)
      return
    }
    if (tokens.length === 0) {
      setItems([])
      setHint('أدخلوا كلمة أوضح من حرفين. أدوات الربط وحدها لا تُبحث.')
      return
    }
    let active = true
    setLoading(true)
    setError(null)
    searchPublishedArticles(q)
      .then((page) => {
        if (!active) return
        setItems(page.items)
        setCursor(page.nextCursor)
        setHasMore(page.hasMore)
        setHint('البحث يطابق الكلمات المفتاحية المخزنة من العنوان والموجز، مرتبة من الأحدث.')
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
  }, [q])

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setParams(draft.trim() ? { q: draft.trim() } : {})
  }

  return (
    <PageFrame>
      <h1 className="text-4xl font-extrabold text-brand-green">بحث</h1>
      <p className="mt-3 max-w-2xl leading-8 text-brand-muted">
        اكتبوا كلمة من العنوان أو الموجز. الموقع لا يحمّل كل الأخبار ثم يبحث فيها، بل يسأل Firestore عن كلمة مفتاحية واحدة ثم يضيق النتائج محلياً.
      </p>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-2 sm:flex-row" role="search">
        <label className="sr-only" htmlFor="search-q">
          كلمة البحث
        </label>
        <TextInput id="search-q" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="مثال: معيشة" />
        <Button type="submit">بحث</Button>
      </form>
      {hint ? <p className="mt-4 text-sm leading-7 text-brand-muted">{hint}</p> : null}
      <div className="mt-6">
        {loading ? <Spinner label="جارٍ البحث" /> : null}
        {error ? <Alert tone="error">{error}</Alert> : null}
        {!loading && q && items.length === 0 && !error ? (
          <EmptyState title="لا نتائج" body="جرّبوا كلمة مفردة من عنوان الخبر، مثل: طرق أو معرض أو ملعب." />
        ) : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
        {hasMore && cursor ? (
          <div className="mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                void searchPublishedArticles(q, cursor).then((page) => {
                  setItems((current) => [...current, ...page.items])
                  setCursor(page.nextCursor)
                  setHasMore(page.hasMore)
                })
              }}
            >
              عرض المزيد
            </Button>
          </div>
        ) : null}
      </div>
    </PageFrame>
  )
}
