import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EditionCard } from '../components/EditionCard.tsx'
import { PageFrame } from '../components/PageFrame.tsx'
import { Alert, Button, EmptyState, SelectInput, Spinner, TextInput } from '../components/ui.tsx'
import { LIMITS } from '../config.ts'
import { ARABIC_MONTHS, archiveYears, resolveEditionBounds } from '../lib/archiveQuery.ts'
import { toMessage } from '../lib/errors.ts'
import { usePageMeta } from '../lib/meta.ts'
import { listPublishedEditions } from '../services/content.ts'
import type { Edition, PageCursor } from '../types.ts'

export function ArchivePage() {
  usePageMeta('أرشيف الجريدة الورقية', 'أغلفة أعداد الشاشة الورقية، مع التصفية بالسنة والشهر والبحث برقم العدد أو التاريخ.')
  const [searchParams, setSearchParams] = useSearchParams()
  const yearParam = searchParams.get('year') ?? ''
  const monthParam = searchParams.get('month') ?? ''
  const queryParam = searchParams.get('q') ?? ''
  const [year, setYear] = useState(yearParam)
  const [month, setMonth] = useState(monthParam)
  const [query, setQuery] = useState(queryParam)
  const [items, setItems] = useState<Edition[]>([])
  const [cursor, setCursor] = useState<PageCursor | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const years = archiveYears()

  useEffect(() => {
    setYear(yearParam)
    setMonth(yearParam ? monthParam : '')
    setQuery(queryParam)
  }, [monthParam, queryParam, yearParam])

  useEffect(() => {
    const bounds = resolveEditionBounds({
      year: yearParam ? Number(yearParam) : null,
      month: monthParam ? Number(monthParam) : null,
      search: queryParam,
    })
    if (bounds.searchError) {
      setItems([])
      setCursor(null)
      setHasMore(false)
      setError(bounds.searchError)
      setLoading(false)
      return
    }
    if (bounds.empty) {
      setItems([])
      setCursor(null)
      setHasMore(false)
      setError(null)
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    setError(null)
    listPublishedEditions({
      year: yearParam ? Number(yearParam) : null,
      month: monthParam ? Number(monthParam) : null,
      search: queryParam,
      limit: LIMITS.archive,
    })
      .then((page) => {
        if (!active) return
        setItems(page.items)
        setCursor(page.nextCursor)
        setHasMore(page.hasMore)
      })
      .catch((reason: unknown) => {
        if (active) setError(toMessage(reason))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [monthParam, queryParam, yearParam])

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = new URLSearchParams()
    if (year) next.set('year', year)
    if (year && month) next.set('month', month)
    if (query.trim()) next.set('q', query.trim())
    setSearchParams(next)
  }

  return (
    <PageFrame>
      <p className="text-sm font-bold text-brand-gold">النسخة الورقية</p>
      <h1 className="mt-1 text-3xl font-extrabold text-brand-green md:text-4xl">أرشيف الجريدة الورقية</h1>
      <p className="mt-3 max-w-2xl leading-8 text-brand-muted">
        الأعداد مرتبة من الأحدث. اقرأوا العدد داخل الموقع، أو حمّلوا ملف PDF. الملف لا يُجلب إلا عند فتح العدد أو تنزيله.
      </p>
      <form onSubmit={onSubmit} className="mt-6 grid gap-3 border border-brand-line bg-brand-cream p-4 md:grid-cols-[10rem_12rem_1fr_auto] md:items-end">
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-brand-green">السنة</span>
          <SelectInput value={year} onChange={(event) => {
            setYear(event.target.value)
            if (!event.target.value) setMonth('')
          }}>
            <option value="">كل السنوات</option>
            {years.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </SelectInput>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-brand-green">الشهر</span>
          <SelectInput value={month} disabled={!year} onChange={(event) => setMonth(event.target.value)}>
            <option value="">كل الشهور</option>
            {ARABIC_MONTHS.map((label, index) => (
              <option key={label} value={index + 1}>
                {label}
              </option>
            ))}
          </SelectInput>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-brand-green">بحث</span>
          <TextInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="رقم العدد أو 2026-10-20"
            inputMode="search"
          />
        </label>
        <div className="flex gap-2">
          <Button type="submit">عرض</Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setYear('')
              setMonth('')
              setQuery('')
              setSearchParams(new URLSearchParams())
            }}
          >
            مسح
          </Button>
        </div>
      </form>
      <div className="mt-8">
        {loading ? <Spinner label="جارٍ تحميل الأعداد" /> : null}
        {error ? <Alert tone="error">{error}</Alert> : null}
        {!loading && !error && items.length === 0 ? (
          <EmptyState title="لا أعداد في هذا النطاق" body="غيّروا السنة أو الشهر، أو ابحثوا برقم عدد آخر." />
        ) : null}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {items.map((edition) => (
            <EditionCard key={edition.id} edition={edition} heading="h2" />
          ))}
        </div>
        {hasMore && cursor ? (
          <div className="mt-6">
            <Button
              type="button"
              variant="ghost"
              disabled={loadingMore}
              onClick={() => {
                setLoadingMore(true)
                void listPublishedEditions({
                  cursor,
                  year: yearParam ? Number(yearParam) : null,
                  month: monthParam ? Number(monthParam) : null,
                  search: queryParam,
                  limit: LIMITS.archive,
                })
                  .then((page) => {
                    setItems((current) => [...current, ...page.items])
                    setCursor(page.nextCursor)
                    setHasMore(page.hasMore)
                  })
                  .catch((reason: unknown) => setError(toMessage(reason)))
                  .finally(() => setLoadingMore(false))
              }}
            >
              {loadingMore ? 'جارٍ التحميل…' : 'أعداد أقدم'}
            </Button>
          </div>
        ) : null}
      </div>
    </PageFrame>
  )
}
