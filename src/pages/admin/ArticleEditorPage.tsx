import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CloudinaryUpload } from '../../components/CloudinaryUpload.tsx'
import { RichTextEditor } from '../../components/RichTextEditor.tsx'
import { Alert, Button, ConfirmDialog, Field, SelectInput, Spinner, TextArea, TextInput } from '../../components/ui.tsx'
import { useToast } from '../../context/ToastContext.tsx'
import { resolveCategorySelection, toArticleInput } from '../../lib/articles.ts'
import { toDateTimeLocal } from '../../lib/dates.ts'
import { toMessage } from '../../lib/errors.ts'
import { usePageMeta } from '../../lib/meta.ts'
import { slugify } from '../../lib/text.ts'
import { useUnsavedChanges } from '../../lib/unsaved.ts'
import { isSafeMediaUrl, validateArticle } from '../../lib/validators.ts'
import { deleteArticle, getArticle, listCategories, saveArticle } from '../../services/content.ts'
import type { ArticleInput, ArticleStatus, Category } from '../../types.ts'

function blank(): ArticleInput {
  return {
    title: '',
    slug: '',
    summary: '',
    content: '<p></p>',
    categoryId: '',
    author: 'تحرير الشاشة',
    imageUrl: '',
    imagePublicId: '',
    seoTitle: '',
    seoDescription: '',
    publishedAt: '',
    status: 'draft',
    featured: false,
    breaking: false,
  }
}

