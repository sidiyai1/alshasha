import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Alert, Button, ConfirmDialog, Spinner, TextInput } from '../../components/ui.tsx'
import { useToast } from '../../context/ToastContext.tsx'
import { toArticleInput } from '../../lib/articles.ts'
import { formatArabicDate, toDateTimeLocal } from '../../lib/dates.ts'
import { toMessage } from '../../lib/errors.ts'
import { usePageMeta } from '../../lib/meta.ts'
import { deleteArticle, getArticle, listAdminArticles, saveArticle } from '../../services/content.ts'
import type { Article, ArticleStatus, PageCursor } from '../../types.ts'

export function ArticlesPage() {
  usePageMeta('المقالات')
  const { push } = useToast()
  const [params, setParams] = useSearchParams()
  const statusParam = params.get('status')
  const status: ArticleStatus | 'all' = statusParam === 'published' || statusParam === 'draft' ? statusParam : 'all'
  const search = params.get('q') ?? ''
  const [draft, setDraft] = useState(search)
  const [items, setItems] = useState<Article[]>([])
  const [cursor, setCursor] = useState<PageCursor | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Article | null>(null)
  const [busy, setBusy] = useState(false)

  function load(nextStatus = status, nextSearch = search) {
    setLoading(true)
    setError(null)
    return listAdminArticles({ status: nextStatus, search: nextSearch })
      .then((page) => {
        setItems(page.items)
        setCursor(page.nextCursor)
        setHasMore(page.hasMore)
      })
      .catch((reason: unknown) => setError(toMessage(reason)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setDraft(search)
    void load(status, search)
  }, [status, search])

  function setStatus(value: ArticleStatus | 'all') {
    const next = new URLSearchParams(params)
    if (value === 'all') next.delete('status')
    else next.set('status', value)
    setParams(next)
  }

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = new URLSearchParams(params)
    const term = draft.trim()
    if (term) next.set('q', term)
    else next.delete('q')
    setParams(next)
  }

  async function toggleStatus(article: Article) {
    const full = await getArticle(article.id)
    if (!full) return
    const nextStatus: ArticleStatus = full.status === 'published' ? 'draft' : 'published'
    const input = toArticleInput(full)
    if (nextStatus === 'published' && !input.publishedAt) input.publishedAt = toDateTimeLocal(new Date())
    input.status = nextStatus
    await saveArticle(full.id, input)
    push('success', nextStatus === 'published' ? 'تم نشر المقال.' : 'أُلغي نشر المقال.')
    await load()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold text-brand-green">المقالات</h1>
        <Link className="bg-brand-green px-4 py-2 text-sm font-bold text-white" to="/admin/articles/new">
          إضافة مقال
        </Link>
      </div>
      <form className="flex flex-col gap-3 bg-white p-4 sm:flex-row sm:items-end" onSubmit={onSearch}>
        <label className="block flex-1 text-sm font-bold text-brand-green">
          بحث في المقالات
          <span className="mt-1 block">
            <TextInput value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="العنوان أو اسم القسم" />
          </span>
        </label>
        <Button type="submit">بحث</Button>
      </form>
      <div className="flex flex-wrap gap-2" role="group" aria-label="تصفية الحالة">
        {(['all', 'published', 'draft'] as const).map((value) => (
          <button
            key={value}
            type="button"
            className={`px-3 py-1.5 text-sm font-bold ${status === value ? 'bg-brand-green text-white' : 'bg-white text-brand-green'}`}
            aria-pressed={status === value}
            onClick={() => setStatus(value)}
          >
            {value === 'all' ? 'الكل' : value === 'published' ? 'منشور' : 'مسودة'}
          </button>
        ))}
      </div>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {loading ? <Spinner label="جارٍ تحميل المقالات" /> : null}
      {!loading && items.length === 0 ? <p className="bg-white px-4 py-6 text-brand-muted">لا توجد مقالات مطابقة.</p> : null}
      <div className="overflow-x-auto border border-brand-line bg-white">
        <table className="w-full min-w-[52rem] text-right text-sm">
          <thead className="bg-brand-cream text-brand-green">
            <tr>
              <th className="px-3 py-2">العنوان</th>
              <th className="px-3 py-2">التصنيف</th>
              <th className="px-3 py-2">الكاتب</th>
              <th className="px-3 py-2">تاريخ النشر</th>
              <th className="px-3 py-2">الحالة</th>
              <th className="px-3 py-2">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {items.map((article) => (
              <tr key={article.id} className="border-t border-brand-line">
                <td className="px-3 py-3 font-bold">{article.title}</td>
                <td className="px-3 py-3">{article.categoryName}</td>
                <td className="px-3 py-3">{article.author}</td>
                <td className="px-3 py-3">{article.publishedAt ? formatArabicDate(article.publishedAt) : '—'}</td>
                <td className="px-3 py-3">{article.status === 'published' ? 'منشور' : 'مسودة'}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link className="font-bold text-brand-green underline" to={`/admin/articles/${article.id}`}>
                      تعديل
                    </Link>
                    <button type="button" className="font-bold text-brand-green" onClick={() => void toggleStatus(article).catch((reason) => push('error', toMessage(reason)))}>
                      {article.status === 'published' ? 'إلغاء النشر' : 'نشر'}
                    </button>
                    <button type="button" className="font-bold text-red-800" onClick={() => setPendingDelete(article)}>
                      حذف
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && cursor ? (
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            void listAdminArticles({ status, search, cursor }).then((page) => {
              setItems((current) => [...current, ...page.items])
              setCursor(page.nextCursor)
              setHasMore(page.hasMore)
            })
          }}
        >
          المزيد
        </Button>
      ) : null}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="حذف المقال"
        body={`سيُحذف «${pendingDelete?.title ?? ''}» نهائياً مع معرّفه.`}
        confirmLabel="حذف"
        busy={busy}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return
          setBusy(true)
          void deleteArticle(pendingDelete.id)
            .then(async () => {
              push('success', 'تم حذف المقال.')
              setPendingDelete(null)
              await load()
            })
            .catch((reason: unknown) => push('error', toMessage(reason)))
            .finally(() => setBusy(false))
        }}
      />
    </div>
  )
}
