import { useEffect, useState, type FormEvent } from 'react'
import { Alert, Button, ConfirmDialog, Field, Spinner, TextArea, TextInput } from '../../components/ui.tsx'
import { useToast } from '../../context/ToastContext.tsx'
import { toMessage } from '../../lib/errors.ts'
import { usePageMeta } from '../../lib/meta.ts'
import { validateCategory } from '../../lib/validators.ts'
import { missingCategorySuggestions, type SuggestedCategory } from '../../data/suggestedCategories.ts'
import { deleteCategory, listCategories, saveCategory } from '../../services/content.ts'
import type { Category, CategoryInput } from '../../types.ts'

const blank: CategoryInput = { name: '', slug: '', description: '', order: '1', showInNav: true }

export function CategoriesPage() {
  usePageMeta('الأقسام')
  const { push } = useToast()
  const [items, setItems] = useState<Category[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [input, setInput] = useState<CategoryInput>(blank)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pending, setPending] = useState<Category | null>(null)

  function load() {
    return listCategories()
      .then(setItems)
      .catch((reason: unknown) => push('error', toMessage(reason)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    void load()
  }, [])

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateCategory(input, !editingId)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    setSaving(true)
    void saveCategory(editingId, input)
      .then(async () => {
        push('success', editingId ? 'تم تحديث القسم.' : 'تم إنشاء القسم.')
        setInput(blank)
        setEditingId(null)
        await load()
      })
      .catch((reason: unknown) => setErrors({ form: toMessage(reason) }))
      .finally(() => setSaving(false))
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div>
        <h1 className="text-3xl font-extrabold text-brand-green">الأقسام</h1>
        {loading ? <Spinner label="جارٍ تحميل الأقسام" /> : null}
        <ul className="mt-4 divide-y divide-brand-line border border-brand-line bg-white">
          {items.map((category) => (
            <li key={category.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="font-extrabold">{category.name}</p>
                <p className="text-sm text-brand-muted">
                  {category.slug} · الترتيب {category.order} · {category.showInNav ? 'في القائمة' : 'مخفي'}
                </p>
              </div>
              <div className="flex gap-3 text-sm font-bold">
                <button
                  type="button"
                  className="text-brand-green"
                  onClick={() => {
                    setEditingId(category.id)
                    setInput({
                      name: category.name,
                      slug: category.slug,
                      description: category.description,
                      order: String(category.order),
                      showInNav: category.showInNav,
                    })
                  }}
                >
                  تعديل
                </button>
                <button type="button" className="text-red-800" onClick={() => setPending(category)}>
                  حذف
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="space-y-4">
        <SuggestedCategories
          existing={items}
          onChoose={(suggestion) => {
            setEditingId(null)
            setErrors({})
            setInput({
              name: suggestion.name,
              slug: suggestion.slug,
              description: suggestion.description,
              order: suggestion.order,
              showInNav: true,
            })
          }}
        />
        <form onSubmit={onSubmit} className="h-fit space-y-3 border border-brand-line bg-white p-4" noValidate>
        <h2 className="text-xl font-extrabold text-brand-green">{editingId ? 'تعديل قسم' : 'قسم جديد'}</h2>
        {errors.form ? <Alert tone="error">{errors.form}</Alert> : null}
        <Field label="الاسم" error={errors.name}>
          <TextInput value={input.name} onChange={(event) => setInput({ ...input, name: event.target.value })} />
        </Field>
        <Field label="المعرّف" hint="لاتيني وثابت بعد الإنشاء، مثل siyasa." error={errors.slug}>
          <TextInput
            value={input.slug}
            disabled={Boolean(editingId)}
            onChange={(event) => setInput({ ...input, slug: event.target.value })}
            dir="ltr"
          />
        </Field>
        <Field label="الوصف" error={errors.description}>
          <TextArea value={input.description} onChange={(event) => setInput({ ...input, description: event.target.value })} />
        </Field>
        <Field label="الترتيب" error={errors.order}>
          <TextInput value={input.order} onChange={(event) => setInput({ ...input, order: event.target.value })} inputMode="numeric" />
        </Field>
        <label className="flex items-center gap-2 text-sm font-bold text-brand-green">
          <input type="checkbox" checked={input.showInNav} onChange={(event) => setInput({ ...input, showInNav: event.target.checked })} />
          إظهار في القائمة
        </label>
        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'جارٍ الحفظ…' : 'حفظ'}
          </Button>
          {editingId ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setEditingId(null)
                setInput(blank)
              }}
            >
              إلغاء
            </Button>
          ) : null}
        </div>
      </form>
      <ConfirmDialog
        open={Boolean(pending)}
        title="حذف القسم"
        body="حذف القسم لا يحذف أخباره، لكنها لن تجد قسمها عند التعديل التالي. هل تريدون المتابعة؟"
        confirmLabel="حذف القسم"
        onClose={() => setPending(null)}
        onConfirm={() => {
          if (!pending) return
          void deleteCategory(pending.id)
            .then(async () => {
              push('success', 'تم حذف القسم.')
              setPending(null)
              await load()
            })
            .catch((reason: unknown) => push('error', toMessage(reason)))
        }}
      />
      </div>
    </div>
  )
}

function SuggestedCategories({
  existing,
  onChoose,
}: {
  existing: Category[]
  onChoose: (suggestion: SuggestedCategory) => void
}) {
  const missing = missingCategorySuggestions(existing)
  if (missing.length === 0) return null
  return (
    <section className="border border-brand-line bg-white p-4">
      <h2 className="text-lg font-extrabold text-brand-green">أقسام مقترحة</h2>
      <p className="mt-2 text-sm leading-7 text-brand-muted">
        تعبئة النموذج لا تحفظ القسم. راجعوا البيانات ثم اضغطوا حفظ. الأقسام الموجودة، ومنها الرياضة، لا تُكرَّر.
      </p>
      <ul className="mt-3 space-y-2">
        {missing.map((suggestion) => (
          <li key={suggestion.slug} className="flex items-center justify-between gap-3">
            <span className="text-sm font-bold">{suggestion.name}</span>
            <Button type="button" variant="ghost" onClick={() => onChoose(suggestion)}>
              تعبئة النموذج
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}
