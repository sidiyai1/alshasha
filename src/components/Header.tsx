import { Menu, Search, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { navigationCategories } from '../data/defaults.ts'
import { formatArabicDate } from '../lib/dates.ts'
import type { Category } from '../types.ts'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block whitespace-nowrap px-3 py-3 text-sm font-bold transition ${
    isActive ? 'bg-brand-green-dark text-brand-gold' : 'text-white hover:text-brand-gold'
  }`

export function Header({ categories }: { categories: Category[] }) {
  const nav = navigationCategories(categories)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const today = formatArabicDate(new Date())

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <header className="border-b border-brand-line bg-white">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:right-4 focus:top-4 focus:z-50 focus:bg-brand-gold focus:px-3 focus:py-2 focus:text-brand-green"
      >
        تخطي إلى المحتوى
      </a>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <NavLink to="/" className="inline-block shrink-0" aria-label="الشاشة، الصفحة الرئيسية">
          <img
            src="/logo.jpg"
            alt="الشاشة"
            className="block h-auto w-auto max-h-28 max-w-[min(100%,20rem)] object-contain sm:max-h-36 md:max-h-44 md:max-w-[34rem]"
            fetchPriority="high"
            draggable={false}
          />
        </NavLink>
        <div className="flex min-w-[16rem] flex-1 flex-col items-start gap-3 sm:items-end">
          <p className="text-sm font-bold text-brand-green sm:text-base">{today}</p>
          <form onSubmit={onSearch} className="flex w-full max-w-sm gap-2" role="search">
            <label className="sr-only" htmlFor="header-search">
              بحث في الأخبار
            </label>
            <input
              id="header-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full border border-brand-line px-3 py-2 text-sm"
              placeholder="ابحثوا في العناوين"
            />
            <button type="submit" className="bg-brand-green px-3 text-white" aria-label="بحث">
              <Search aria-hidden="true" size={18} />
            </button>
          </form>
        </div>
      </div>
      <div className="h-1 bg-brand-gold" />
      <nav className="bg-brand-green" aria-label="الأقسام">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-2 md:hidden">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-2 py-3 font-bold text-white"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X aria-hidden="true" size={20} /> : <Menu aria-hidden="true" size={20} />}
            القائمة
          </button>
        </div>
        <ul id="mobile-nav" className={`${open ? 'block' : 'hidden'} border-t border-white/10 md:flex md:flex-wrap md:justify-center md:border-0`}>
          <li>
            <NavLink to="/" end className={linkClass}>
              الرئيسية
            </NavLink>
          </li>
          {nav.map((category) => (
            <li key={category.id}>
              <NavLink to={`/category/${category.slug}`} className={linkClass}>
                {category.name}
              </NavLink>
            </li>
          ))}
          <li>
            <NavLink to="/archive" className={linkClass}>
              أرشيف الجريدة
            </NavLink>
          </li>
          <li>
            <NavLink to="/contact" className={linkClass}>
              اتصل بنا
            </NavLink>
          </li>
        </ul>
      </nav>
    </header>
  )
}
