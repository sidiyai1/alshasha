import { useState, type FormEvent } from 'react'
import { useOutletContext } from 'react-router-dom'
import { PageFrame } from '../components/PageFrame.tsx'
import type { PublicContext } from '../components/PublicLayout.tsx'
import { Alert, Button, Field, TextArea, TextInput } from '../components/ui.tsx'
import { toMessage } from '../lib/errors.ts'
import { usePageMeta } from '../lib/meta.ts'
import { validateContact } from '../lib/validators.ts'
import { submitMessage, usingDemoData } from '../services/content.ts'
import type { ContactInput } from '../types.ts'

const empty: ContactInput = { name: '', email: '', message: '', fax: '' }

export function ContactPage() {
  usePageMeta('اتصل بنا', 'راسلوا تحرير الشاشة.')
  const { settings } = useOutletContext<PublicContext>()
  const [input, setInput] = useState<ContactInput>(empty)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const demo = usingDemoData()

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateContact(input)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    setSending(true)
    try {
      await submitMessage(input)
      setDone(true)
      setInput(empty)
    } catch (error) {
      setErrors({ form: toMessage(error) })
    } finally {
      setSending(false)
    }
  }

  return (
    <PageFrame>
    <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <h1 className="text-4xl font-extrabold text-brand-green">اتصل بنا</h1>
        <p className="mt-4 font-body text-lg leading-9">
          للتصحيحات والملاحظات التحريرية. لا نطلب مستندات ولا كلمات مرور عبر هذه الصفحة.
        </p>
        <dl className="mt-6 space-y-3 text-brand-ink">
          {settings.contactEmail ? (
            <div>
              <dt className="font-bold text-brand-green">البريد</dt>
              <dd>
                <a className="underline" href={`mailto:${settings.contactEmail}`}>
                  {settings.contactEmail}
                </a>
              </dd>
            </div>
          ) : null}
          {settings.contactPhone ? (
            <div>
              <dt className="font-bold text-brand-green">الهاتف</dt>
              <dd>{settings.contactPhone}</dd>
            </div>
          ) : null}
          {settings.contactAddress ? (
            <div>
              <dt className="font-bold text-brand-green">العنوان</dt>
              <dd>{settings.contactAddress}</dd>
            </div>
          ) : null}
        </dl>
      </div>
      <div className="border border-brand-line bg-white p-5">
        {demo ? (
          <Alert>
            إرسال الرسائل إلى Firestore غير مفعّل قبل ربط Firebase. يمكنكم الآن استخدام البريد الظاهر في الصفحة.
          </Alert>
        ) : (
          <form onSubmit={(event) => void onSubmit(event)} className="space-y-4" noValidate>
            {done ? <Alert tone="success">وصلت رسالتكم إلى التحرير.</Alert> : null}
            {errors.form ? <Alert tone="error">{errors.form}</Alert> : null}
            <Field label="الاسم" error={errors.name}>
              <TextInput value={input.name} onChange={(event) => setInput({ ...input, name: event.target.value })} autoComplete="name" required />
            </Field>
            <Field label="البريد الإلكتروني" error={errors.email}>
              <TextInput
                type="email"
                value={input.email}
                onChange={(event) => setInput({ ...input, email: event.target.value })}
                autoComplete="email"
                required
              />
            </Field>
            <Field label="الرسالة" error={errors.message}>
              <TextArea value={input.message} onChange={(event) => setInput({ ...input, message: event.target.value })} required />
            </Field>
            <div className="absolute -left-[9999px]" aria-hidden="true">
              <label>
                فاكس
                <input tabIndex={-1} autoComplete="off" value={input.fax} onChange={(event) => setInput({ ...input, fax: event.target.value })} />
              </label>
            </div>
            <Button type="submit" disabled={sending}>
              {sending ? 'جارٍ الإرسال…' : 'إرسال'}
            </Button>
          </form>
        )}
      </div>
    </div>
    </PageFrame>
  )
}
