import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.tsx'

const items = [
  { to: '/admin', label: 'لوحة التحكم', match: (path: string) => path === '/admin' },
  {
    to: '/admin/articles',
    label: 'المقالات',
    match: (path: string) => path === '/admin/articles' || (/^\/admin\/articles\/.+/.test(path) && path !== '/admin/articles/new'),
  },
  { to: '/admin/articles/new', label: 'إضافة مقال', match: (path: string) => path === '/admin/articles/new' },
  { to: '/admin/categories', label: 'التصنيفات', match: (path: string) => path.startsWith('/admin/categories') },
  {
    to: '/admin/archives',
    label: 'أرشيف الجريدة',
    match: (path: string) => path === '/admin/archives' || (/^\/admin\/archives\/.+/.test(path) && path !== '/admin/archives/new'),
  },
  { to: '/admin/archives/new', label: 'إضافة عدد جديد', match: (path: string) => path === '/admin/archives/new' },
  { to: '/admin/settings', label: 'إعدادات الموقع', match: (path: string) => path.startsWith('/admin/settings') },
  { to: '/admin/messages', label: 'الرسائل', match: (path: string) => path.startsWith('/admin/messages') },
]

function itemClass(active: boolean) {
  return `block border-s-4 px-4 py-3 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-gold ${
    active ? 'border-brand-gold bg-white text-brand-green' : 'border-transparent text-white hover:bg-white/10'
  }`
}

export function AdminLayout() {
  const { user, signOutAdmin } = useAuth()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="min-h-screen bg-brand-cream lg:grid lg:grid-cols-[17.5rem_1fr]">
      <header className="flex items-center justify-between bg-brand-green px-4 py-3 text-white lg:hidden">
        <p className="font-extrabold">إدارة الشاشة</p>
        <button
          type="button"
          className="border border-brand-gold px-3 py-1.5 text-sm font-bold"
          aria-expanded={open}
          aria-controls="admin-nav"
          onClick={() => setOpen((current) => !current)}
        >
          {open ? 'إغلاق' : 'القائمة'}
        </button>
      </header>
      <aside id="admin-nav" className={`${open ? 'block' : 'hidden'} bg-brand-green text-white lg:block lg:min-h-screen`}>
        <div className="border-b border-white/15 px-4 py-5">
          <p className="text-lg font-extrabold">الشاشة</p>
          <p className="mt-1 text-xs text-white/75">لوحة الإدارة</p>
          <a className="mt-3 inline-block text-sm font-bold text-brand-gold underline" href="/" target="_blank" rel="noreferrer">
            عرض الموقع
          </a>
        </div>
        <nav aria-label="أقسام الإدارة" className="py-2">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} className={() => itemClass(item.match(pathname))}>
              {item.label}
            </NavLink>
          ))}
          <button type="button" className={`${itemClass(false)} w-full text-right`} onClick={() => void signOutAdmin()}>
            تسجيل الخروج
          </button>
        </nav>
        <p className="px-4 py-4 text-xs break-all text-white/70">{user?.email}</p>
      </aside>
      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
