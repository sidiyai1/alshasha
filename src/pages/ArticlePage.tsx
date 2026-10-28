import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ArticleCard } from '../components/ArticleCard.tsx'
import { PageFrame } from '../components/PageFrame.tsx'
import { ShareBar } from '../components/ShareBar.tsx'
import { CategoryLink, NewsImage } from '../components/StoryMeta.tsx'
import { Alert, DemoBadge, Spinner } from '../components/ui.tsx'
import { formatArabicDateTime } from '../lib/dates.ts'
import { toMessage } from '../lib/errors.ts'
import { usePageMeta } from '../lib/meta.ts'
import { sanitizeHtml } from '../lib/sanitize.ts'
import { getPublishedArticleBySlug, listRelatedArticles } from '../services/content.ts'
import type { Article } from '../types.ts'

export function ArticlePage() {
  const { slug = '' } = useParams()
  const [article, setArticle] = useState<Article | null>(null)
  const [related, setRelated] = useState<Article[]>([])
  const [missing, setMissing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  usePageMeta(article?.seoTitle || article?.title || 'الخبر', article?.seoDescription || article?.summary)

  useEffect(() => {
    let active = true
    setMissing(false)
    setError(null)
    setArticle(null)
    getPublishedArticleBySlug(slug)
      .then(async (value) => {
        if (!active) return
        if (!value) {
          setMissing(true)
          return
        }
        setArticle(value)
        const more = await listRelatedArticles(value)
        if (active) setRelated(more)
      })
      .catch((reason: unknown) => {
        if (active) setError(toMessage(reason))
      })
    return () => {
      active = false
    }
  }, [slug])

  if (error) {
    return (
      <PageFrame>
        <Alert tone="error">{error}</Alert>
      </PageFrame>
    )
  }
  if (missing) {
    return (
      <PageFrame>
      <div className="space-y-4">
        <h1 className="text-3xl font-extrabold text-brand-green">الخبر غير موجود</h1>
        <p>ربما أُزيل أو أن رابطه غير مكتمل.</p>
        <Link className="font-bold text-brand-green underline" to="/">
          العودة إلى الرئيسية
        </Link>
      </div>
      </PageFrame>
    )
  }
  if (!article) {
    return (
      <PageFrame>
        <Spinner label="جارٍ فتح الخبر" />
      </PageFrame>
    )
  }

  return (
    <PageFrame>
    <article className="mx-auto max-w-3xl">
      <CategoryLink name={article.categoryName} slug={article.categorySlug} />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <h1 className="text-3xl font-extrabold leading-snug md:text-5xl">{article.title}</h1>
      </div>
      {article.isDemo ? (
        <div className="mt-3">
          <DemoBadge />
        </div>
      ) : null}
      <p className="mt-4 font-body text-xl leading-9 text-brand-muted">{article.summary}</p>
      <p className="mt-4 text-sm text-brand-muted">
        {article.author}
        {article.publishedAt ? ` · ${formatArabicDateTime(article.publishedAt)}` : ''}
      </p>
      <div className="mt-4">
        <ShareBar title={article.title} />
      </div>
      {article.imageUrl ? (
        <NewsImage
          src={article.imageUrl}
          alt={article.title}
          width={1400}
          priority
          className="mt-6 max-h-[42rem] w-full border border-brand-line bg-brand-cream object-contain"
        />
      ) : null}
      <div className="article-body mt-8" dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }} />
      {related.length > 0 ? (
        <section className="no-print mt-12">
          <h2 className="mb-4 border-b border-brand-line pb-2 text-2xl font-extrabold text-brand-green">أخبار ذات صلة</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {related.map((item) => (
              <ArticleCard key={item.id} article={item} />
            ))}
          </div>
        </section>
      ) : null}
    </article>
    </PageFrame>
  )
}
