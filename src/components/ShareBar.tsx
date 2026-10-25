import { Link2, Printer } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '../context/ToastContext.tsx'

export function ShareBar({ title }: { title: string }) {
  const { push } = useToast()
  const [copied, setCopied] = useState(false)
  const url = typeof window === 'undefined' ? '' : window.location.href
  const shareText = encodeURIComponent(`${title} ${url}`)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      push('success', 'تم نسخ الرابط.')
    } catch {
      push('error', 'تعذر نسخ الرابط. يمكنكم نسخه من شريط العنوان.')
    }
  }

  const linkClass = 'border border-brand-line px-3 py-2 text-sm font-bold text-brand-green hover:border-brand-green'

  return (
    <div className="no-print flex flex-wrap gap-2" aria-label="مشاركة الخبر">
      <button type="button" className={linkClass} onClick={() => void copyLink()}>
        <Link2 aria-hidden="true" className="inline" size={16} /> {copied ? 'تم النسخ' : 'نسخ الرابط'}
      </button>
      <a className={linkClass} href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noopener noreferrer">
        واتساب
      </a>
      <a
        className={linkClass}
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        فيسبوك
      </a>
      <a
        className={linkClass}
        href={`https://twitter.com/intent/tweet?text=${shareText}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        إكس
      </a>
      <button type="button" className={linkClass} onClick={() => window.print()}>
        <Printer aria-hidden="true" className="inline" size={16} /> طباعة
      </button>
    </div>
  )
}
