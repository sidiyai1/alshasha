import { useEffect, useState, type FormEvent } from 'react'
import { RichTextEditor } from '../../components/RichTextEditor.tsx'
import { Alert, Button, ConfirmDialog, Field, Spinner, TextInput } from '../../components/ui.tsx'
import { useToast } from '../../context/ToastContext.tsx'
import { LIMITS } from '../../config.ts'
import { toMessage } from '../../lib/errors.ts'
import { usePageMeta } from '../../lib/meta.ts'
import { useUnsavedChanges } from '../../lib/unsaved.ts'
import { validateSettings } from '../../lib/validators.ts'
import { getSettings, listPickerArticles, saveSettings } from '../../services/content.ts'
import type { Article, SettingsInput } from '../../types.ts'

function fromSettings(settings: Awaited<ReturnType<typeof getSettings>>): SettingsInput {
  return { ...settings }
}

export function SettingsPage() {
  usePageMeta('إعدادات الموقع')
  const { push } = useToast()
  const [input, setInput] = useState<SettingsInput | null>(null)
  const [baseline, setBaseline] = useState('')
  const [articles, setArticles] = useState<Article[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([getSettings(), listPickerArticles()])
      .then(([settings, picker]) => {
        if (!active) return
        const next = fromSettings(settings)
        setInput(next)
        setBaseline(JSON.stringify(next))
        setArticles(picker)
      })
      .catch((reason: unknown) => {
        if (active) setErrors({ form: toMessage(reason) })
      })
    return () => {
      active = false
    }
  }, [])

  function move(id: string, direction: -1 | 1) {
    if (!input) return
    const ids = [...input.featuredArticleIds]
    const index = ids.indexOf(id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= ids.length) return
    const [item] = ids.splice(index, 1)
    if (!item) return
    ids.splice(target, 0, item)
    setInput({ ...input, featuredArticleIds: ids })
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!input) return
    const nextErrors = validateSettings(input)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    setSaving(true)
    void saveSettings(input)
      .then(() => {
        setBaseline(JSON.stringify(input))
        push('success', 'تم حفظ إعدادات الموقع.')
      })
      .catch((reason: unknown) => setErrors({ form: toMessage(reason) }))
      .finally(() => setSaving(false))
  }

  const { blocker } = useUnsavedChanges(Boolean(input) && JSON.stringify(input) !== baseline)

  if (!input) return errors.form ? <Alert tone="error">{errors.form}</Alert> : <Spinner label="جارٍ تحميل الإعدادات" />

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-4" noValidate>
      <h1 className="text-3xl font-extrabold text-brand-green">إعدادات الموقع</h1>
      {errors.form ? <Alert tone="error">{errors.form}</Alert> : null}
      <Field label="اسم الموقع" error={errors.siteName}>
        <TextInput value={input.siteName} onChange={(event) => setInput({ ...input, siteName: event.target.value })} />
      </Field>
      <Field label="السطر التعريفي" error={errors.tagline}>
        <TextInput value={input.tagline} onChange={(event) => setInput({ ...input, tagline: event.target.value })} />
      </Field>
      <Field label="نص من نحن" error={errors.aboutHtml}>
        <RichTextEditor initialHtml={input.aboutHtml} onChange={(aboutHtml) => setInput((current) => (current ? { ...current, aboutHtml } : current))} />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="بريد التحرير" error={errors.contactEmail}>
          <TextInput value={input.contactEmail} onChange={(event) => setInput({ ...input, contactEmail: event.target.value })} dir="ltr" />
        </Field>
        <Field label="الهاتف" error={errors.contactPhone}>
          <TextInput value={input.contactPhone} onChange={(event) => setInput({ ...input, contactPhone: event.target.value })} />
        </Field>
      </div>
      <Field label="العنوان" error={errors.contactAddress}>
        <TextInput value={input.contactAddress} onChange={(event) => setInput({ ...input, contactAddress: event.target.value })} />
      </Field>
      <fieldset className="border border-brand-line bg-white p-4">
        <legend className="px-2 font-extrabold text-brand-green">أخبار الواجهة</legend>
        <p className="mb-3 text-sm leading-7 text-brand-muted">
          اختاروا حتى {LIMITS.featured} أخبار منشورة. الأول يظهر خبراً رئيساً، والثلاثة التالية في العمود المجاور. القائمة تعرض أحدث {LIMITS.picker} خبراً فقط لتقليل القراءات.
        </p>
        {errors.featuredArticleIds ? <Alert tone="error">{errors.featuredArticleIds}</Alert> : null}
        <ul className="mb-4 space-y-2">
          {input.featuredArticleIds.map((id, index) => {
            const article = articles.find((item) => item.id === id)
            return (
              <li key={id} className="flex flex-wrap items-center justify-between gap-2 border border-brand-line px-3 py-2">
                <span>
                  {index + 1}. {article?.title ?? id}
                </span>
                <span className="flex gap-2 text-sm font-bold">
                  <button type="button" onClick={() => move(id, -1)}>
                    أعلى
                  </button>
                  <button type="button" onClick={() => move(id, 1)}>
                    أسفل
                  </button>
                  <button
                    type="button"
                    className="text-red-800"
                    onClick={() => setInput({ ...input, featuredArticleIds: input.featuredArticleIds.filter((item) => item !== id) })}
                  >
                    إزالة
                  </button>
                </span>
              </li>
            )
          })}
        </ul>
        <ul className="max-h-72 space-y-1 overflow-auto">
          {articles.map((article) => {
            const selected = input.featuredArticleIds.includes(article.id)
            return (
              <li key={article.id}>
                <button
                  type="button"
                  disabled={selected || input.featuredArticleIds.length >= LIMITS.featured}
                  className="w-full px-2 py-1.5 text-start text-sm hover:bg-brand-cream disabled:text-brand-muted"
                  onClick={() => setInput({ ...input, featuredArticleIds: [...input.featuredArticleIds, article.id] })}
                >
                  {selected ? 'مضاف · ' : ''}
                  {article.title}
                </button>
              </li>
            )
          })}
        </ul>
      </fieldset>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="رابط إكس" error={errors.socialX}>
          <TextInput value={input.socialX} onChange={(event) => setInput({ ...input, socialX: event.target.value })} dir="ltr" />
        </Field>
        <Field label="رابط فيسبوك" error={errors.socialFacebook}>
          <TextInput value={input.socialFacebook} onChange={(event) => setInput({ ...input, socialFacebook: event.target.value })} dir="ltr" />
        </Field>
        <Field label="رابط إنستغرام" error={errors.socialInstagram}>
          <TextInput value={input.socialInstagram} onChange={(event) => setInput({ ...input, socialInstagram: event.target.value })} dir="ltr" />
        </Field>
        <Field label="رابط يوتيوب" error={errors.socialYoutube}>
          <TextInput value={input.socialYoutube} onChange={(event) => setInput({ ...input, socialYoutube: event.target.value })} dir="ltr" />
        </Field>
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? 'جارٍ الحفظ…' : 'حفظ الإعدادات'}
      </Button>
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
