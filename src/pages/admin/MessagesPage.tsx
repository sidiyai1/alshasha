import { useEffect, useState } from 'react'
import { Alert, ConfirmDialog, Spinner } from '../../components/ui.tsx'
import { useToast } from '../../context/ToastContext.tsx'
import { formatArabicDateTime } from '../../lib/dates.ts'
import { toMessage } from '../../lib/errors.ts'
import { usePageMeta } from '../../lib/meta.ts'
import { deleteMessage, listMessages } from '../../services/content.ts'
import type { ContactMessage } from '../../types.ts'

export function MessagesPage() {
  usePageMeta('رسائل القراء')
  const { push } = useToast()
  const [items, setItems] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<ContactMessage | null>(null)

  function load() {
    return listMessages()
      .then(setItems)
      .catch((reason: unknown) => setError(toMessage(reason)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-extrabold text-brand-green">رسائل القراء</h1>
      <Alert>
        الخطة المجانية لا توفر حداً آلياً لعدد الرسائل. راجعوا الصندوق بانتظام، واحذفوا ما لا يلزم. الرسائل غير ظاهرة للزوار.
      </Alert>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {loading ? <Spinner label="جارٍ تحميل الرسائل" /> : null}
      {!loading && items.length === 0 ? <p>لا رسائل حتى الآن.</p> : null}
      <ul className="space-y-3">
        {items.map((message) => (
          <li key={message.id} className="border border-brand-line bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-extrabold">{message.name}</p>
                <p className="text-sm text-brand-muted" dir="ltr">
                  {message.email}
                </p>
              </div>
              <time className="text-sm text-brand-muted">{formatArabicDateTime(message.createdAt)}</time>
            </div>
            <p className="mt-3 whitespace-pre-wrap leading-8">{message.message}</p>
            <button type="button" className="mt-3 text-sm font-bold text-red-800" onClick={() => setPending(message)}>
              حذف
            </button>
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={Boolean(pending)}
        title="حذف الرسالة"
        body="ستُحذف الرسالة نهائياً من قاعدة البيانات."
        confirmLabel="حذف"
        onClose={() => setPending(null)}
        onConfirm={() => {
          if (!pending) return
          void deleteMessage(pending.id)
            .then(async () => {
              push('success', 'تم حذف الرسالة.')
              setPending(null)
              await load()
            })
            .catch((reason: unknown) => push('error', toMessage(reason)))
        }}
      />
    </div>
  )
}
