import { Link } from 'react-router-dom'
import { usePageMeta } from '../lib/meta.ts'

export function NotFoundPage() {
  usePageMeta('الصفحة غير موجودة')
  return (
    <div className="py-10 text-center">
      <h1 className="text-4xl font-extrabold text-brand-green">الصفحة غير موجودة</h1>
      <p className="mt-3 text-brand-muted">تحققوا من الرابط أو عودوا إلى الصفحة الرئيسية.</p>
      <Link className="mt-6 inline-block bg-brand-green px-4 py-2 font-bold text-white" to="/">
        الرئيسية
      </Link>
    </div>
  )
}