export function ArticleEditorPage() {
  const { id } = useParams()
  const isNew = !id
  const navigate = useNavigate()
  const { push } = useToast()
  usePageMeta(isNew ? 'إضافة مقال' : 'تعديل مقال')
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const initial = blank()
  const [input, setInput] = useState<ArticleInput>(initial)
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial))
  const inputRef = useRef(input)
  const baselineRef = useRef(baseline)
  const categoriesRef = useRef<Category[]>([])
  const categoriesReady = useRef(false)
  inputRef.current = input
  baselineRef.current = baseline
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [slugEdited, setSlugEdited] = useState(!isNew)
  const [ready, setReady] = useState(isNew)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { blocker, allowLeave } = useUnsavedChanges(!loading && JSON.stringify(input) !== baseline)

  const refreshCategories = useRef<() => Promise<void>>(async () => {})

  useEffect(() => {
    let active = true
    function applyCategories(items: Category[]) {
      const current = inputRef.current
      const nextId = resolveCategorySelection(current.categoryId, items, !id)
      const next = nextId === current.categoryId ? current : { ...current, categoryId: nextId }
      categoriesRef.current = items
      categoriesReady.current = true
      setCategories(items)
      if (next !== current) {
        inputRef.current = next
        if (JSON.stringify(current) === baselineRef.current) {
          const saved = JSON.stringify(next)
          baselineRef.current = saved
          setBaseline(saved)
        }
        setInput(next)
      }
      if (id && current.categoryId && !nextId) {
        setErrors((existing) => ({
          ...existing,
          categoryId: 'القسم المحدد لم يعد موجوداً. اختاروا قسماً من القائمة.',
        }))
      } else if (nextId) {
        setErrors((existing) => {
          if (existing.categoryId !== 'القسم المحدد لم يعد موجوداً. اختاروا قسماً من القائمة.') return existing
          const nextErrors = { ...existing }
          delete nextErrors.categoryId
          return nextErrors
        })
      }
    }
    async function refresh() {
      try {
        const items = await listCategories()
        if (!active) return
        applyCategories(items)
        setErrors((existing) => {
          if (!existing.categories) return existing
          const next = { ...existing }
          delete next.categories
          return next
        })
      } catch (reason: unknown) {
        if (!active) return
        setErrors((existing) => ({ ...existing, categories: toMessage(reason) }))
      } finally {
        if (active) setCategoriesLoading(false)
      }
    }
    refreshCategories.current = refresh
    void refresh()
    function onVisible() {
      if (document.visibilityState === 'visible') void refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    if (!id) {
      return () => {
        active = false
        document.removeEventListener('visibilitychange', onVisible)
      }
    }
    getArticle(id)
      .then((article) => {
        if (!active) return
        if (!article) {
          setErrors({ form: 'الخبر غير موجود.' })
          setLoading(false)
          return
        }
        const loaded = toArticleInput(article)
        const nextId = categoriesReady.current
          ? resolveCategorySelection(loaded.categoryId, categoriesRef.current, false)
          : loaded.categoryId
        const next = { ...loaded, categoryId: nextId }
        inputRef.current = next
        baselineRef.current = JSON.stringify(next)
        setInput(next)
        setBaseline(JSON.stringify(next))
        if (loaded.categoryId && !nextId) {
          setErrors((existing) => ({
            ...existing,
            categoryId: 'القسم المحدد لم يعد موجوداً. اختاروا قسماً من القائمة.',
          }))
        }
        setSlugEdited(true)
        setReady(true)
        setLoading(false)
      })
      .catch((reason: unknown) => {
        if (!active) return
        setErrors({ form: toMessage(reason) })
        setLoading(false)
      })
    return () => {
      active = false
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [id])

  async function persist(status: ArticleStatus) {
    const next = {
      ...input,
      status,
      publishedAt: status === 'published' && !input.publishedAt ? toDateTimeLocal(new Date()) : input.publishedAt,
    }
    const nextErrors = validateArticle(next)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    setSaving(true)
    try {
      const savedId = await saveArticle(id ?? null, next)
      push('success', status === 'published' ? 'تم نشر المقال.' : 'تم حفظ المسودة.')
      setInput(next)
      setBaseline(JSON.stringify(next))
      if (isNew) {
        allowLeave()
        navigate(`/admin/articles/${savedId}`, { replace: true })
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

  if (loading) return <Spinner label="جارٍ فتح الخبر" />

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-4" noValidate>
      <h1 className="text-3xl font-extrabold text-brand-green">{isNew ? 'إضافة مقال' : 'تعديل مقال'}</h1>
      {errors.form ? <Alert tone="error">{errors.form}</Alert> : null}
      <Field label="العنوان" error={errors.title}>
        <TextInput
          value={input.title}
          onChange={(event) => {
            const title = event.target.value
            setInput((current) => ({ ...current, title, slug: slugEdited ? current.slug : slugify(title) }))
          }}
          required
        />
      </Field>
      <Field label="المعرّف في الرابط" hint="يُولَّد من العنوان ويمكن تعديله. يُستخدم في رابط الخبر ويجب أن يبقى فريداً." error={errors.slug}>
        <TextInput
          value={input.slug}
          onChange={(event) => {
            setSlugEdited(true)
            setInput({ ...input, slug: event.target.value.trim() })
          }}
          dir="auto"
          required
        />
      </Field>
      <Field label="الموجز" error={errors.summary}>
        <TextArea value={input.summary} onChange={(event) => setInput({ ...input, summary: event.target.value })} />
      </Field>
      <Field label="النص" error={errors.content} hint="يُنظَّف النص قبل الحفظ والعرض لمنع الأكواد الضارة.">
        {ready ? (
          <RichTextEditor key={id ?? 'new'} initialHtml={input.content} onChange={(content) => setInput((current) => ({ ...current, content }))} />
        ) : null}
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="القسم"
          error={errors.categoryId || errors.categories}
          hint={
            categoriesLoading
              ? 'جارٍ تحميل الأقسام'
              : categories.length === 0
                ? 'لا توجد أقسام محفوظة. أنشئوا قسماً أولاً، ثم افتحوا هذه القائمة مرة أخرى.'
                : undefined
          }
        >
          <SelectInput
            value={input.categoryId}
            onFocus={() => void refreshCategories.current()}
            onChange={(event) => {
              setInput({ ...input, categoryId: event.target.value })
              setErrors((existing) => {
                if (!existing.categoryId && !existing.categories) return existing
                const nextErrors = { ...existing }
                delete nextErrors.categoryId
                delete nextErrors.categories
                return nextErrors
              })
            }}
          >
            <option value="" disabled>
              اختاروا القسم
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="الكاتب" error={errors.author}>
          <TextInput value={input.author} onChange={(event) => setInput({ ...input, author: event.target.value })} />
        </Field>
      </div>
      <CloudinaryUpload
        label="رفع صورة المقال"
        hint="JPG أو PNG أو WebP، وبحد 8 ميغابايت. يُحفظ الرابط فقط في Firestore."
        type="image"
        onUploaded={(asset) => setInput((current) => ({ ...current, imageUrl: asset.url, imagePublicId: asset.publicId }))}
      />
      <Field
        label="رابط الصورة"
        hint="يمكنكم رفع الصورة أو لصق رابط https. لا يُحفظ الملف داخل Firestore."
        error={errors.imageUrl}
      >
        <TextInput
          value={input.imageUrl}
          onChange={(event) => setInput({ ...input, imageUrl: event.target.value, imagePublicId: '' })}
          inputMode="url"
          dir="ltr"
        />
      </Field>
      {isSafeMediaUrl(input.imageUrl.trim()) ? (
        <img src={input.imageUrl.trim()} alt="" className="max-h-64 w-full border border-brand-line bg-white object-contain" />
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="عنوان محركات البحث" hint="اختياري، وبحد 70 حرفاً. إن تُرك فارغاً يُستخدم عنوان المقال." error={errors.seoTitle}>
          <TextInput value={input.seoTitle} onChange={(event) => setInput({ ...input, seoTitle: event.target.value })} maxLength={70} />
        </Field>
        <Field label="وصف محركات البحث" hint="اختياري، وبحد 160 حرفاً. إن تُرك فارغاً يُستخدم الموجز." error={errors.seoDescription}>
          <TextArea value={input.seoDescription} onChange={(event) => setInput({ ...input, seoDescription: event.target.value })} maxLength={160} />
        </Field>
      </div>
      <Field label="تاريخ النشر" error={errors.publishedAt}>
        <TextInput type="datetime-local" value={input.publishedAt} onChange={(event) => setInput({ ...input, publishedAt: event.target.value })} />
      </Field>
      <div className="flex flex-wrap gap-4 text-sm font-bold text-brand-green">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={input.featured} onChange={(event) => setInput({ ...input, featured: event.target.checked })} />
          تثبيت في الصفحة الرئيسية
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={input.breaking} onChange={(event) => setInput({ ...input, breaking: event.target.checked })} />
          خبر عاجل
        </label>
      </div>
      <p className="text-sm leading-7 text-brand-muted">
        التثبيت يظهر في الصفحة الرئيسية بعد النشر، وبحد خمسة مقالات. الترتيب يُعدَّل من إعدادات الموقع.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="ghost" disabled={saving} onClick={() => void persist('draft')}>
          حفظ مسودة
        </Button>
        <Button type="button" disabled={saving} onClick={() => void persist('published')}>
          {saving ? 'جارٍ الحفظ…' : 'نشر'}
        </Button>
        {!isNew ? (
          <Button type="button" variant="danger" onClick={() => setConfirmDelete(true)}>
            حذف
          </Button>
        ) : null}
      </div>
      <ConfirmDialog
        open={confirmDelete}
        title="حذف المقال"
        body="سيُحذف المقال نهائياً."
        confirmLabel="حذف"
        busy={saving}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (!id) return
          setSaving(true)
          void deleteArticle(id)
            .then(() => {
              push('success', 'تم حذف المقال.')
              allowLeave()
              navigate('/admin/articles')
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
