import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CloudinaryUpload } from '../../components/CloudinaryUpload.tsx'
import { Alert, Button, ConfirmDialog, Field, Spinner, TextArea, TextInput } from '../../components/ui.tsx'
import { useToast } from '../../context/ToastContext.tsx'
import { toEditionInput } from '../../lib/editions.ts'
import { toDateTimeLocal } from '../../lib/dates.ts'
import { toMessage } from '../../lib/errors.ts'
import { usePageMeta } from '../../lib/meta.ts'
import { useUnsavedChanges } from '../../lib/unsaved.ts'
import { isSafeMediaUrl, validateEdition } from '../../lib/validators.ts'
import { deleteEdition, getEdition, saveEdition } from '../../services/content.ts'
import type { EditionInput } from '../../types.ts'

const PdfReader = lazy(() => import('../../components/PdfReader.tsx').then((module) => ({ default: module.PdfReader })))

function blank(): EditionInput {
  return {
    issueNumber: '',
    title: '',
    description: '',
    coverImageUrl: '',
    coverPublicId: '',
    pdfUrl: '',
    pdfPublicId: '',
    publishedAt: '',
    status: 'draft',
  }
}

export function EditionEditorPage() {
  const { id } = useParams()
  const isNew = !id
  const navigate = useNavigate()
  const { push } = useToast()
  usePageMeta(isNew ? 'إضافة عدد جديد' : 'تعديل العدد')
  const initial = blank()
  const [input, setInput] = useState<EditionInput>(initial)
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showPdf, setShowPdf] = useState(false)
  const { blocker, allowLeave } = useUnsavedChanges(!loading && JSON.stringify(input) !== baseline)

  useEffect(() => {
    if (!id) return
    let active = true
    getEdition(id)
      .then((edition) => {
        if (!active) return
        if (!edition) {
          setErrors({ form: 'العدد غير موجود.' })
          setLoading(false)
          return
        }
        const next = toEditionInput(edition)
        setInput(next)
        setBaseline(JSON.stringify(next))
        setLoading(false)
      })
      .catch((reason: unknown) => {
        if (!active) return
        setErrors({ form: toMessage(reason) })
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id])

  async function persist(status: EditionInput['status']) {
    const next = {
      ...input,
      status,
      title: input.title.trim() || `العدد ${input.issueNumber}`,
      publishedAt: status === 'published' && !input.publishedAt ? toDateTimeLocal(new Date()) : input.publishedAt,
    }
    const nextErrors = validateEdition(next)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    setSaving(true)
    try {
      const savedId = await saveEdition(id ?? null, next)
      push('success', status === 'published' ? 'تم نشر العدد.' : 'تم حفظ المسودة.')
      setInput(next)
      setBaseline(JSON.stringify(next))
      if (isNew) {
        allowLeave()
        navigate(`/admin/archives/${savedId}`, { replace: true })
      }
    } catch (reason) {
      setErrors({ form: toMessage(reason) })
    } finally {
      setSaving(false)
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void persist(input.status)
  }

  if (loading) return <Spinner label="جارٍ فتح العدد" />

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-4" noValidate>
      <h1 className="text-3xl font-extrabold text-brand-green">{isNew ? 'إضافة عدد جديد' : 'تعديل العدد'}</h1>
      <Alert>
        ارفعوا الغلاف أو ملف PDF، أو الصقوا رابط https. Firestore يحفظ الرابط ومعرّف الملف، ولا يحفظ الملف نفسه.
      </Alert>
      {errors.form ? <Alert tone="error">{errors.form}</Alert> : null}
      <Field label="رقم العدد" error={errors.issueNumber}>
        <TextInput value={input.issueNumber} onChange={(event) => setInput({ ...input, issueNumber: event.target.value })} inputMode="numeric" />
      </Field>
      <Field label="العنوان" error={errors.title}>
        <TextInput value={input.title} onChange={(event) => setInput({ ...input, title: event.target.value })} />
      </Field>
      <Field label="الوصف" error={errors.description}>
        <TextArea value={input.description} onChange={(event) => setInput({ ...input, description: event.target.value })} />
      </Field>
      <CloudinaryUpload
        label="رفع صورة الغلاف"
        hint="JPG أو PNG أو WebP، وبحد 8 ميغابايت."
        type="image"
        onUploaded={(asset) => setInput((current) => ({ ...current, coverImageUrl: asset.url, coverPublicId: asset.publicId }))}
      />
      <Field label="رابط صورة الغلاف" hint="رابط https أو مسار داخلي." error={errors.coverImageUrl}>
        <TextInput
          value={input.coverImageUrl}
          onChange={(event) => setInput({ ...input, coverImageUrl: event.target.value, coverPublicId: '' })}
          dir="ltr"
        />
      </Field>
      <CloudinaryUpload
        label="رفع ملف PDF"
        hint="PDF فقط، وبحد 25 ميغابايت. الملف لا يُكتب في Firestore."
        type="archive"
        onUploaded={(asset) => {
          setShowPdf(false)
          setInput((current) => ({ ...current, pdfUrl: asset.url, pdfPublicId: asset.publicId }))
        }}
      />
      <Field label="رابط ملف PDF" hint="رابط الملف فقط. لا يُلصق الملف ولا يُحوَّل إلى قاعدة البيانات." error={errors.pdfUrl}>
        <TextInput
          value={input.pdfUrl}
          onChange={(event) => {
            setShowPdf(false)
            setInput({ ...input, pdfUrl: event.target.value, pdfPublicId: '' })
          }}
          dir="ltr"
        />
      </Field>
      {isSafeMediaUrl(input.coverImageUrl.trim()) ? (
        <figure className="border border-brand-line bg-white p-3">
          <figcaption className="mb-2 text-sm font-bold text-brand-green">معاينة الغلاف</figcaption>
          <img src={input.coverImageUrl.trim()} alt="" className="mx-auto aspect-[3/4] max-h-80 object-contain" />
        </figure>
      ) : null}
      {isSafeMediaUrl(input.pdfUrl.trim()) ? (
        <div className="space-y-3 border border-brand-line bg-white p-3">
          <Button type="button" variant="ghost" onClick={() => setShowPdf((current) => !current)}>
            {showPdf ? 'إخفاء معاينة PDF' : 'معاينة PDF قبل الحفظ'}
          </Button>
          {showPdf ? (
            <Suspense fallback={<Spinner label="جارٍ تجهيز المعاينة" />}>
              <PdfReader url={input.pdfUrl.trim()} />
            </Suspense>
          ) : null}
        </div>
      ) : null}
      <Field label="تاريخ العدد" error={errors.publishedAt}>
        <TextInput type="datetime-local" value={input.publishedAt} onChange={(event) => setInput({ ...input, publishedAt: event.target.value })} />
      </Field>
      <div className="flex flex-wrap gap-2">
        {input.status === 'published' ? (
          <Button type="button" variant="ghost" disabled={saving} onClick={() => void persist('draft')}>
            إلغاء النشر
          </Button>
        ) : (
          <Button type="button" variant="ghost" disabled={saving} onClick={() => void persist('draft')}>
            حفظ مسودة
          </Button>
        )}
        <Button type="button" disabled={saving} onClick={() => void persist('published')}>
          {saving ? 'جارٍ الحفظ…' : 'نشر العدد'}
        </Button>
        {!isNew ? (
          <Button type="button" variant="danger" onClick={() => setConfirmDelete(true)}>
            حذف
          </Button>
        ) : null}
      </div>
      <ConfirmDialog
        open={confirmDelete}
        title="حذف سجل الأرشيف"
        body="سيُحذف سجل العدد من قاعدة البيانات. ملف PDF والغلاف عند المستضيف الخارجي لن يُحذفا."
        confirmLabel="حذف"
        busy={saving}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (!id) return
          setSaving(true)
          void deleteEdition(id)
            .then(() => {
              push('success', 'تم حذف السجل. الملف الخارجي ما زال عند مستضيفه.')
              allowLeave()
              navigate('/admin/archives')
            })
            .catch((reason: unknown) => push('error', toMessage(reason)))
            .finally(() => setSaving(false))
        }}
      />
      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="تغييرات غير محفوظة"
        body="مغادرة الصفحة تُسقط ما لم يُحفظ."
        confirmLabel="مغادرة"
        onClose={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
      />
    </form>
  )
}
