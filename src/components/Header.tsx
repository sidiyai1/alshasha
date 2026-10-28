import { ChevronDown, Menu, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { navigationCategories } from '../data/defaults.ts'
import { formatArabicDate } from '../lib/dates.ts'
import { visibleNavCount } from '../lib/navigation.ts'
import type { Category } from '../types.ts'
import { pageShell } from './PageFrame.tsx'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block whitespace-nowrap px-3 py-3 text-sm font-bold transition ${
    isActive ? 'bg-brand-green-dark text-brand-gold' : 'text-white hover:text-brand-gold'
  }`

const menuLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block border-b border-brand-line px-4 py-3.5 text-base font-bold ${
    isActive ? 'bg-brand-cream text-brand-green' : 'text-brand-ink hover:bg-brand-cream hover:text-brand-green'
  }`

export function Header({ categories }: { categories: Category[] }) {
  const nav = navigationCategories(categories)
  const [open, setOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(nav.length)
  const [query, setQuery] = useState('')
  const barRef = useRef<HTMLElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const menuId = useId()
  const today = formatArabicDate(new Date())
  const visible = nav.slice(0, visibleCount)
  const overflow = nav.slice(visibleCount)

  useEffect(() => {
    setOpen(false)
    setMoreOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    const bar = barRef.current
    const measure = measureRef.current
    if (!bar || !measure) return
    function measureRow() {
      if (!bar || !measure) return
      const widths = [...measure.querySelectorAll<HTMLElement>('[data-nav-item]')].map((item) => item.offsetWidth)
      const home = measure.querySelector<HTMLElement>('[data-pin="home"]')?.offsetWidth ?? 0
      const paper = measure.querySelector<HTMLElement>('[data-pin="paper"]')?.offsetWidth ?? 0
      const more = measure.querySelector<HTMLElement>('[data-pin="more"]')?.offsetWidth ?? 0
      const contact = measure.querySelector<HTMLElement>('[data-pin="contact"]')?.offsetWidth ?? 0
      const about = measure.querySelector<HTMLElement>('[data-pin="about"]')?.offsetWidth ?? 0
      const total = widths.reduce((sum, width) => sum + width, 0)
      const room = bar.clientWidth - home - paper
      if (total + contact + about <= room) {
        setVisibleCount(widths.length)
        return
      }
      setVisibleCount(visibleNavCount(widths, room, more))
    }
    measureRow()
    const observer = new ResizeObserver(measureRow)
    observer.observe(bar)
    return () => observer.disconnect()
  }, [nav.map((category) => `${category.id}:${category.name}:${category.order}`).join('|')])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const panel = menuRef.current
    const focusable = panel ? [...panel.querySelectorAll<HTMLElement>('a, button')] : []
    focusable[0]?.focus()
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        menuButtonRef.current?.focus()
        return
      }
      if (event.key !== 'Tab' || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (!moreOpen) return
    function onPointer(event: PointerEvent) {
      if (!barRef.current?.contains(event.target as Node)) setMoreOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setMoreOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [moreOpen])

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const term = query.trim()
    navigate(term ? `/search?q=${encodeURIComponent(term)}` : '/search')
    setOpen(false)
  }

  function closeMenu() {
    setOpen(false)
    menuButtonRef.current?.focus()
  }

  return (
    <header className="relative z-40 border-b border-brand-line bg-white">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:right-4 focus:top-4 focus:z-50 focus:bg-brand-gold focus:px-3 focus:py-2 focus:text-brand-green"
      >
        تخطي إلى المحتوى
      </a>
      <div
        className="relative bg-[length:100%_auto] bg-top bg-no-repeat md:bg-[center_62%]"
        style={{ backgroundImage: 'url(/header-bg.jpg)' }}
      >
      <div className={`${pageShell} relative flex h-full flex-col items-center justify-center gap-3 py-3 md:flex-row md:items-center md:justify-between md:py-4`}>
        <NavLink to="/" className="inline-block shrink-0" aria-label="الشاشة، الصفحة الرئيسية">
          <img
            src="/logo-header.png"
            alt="الشاشة"
            className="block h-auto w-auto max-h-36 max-w-[16rem] object-contain sm:max-h-40 sm:max-w-xs lg:max-h-44 lg:max-w-md"
            fetchPriority="high"
            draggable={false}
          />
        </NavLink>
        <div className="flex w-full flex-col items-center gap-2 md:max-w-md md:items-stretch">
          <p className="text-sm font-bold text-brand-green md:text-start">{today}</p>
          <form onSubmit={onSearch} className="flex w-full overflow-hidden border border-brand-line" role="search">
            <label className="sr-only" htmlFor="header-search">
              بحث في الأخبار
            </label>
            <input
              id="header-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-w-0 flex-1 px-3 py-2.5 text-sm outline-none"
              placeholder="ابحثوا في العناوين"
              enterKeyHint="search"
            />
            <button type="submit" className="shrink-0 bg-brand-green px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-green-dark">
              بحث
            </button>
          </form>
        </div>
      </div>
      </div>
      <div className="h-1 bg-brand-gold" />
      <nav ref={barRef} className="relative bg-brand-green" aria-label="الأقسام">
        <div ref={measureRef} className="pointer-events-none absolute h-0 overflow-hidden whitespace-nowrap opacity-0" aria-hidden="true">
          <span data-pin="home" className="inline-block px-3 py-3 text-sm font-bold">
            الرئيسية
          </span>
          <span data-pin="paper" className="inline-block px-3 py-3 text-sm font-bold">
            النسخة الورقية
          </span>
          <span data-pin="more" className="inline-block px-3 py-3 text-sm font-bold">
            المزيد
          </span>
          <span data-pin="about" className="inline-block px-3 py-3 text-sm font-bold">
            من نحن
          </span>
          <span data-pin="contact" className="inline-block px-3 py-3 text-sm font-bold">
            اتصل بنا
          </span>
          {nav.map((category) => (
            <span key={category.id} data-nav-item className="inline-block px-3 py-3 text-sm font-bold">
              {category.name}
            </span>
          ))}
        </div>
        <div className={`${pageShell} flex items-center lg:hidden`}>
          <button
            ref={menuButtonRef}
            type="button"
            className="inline-flex min-h-11 items-center gap-2 px-2 py-3 font-bold text-white"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X aria-hidden="true" size={22} /> : <Menu aria-hidden="true" size={22} />}
            القائمة
          </button>
        </div>
        <div className={`${pageShell} hidden items-stretch lg:flex`}>
          <NavLink to="/" end className={linkClass}>
            الرئيسية
          </NavLink>
          <ul className="flex min-w-0 flex-1 items-stretch">
            {visible.map((category) => (
              <li key={category.id}>
                <NavLink to={`/category/${category.slug}`} className={linkClass}>
                  {category.name}
                </NavLink>
              </li>
            ))}
            {overflow.length > 0 ? (
              <li className="relative">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 whitespace-nowrap px-3 py-3 text-sm font-bold text-white hover:text-brand-gold"
                  aria-expanded={moreOpen}
                  aria-controls="more-nav"
                  onClick={() => setMoreOpen((value) => !value)}
                >
                  المزيد
                  <ChevronDown aria-hidden="true" size={16} />
                </button>
                {moreOpen ? (
                  <ul id="more-nav" className="absolute end-0 top-full z-40 min-w-52 border border-white/10 bg-brand-green shadow-lg">
                    {overflow.map((category) => (
                      <li key={category.id}>
                        <NavLink to={`/category/${category.slug}`} className={linkClass}>
                          {category.name}
                        </NavLink>
                      </li>
                    ))}
                    <li>
                      <NavLink to="/about" className={linkClass}>
                        من نحن
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/contact" className={linkClass}>
                        اتصل بنا
                      </NavLink>
                    </li>
                  </ul>
                ) : null}
              </li>
            ) : null}
          </ul>
          <NavLink to="/archive" className={linkClass}>
            النسخة الورقية
          </NavLink>
          {overflow.length === 0 ? (
            <>
              <NavLink to="/about" className={linkClass}>
                من نحن
              </NavLink>
              <NavLink to="/contact" className={linkClass}>
                اتصل بنا
              </NavLink>
            </>
          ) : null}
        </div>
      </nav>
      {open ? (
        <>
          <button type="button" className="fixed inset-0 z-30 bg-brand-ink/45 lg:hidden" aria-label="إغلاق القائمة" onClick={closeMenu} />
          <div
            ref={menuRef}
            id={menuId}
            role="dialog"
            aria-modal="true"
            aria-label="القائمة"
            className="absolute inset-x-0 top-full z-40 max-h-[min(75vh,36rem)] overflow-y-auto bg-white shadow-2xl lg:hidden"
          >
            <div className="flex items-center justify-between border-b border-brand-line px-4 py-3">
              <p className="font-extrabold text-brand-green">القائمة</p>
              <button type="button" className="inline-flex items-center gap-1 font-bold text-brand-green" onClick={closeMenu}>
                <X aria-hidden="true" size={18} />
                إغلاق
              </button>
            </div>
            <nav aria-label="صفحات الموقع">
              <NavLink to="/" end className={menuLinkClass}>
                الرئيسية
              </NavLink>
              <p className="bg-brand-cream px-4 py-2 text-sm font-extrabold text-brand-green">الأقسام</p>
              {nav.map((category) => (
                <NavLink key={category.id} to={`/category/${category.slug}`} className={menuLinkClass}>
                  {category.name}
                </NavLink>
              ))}
              <p className="bg-brand-cream px-4 py-2 text-sm font-extrabold text-brand-green">الصفحات</p>
              <NavLink to="/archive" className={menuLinkClass}>
                النسخة الورقية
              </NavLink>
              <NavLink to="/about" className={menuLinkClass}>
                من نحن
              </NavLink>
              <NavLink to="/contact" className={menuLinkClass}>
                اتصل بنا
              </NavLink>
            </nav>
          </div>
        </>
      ) : null}
    </header>
  )
}
