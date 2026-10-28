import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'

const fieldClass =
  'w-full border border-brand-line bg-white px-3 py-2.5 text-base text-brand-ink outline-none focus:border-brand-green'

export function Spinner({ label }: { label: string }) {
  return (
    <div role="status" className="flex items-center gap-3 text-brand-green">
      <span className="inline-block size-5 animate-spin rounded-full border-2 border-brand-line border-t-brand-green" />
      <span>{label}</span>
    </div>
  )
}

export function FullScreenStatus({ label }: { label: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-brand-cream px-4">
      <Spinner label={label} />
    </div>
  )
}

export function Alert({ tone = 'info', children }: { tone?: 'info' | 'error' | 'success'; children: ReactNode }) {
  const styles = {
    info: 'border-brand-gold bg-brand-cream text-brand-ink',
    error: 'border-red-200 bg-red-50 text-red-800',
    success: 'border-brand-green bg-white text-brand-green',
  }[tone]
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`border px-4 py-3 text-sm leading-7 ${styles}`}>
      {children}
    </div>
  )
}

export function DemoBadge() {
  return (
    <span className="inline-block border border-brand-gold bg-brand-cream px-2 py-0.5 text-xs font-bold text-brand-green">
      محتوى تجريبي
    </span>
  )
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'gold' | 'danger' | 'ghost' }) {
  const styles = {
    primary: 'bg-brand-green text-white hover:bg-brand-green-dark',
    gold: 'bg-brand-gold text-brand-green hover:brightness-95',
    danger: 'border border-red-700 bg-white text-red-800 hover:bg-red-50',
    ghost: 'border border-brand-line bg-white text-brand-green hover:border-brand-green',
  }[variant]
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${styles} ${className}`}
      {...props}
    />
  )
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-brand-green">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-sm leading-6 text-brand-muted">{hint}</span> : null}
      {error ? (
        <span className="mt-1 block text-sm text-red-700" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={fieldClass} {...props} />
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${fieldClass} min-h-32 leading-7`} {...props} />
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={fieldClass} {...props} />
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-dashed border-brand-line bg-brand-cream px-5 py-10 text-center">
      <h2 className="text-xl font-extrabold text-brand-green">{title}</h2>
      <p className="mt-2 text-brand-muted">{body}</p>
    </div>
  )
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  busy = false,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  body: string
  confirmLabel: string
  busy?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-brand-ink/50 px-4" role="presentation">
      <div role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-md border border-brand-line bg-white p-5 shadow-lg">
        <h2 id="confirm-title" className="text-xl font-extrabold text-brand-green">
          {title}
        </h2>
        <p className="mt-3 leading-8 text-brand-ink">{body}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="danger" onClick={onConfirm} disabled={busy}>
            {busy ? 'جارٍ التنفيذ…' : confirmLabel}
          </Button>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            إلغاء
          </Button>
        </div>
      </div>
    </div>
  )
}

export function SectionTitle({ title, action, id }: { title: string; action?: ReactNode; id?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3 border-b border-brand-line">
      <h2 id={id} className="-mb-px border-b-2 border-brand-gold pb-2 text-xl font-extrabold text-brand-green md:text-2xl">
        {title}
      </h2>
      {action}
    </div>
  )
}
