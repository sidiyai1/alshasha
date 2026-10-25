import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Button, ConfirmDialog, Spinner } from '../../components/ui.tsx'
import { useToast } from '../../context/ToastContext.tsx'
import { toDateTimeLocal, formatArabicDate } from '../../lib/dates.ts'
import { toEditionInput } from '../../lib/editions.ts'
import { toMessage } from '../../lib/errors.ts'
import { usePageMeta } from '../../lib/meta.ts'
import { isSafeMediaUrl, validateEdition } from '../../lib/validators.ts'
import { deleteEdition, listAdminEditions, saveEdition } from '../../services/content.ts'
import type { ArticleStatus, Edition, PageCursor } from '../../types.ts'

const DELETE_NOTE = 'سيُحذف سجل الأرشيف من قاعدة البيانات. ملف PDF والغلاف المستضافان خارجياً لن يُحذفا.'

export function EditionsPage() {
  usePageMeta('أرشيف الجريدة')
  const { push } = useToast()
  const [status, setStatus] = useState<ArticleStatus | 'all'>('all')
  const [items, setItems] = useState<Edition[]>([])
  const [cursor, setCursor] = useState<PageCursor | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<Edition | null>(null)
  const [busy, setBusy] = useState(false)

  function load(nextStatus = status) {
    setLoading(true)
    setError(null)
    return listAdminEditions({ status: nextStatus })
      .then((page) => {
        setItems(page.items)
        setCursor(page.nextCursor)
        setHasMore(page.hasMore)
      })
      .catch((reason: unknown) => setError(toMessage(reason)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    void load(status)
  }, [status])

  async function toggleStatus(edition: Edition) {
    const nextStatus: ArticleStatus = edition.status === 'published' ? 'draft' : 'published'
    const input = toEditionInput(edition, nextStatus)
    if (nextStatus === 'published' && !input.publishedAt) input.publishedAt = toDateTimeLocal(new Date())
    const errors = validateEdition(input)
    const firstError = Object.values(errors)[0]
    if (firstError) {
      push('error', firstError)
      return
    }
    await saveEdition(edition.id, input)
    push('success', nextStatus === 'published' ? 'تم نشر العدد.' : 'أُلغي نشر العدد.')
    await load()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold text-brand-green">أرشيف الجريدة</h1>
        <Link className="bg-brand-green px-4 py-2 text-sm font-bold text-white" to="/admin/archives/new">
          إضافة عدد جديد
        </Link>
      </div>
      <Alert>
        أدخلوا رابط الغلاف ورابط ملف PDF. الرفع المباشر غير مفعّل. حذف السجل لا يحذف الملف من مستضيفه، ولا يُحفظ الملف داخل Firestore.
      </Alert>
      <div className="flex gap-2">
        {(['all', 'published', 'draft'] as const).map((value) => (
          <button
            key={value}
            type="button"
            className={`px-3 py-1.5 text-sm font-bold ${status === value ? 'bg-brand-green text-white' : 'bg-white text-brand-green'}`}
            onClick={() => setStatus(value)}
          >
            {value === 'all' ? 'الكل' : value === 'published' ? 'منشور' : 'مسودة'}
          </button>
        ))}
      </div>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {loading ? <Spinner label="جارٍ تحميل الأعداد" /> : null}
      <div className="overflow-x-auto border border-brand-line bg-white">
        <table className="w-full min-w-[40rem] text-right text-sm">
          <thead className="bg-brand-cream text-brand-green">
            <tr>
              <th className="px-3 py-2">الغلاف</th>
              <th className="px-3 py-2">العدد</th>
              <th className="px-3 py-2">العنوان</th>
              <th className="px-3 py-2">الحالة</th>
              <th className="px-3 py-2">التاريخ</th>
              <th className="px-3 py-2">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {items.map((edition) => (
              <tr key={edition.id} className="border-t border-brand-line">
                <td className="px-3 py-3">
                  {isSafeMediaUrl(edition.coverImageUrl) ? (
                    <img src={edition.coverImageUrl} alt="" className="h-16 w-12 object-contain" />
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-3 py-3 font-extrabold">{edition.issueNumber}</td>
                <td className="px-3 py-3 font-bold">{edition.title}</td>
                <td className="px-3 py-3">{edition.status === 'published' ? 'منشور' : 'مسودة'}</td>
                <td className="px-3 py-3">{edition.publishedAt ? formatArabicDate(edition.publishedAt) : '—'}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link className="font-bold text-brand-green underline" to={`/admin/archives/${edition.id}`}>
                      تعديل
                    </Link>
                    <button
                      type="button"
                      className="font-bold text-brand-green"
                      onClick={() => void toggleStatus(edition).catch((reason: unknown) => push('error', toMessage(reason)))}
                    >
                      {edition.status === 'published' ? 'إلغاء النشر' : 'نشر'}
                    </button>
                    <button type="button" className="font-bold text-red-800" onClick={() => setPending(edition)}>
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
            void listAdminEditions({ status, cursor }).then((page) => {
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
        open={Boolean(pending)}
        title="حذف سجل الأرشيف"
        body={pending ? `${DELETE_NOTE} العدد ${pending.issueNumber}.` : DELETE_NOTE}
        confirmLabel="حذف السجل"
        busy={busy}
        onClose={() => setPending(null)}
        onConfirm={() => {
          if (!pending) return
          setBusy(true)
          void deleteEdition(pending.id)
            .then(async () => {
              push('success', 'تم حذف السجل. الملف الخارجي ما زال عند مستضيفه.')
              setPending(null)
              await load()
            })
            .catch((reason: unknown) => push('error', toMessage(reason)))
            .finally(() => setBusy(false))
        }}
      />
    </div>
  )
}
