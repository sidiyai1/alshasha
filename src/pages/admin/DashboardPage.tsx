import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Button, ConfirmDialog, Spinner } from '../../components/ui.tsx'
import { useToast } from '../../context/ToastContext.tsx'
import { toMessage } from '../../lib/errors.ts'
import { usePageMeta } from '../../lib/meta.ts'
import { getDashboardStats, importDemoContent, listAdminArticles } from '../../services/content.ts'
import type { Article, DashboardStats } from '../../types.ts'

export function DashboardPage() {
  usePageMeta('لوحة التحكم')
  const { push } = useToast()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recent, setRecent] = useState<Article[]>([])
  const [error, setError] = useState<string | null>(null)
  const [confirmImport, setConfirmImport] = useState(false)
  const [busy, setBusy] = useState(false)

  function load() {
    setError(null)
    return Promise.all([getDashboardStats(), listAdminArticles({ status: 'all' })])
      .then(([nextStats, page]) => {
        setStats(nextStats)
        setRecent(page.items.slice(0, 5))
      })
      .catch((reason: unknown) => setError(toMessage(reason)))
  }

  useEffect(() => {
    void load()
  }, [])

  async function onImport() {
    setBusy(true)
    try {
      await importDemoContent()
      push('success', 'تم استيراد المحتوى التجريبي.')
      setConfirmImport(false)
      await load()
    } catch (reason) {
      push('error', toMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  const cards = [
    { label: 'إجمالي المقالات', value: stats?.articles, to: '/admin/articles' },
    { label: 'المقالات المنشورة', value: stats?.published, to: '/admin/articles?status=published' },
    { label: 'المسودات', value: stats?.drafts, to: '/admin/articles?status=draft' },
    { label: 'أعداد الأرشيف', value: stats?.editions, to: '/admin/archives' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold text-brand-green">لوحة التحكم</h1>
        <Button type="button" variant="gold" onClick={() => setConfirmImport(true)}>
          استيراد المحتوى التجريبي
        </Button>
      </div>
      <Alert>
        الأعداد أعلاه تأتي من استعلامات العد في Firestore حتى لا تُقرأ كل الوثائق. الاستيراد يكتب النصوص والروابط فقط، ولا يرفع صوراً أو ملفات PDF.
      </Alert>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {!stats && !error ? <Spinner label="جارٍ تحميل المؤشرات" /> : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.label} to={card.to} className="border-t-4 border-brand-gold bg-white p-4">
            <p className="text-sm text-brand-muted">{card.label}</p>
            <p className="mt-2 text-3xl font-extrabold text-brand-green">{card.value ?? '—'}</p>
          </Link>
        ))}
      </div>
      <section className="border border-brand-line bg-white">
        <div className="flex items-center justify-between border-b border-brand-line px-4 py-3">
          <h2 className="font-extrabold text-brand-green">المقالات المعدّلة مؤخراً</h2>
          <Link className="text-sm font-bold text-brand-green" to="/admin/articles">
            كل المقالات
          </Link>
        </div>
        {recent.length === 0 ? <p className="px-4 py-6 text-brand-muted">لا مقالات بعد.</p> : null}
        <ul>
          {recent.map((article) => (
            <li key={article.id} className="border-b border-brand-line last:border-b-0">
              <Link className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-brand-cream" to={`/admin/articles/${article.id}`}>
                <span>{article.title}</span>
                <span className="text-sm text-brand-muted">{article.status === 'published' ? 'منشور' : 'مسودة'}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <ConfirmDialog
        open={confirmImport}
        title="استيراد المحتوى التجريبي"
        body="سيُنشأ أو يُستبدل محتوى تجريبي محدد المعرّفات: أقسام، أخبار، أعداد، وإعدادات الصفحة. لن يُحذف ما كتبتموه بمعرّفات أخرى."
        confirmLabel="استيراد"
        busy={busy}
        onConfirm={() => void onImport()}
        onClose={() => setConfirmImport(false)}
      />
    </div>
  )
}
