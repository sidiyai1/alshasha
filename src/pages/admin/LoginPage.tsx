import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Alert, Button, Field, TextInput } from '../../components/ui.tsx'
import { useAuth } from '../../context/AuthContext.tsx'
import { toMessage } from '../../lib/errors.ts'
import { useNoIndex, usePageMeta } from '../../lib/meta.ts'

export function LoginPage() {
  usePageMeta('دخول الإدارة')
  useNoIndex()
  const { signIn, user, isAdmin, loading, notice, configured } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (user && isAdmin) return <Navigate to="/admin" replace />

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    try {
      await signIn(email, password)
    } catch (reason) {
      setError(toMessage(reason))
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-brand-cream px-4">
      <div className="w-full max-w-md border border-brand-line bg-white p-6">
        <img src="/logo.jpg" alt="الشاشة" className="mx-auto mb-4 block h-auto max-h-28 w-auto object-contain" />
        <h1 className="text-center text-2xl font-extrabold text-brand-green">دخول الإدارة</h1>
        <p className="mt-2 text-center text-sm leading-7 text-brand-muted">
          لا يوجد تسجيل عام. الحساب يُنشأ يدوياً، ثم يُضاف معرّفه إلى مجموعة admins.
        </p>
        <form onSubmit={(event) => void onSubmit(event)} className="mt-5 space-y-4">
          {!configured ? (
            <Alert>Firebase غير مربوط. انسخوا .env.example إلى .env.local وأضيفوا إعدادات المشروع قبل الدخول.</Alert>
          ) : null}
          {notice ? <Alert tone="error">{notice}</Alert> : null}
          {error ? <Alert tone="error">{error}</Alert> : null}
          <Field label="البريد الإلكتروني">
            <TextInput type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </Field>
          <Field label="كلمة المرور">
            <TextInput
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </Field>
          <Button type="submit" className="w-full" disabled={!configured || loading}>
            {loading ? 'جارٍ التحقق…' : 'دخول'}
          </Button>
        </form>
      </div>
    </div>
  )
}
