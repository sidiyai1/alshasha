import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PdfReader } from '../components/PdfReader.tsx'
import { Alert, DemoBadge, EmptyState, Spinner } from '../components/ui.tsx'
import { formatArabicDate } from '../lib/dates.ts'
import { toMessage } from '../lib/errors.ts'
import { usePageMeta } from '../lib/meta.ts'
import { getPublishedEdition } from '../services/content.ts'
import type { Edition } from '../types.ts'

export function ArchiveReaderPage() {
  const { id = '' } = useParams()
  const [edition, setEdition] = useState<Edition | null>(null)
  const [state, setState] = useState<'loading' | 'missing' | 'ready' | 'error'>('loading')
  const [message, setMessage] = useState<string | null>(null)
  usePageMeta(edition ? edition.title : 'أرشيف الجريدة', edition?.description)

  useEffect(() => {
    let active = true
    setState('loading')
    getPublishedEdition(id)
      .then((item) => {
        if (!active) return
        if (!item) {
          setEdition(null)
          setState('missing')
          return
        }
        setEdition(item)
        setState('ready')
      })
      .catch((reason: unknown) => {
        if (!active) return
        setMessage(toMessage(reason))
        setState('error')
      })
    return () => {
      active = false
    }
  }, [id])

  return (
    <div>
      <Link className="text-sm font-bold text-brand-green underline" to="/archive">
        العودة إلى الأرشيف
      </Link>
      {state === 'loading' ? (
        <div className="mt-8">
          <Spinner label="جارٍ فتح العدد" />
        </div>
      ) : null}
      {state === 'error' && message ? (
        <div className="mt-6">
          <Alert tone="error">{message}</Alert>
        </div>
      ) : null}
      {state === 'missing' ? (
        <div className="mt-6">
          <EmptyState title="العدد غير متوفر" body="هذا العدد غير منشور أو لم يعد موجوداً في الأرشيف." />
        </div>
      ) : null}
      {state === 'ready' && edition ? (
        <article className="mt-4">
          <p className="text-sm font-bold text-brand-green">العدد {edition.issueNumber}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-4xl font-extrabold text-brand-green">{edition.title}</h1>
            {edition.isDemo ? <DemoBadge /> : null}
          </div>
          {edition.publishedAt ? (
            <time className="mt-2 block text-brand-muted" dateTime={edition.publishedAt.toISOString()}>
              {formatArabicDate(edition.publishedAt)}
            </time>
          ) : null}
          {edition.description ? <p className="mt-4 max-w-3xl font-body text-lg leading-9 text-brand-ink">{edition.description}</p> : null}
          <div className="mt-6">
            {edition.pdfUrl ? (
              <PdfReader url={edition.pdfUrl} />
            ) : (
              <Alert>ملف هذا العدد غير متوفر.</Alert>
            )}
          </div>
        </article>
      ) : null}
    </div>
  )
}
