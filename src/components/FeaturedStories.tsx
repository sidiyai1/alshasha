import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Article } from '../types.ts'
import { CategoryBadge, NewsImage, NewsTime } from './StoryMeta.tsx'

function LeadCopy({ article, light = false }: { article: Article; light?: boolean }) {
  return (
    <>
      <CategoryBadge name={article.categoryName} slug={article.categorySlug} />
      <h2 className={`font-extrabold leading-snug ${light ? 'text-2xl text-white sm:text-3xl lg:text-4xl' : 'text-lg text-brand-ink'}`}>
        {article.title}
      </h2>
      <NewsTime date={article.publishedAt} tone={light ? 'light' : 'muted'} />
    </>
  )
}

export function FeaturedStories({ slides }: { slides: Article[] }) {
  const [index, setIndex] = useState(0)
  const [hover, setHover] = useState(false)
  const [touchPause, setTouchPause] = useState(false)
  const [focused, setFocused] = useState(false)
  const [reduced, setReduced] = useState(false)
  const lead = slides[0]
  const stack = slides.slice(1, 4)
  const paused = hover || touchPause || focused || reduced
  const [desktop, setDesktop] = useState(() => window.matchMedia('(min-width: 1024px)').matches)
  const slideKey = slides.map((slide) => slide.id).join('|')

  useEffect(() => {
    setIndex(0)
  }, [slideKey])

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const width = window.matchMedia('(min-width: 1024px)')
    const apply = () => {
      setReduced(motion.matches)
      setDesktop(width.matches)
    }
    apply()
    motion.addEventListener('change', apply)
    width.addEventListener('change', apply)
    return () => {
      motion.removeEventListener('change', apply)
      width.removeEventListener('change', apply)
    }
  }, [])

  useEffect(() => {
    if (desktop || paused || slides.length < 2) return
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length)
    }, 6000)
    return () => window.clearInterval(timer)
  }, [desktop, paused, slides.length, index])

  useEffect(() => {
    if (!touchPause) return
    const timer = window.setTimeout(() => setTouchPause(false), 8000)
    return () => window.clearTimeout(timer)
  }, [touchPause])

  function go(step: number) {
    setIndex((current) => (current + step + slides.length) % slides.length)
  }

  if (!lead) return null

  if (desktop) {
    return (
      <section
        className={`grid gap-4 ${stack.length > 0 ? 'grid-cols-[minmax(0,3fr)_minmax(16rem,2fr)]' : 'grid-cols-1'}`}
        aria-label="الأخبار البارزة"
      >
        <article className="relative bg-brand-green">
          <Link to={`/article/${lead.slug}`} className="group relative block overflow-hidden">
            <NewsImage
              src={lead.imageUrl}
              width={1400}
              priority
              className="mx-auto block max-h-[40rem] w-full object-contain"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-3 p-6 xl:p-8">
              <LeadCopy article={lead} light />
            </div>
          </Link>
        </article>
        {stack.length > 0 ? (
          <div className="grid h-full gap-3" style={{ gridTemplateRows: `repeat(${stack.length}, minmax(0, 1fr))` }}>
            {stack.map((article) => (
              <article key={article.id} className="min-h-0 border border-brand-line bg-white">
                <Link to={`/article/${article.slug}`} className="flex h-full min-h-28 gap-3">
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 p-3">
                    <CategoryBadge name={article.categoryName} slug={article.categorySlug} />
                    <h2 className="text-lg font-extrabold leading-snug text-brand-ink">{article.title}</h2>
                    <NewsTime date={article.publishedAt} />
                  </div>
                  <NewsImage src={article.imageUrl} width={480} className="h-full w-32 shrink-0 bg-brand-cream object-contain xl:w-40" />
                </Link>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    )
  }

  return (
      <section
        className="relative -mx-4 overflow-hidden bg-brand-green sm:-mx-5"
        aria-roledescription="عرض شرائح"
        aria-label="الأخبار البارزة"
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse') setHover(true)
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === 'mouse') setHover(false)
        }}
        onPointerDown={(event) => {
          if (event.pointerType !== 'mouse') setTouchPause(true)
        }}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false)
        }}
        onKeyDown={(event) => {
          if (slides.length < 2) return
          if (event.key === 'ArrowRight') {
            event.preventDefault()
            go(-1)
          }
          if (event.key === 'ArrowLeft') {
            event.preventDefault()
            go(1)
          }
        }}
      >
        <div className="relative">
          {slides.map((article, slideIndex) => {
            const active = slideIndex === index
            return (
              <article
                key={article.id}
                className={`motion-safe:transition-opacity motion-safe:duration-500 ${active ? 'relative h-full opacity-100' : 'pointer-events-none absolute inset-0 opacity-0'}`}
                aria-hidden={active ? undefined : true}
                inert={active ? undefined : true}
              >
                <Link to={`/article/${article.slug}`} className="relative block">
                  <NewsImage
                    src={article.imageUrl}
                    width={960}
                    priority={slideIndex === 0}
                    className="mx-auto block max-h-[32rem] w-full object-contain"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-2 p-4 pb-12">
                    <CategoryBadge name={article.categoryName} slug={article.categorySlug} />
                    <h2 className="text-2xl font-extrabold leading-snug text-white min-[400px]:text-[1.65rem]">{article.title}</h2>
                    <NewsTime date={article.publishedAt} tone="light" />
                  </div>
                </Link>
              </article>
            )
          })}
        </div>
        {slides.length > 1 ? (
          <>
            <button
              type="button"
              className="absolute start-3 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-brand-green shadow"
              aria-label="الخبر السابق"
              onClick={() => go(-1)}
            >
              <ChevronRight aria-hidden="true" size={20} />
            </button>
            <button
              type="button"
              className="absolute end-3 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-brand-green shadow"
              aria-label="الخبر التالي"
              onClick={() => go(1)}
            >
              <ChevronLeft aria-hidden="true" size={20} />
            </button>
            <div className="absolute inset-x-0 bottom-3 z-10 flex items-center justify-center gap-1.5">
              {slides.map((article, slideIndex) => (
                <button
                  key={article.id}
                  type="button"
                  aria-label={`الخبر ${slideIndex + 1}: ${article.title}`}
                  aria-current={slideIndex === index ? 'true' : undefined}
                  className={`h-2 rounded-full ${slideIndex === index ? 'w-6 bg-white' : 'w-2 bg-white/55'}`}
                  onClick={() => setIndex(slideIndex)}
                />
              ))}
            </div>
          </>
        ) : null}
      </section>
  )
}
