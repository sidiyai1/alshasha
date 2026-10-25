import { useOutletContext } from 'react-router-dom'
import type { PublicContext } from '../components/PublicLayout.tsx'
import { usePageMeta } from '../lib/meta.ts'
import { sanitizeHtml } from '../lib/sanitize.ts'

export function AboutPage() {
  const { settings } = useOutletContext<PublicContext>()
  usePageMeta('من نحن', 'تعريف بصحيفة الشاشة ومبادئ الصدق والأمانة والحياد.')
  return (
    <article className="mx-auto max-w-3xl">
      <h1 className="text-4xl font-extrabold text-brand-green">من نحن</h1>
      <div className="article-body mt-6" dangerouslySetInnerHTML={{ __html: sanitizeHtml(settings.aboutHtml) }} />
    </article>
  )
}
