import { Link } from 'react-router-dom'
import { navigationCategories } from '../data/defaults.ts'
import type { Category, SiteSettings } from '../types.ts'
import { pageShell } from './PageFrame.tsx'

export function Footer({ categories, settings }: { categories: Category[]; settings: SiteSettings }) {
  const nav = navigationCategories(categories)
  const social = [
    ['إكس', settings.socialX],
    ['فيسبوك', settings.socialFacebook],
    ['إنستغرام', settings.socialInstagram],
    ['يوتيوب', settings.socialYoutube],
  ].filter((item): item is [string, string] => Boolean(item[1]))

  return (
    <footer className="mt-auto border-t-4 border-brand-gold bg-brand-green text-white">
      <div className={`${pageShell} grid gap-8 py-10 md:grid-cols-[auto_1fr_1fr]`}>
        <div>
          <div className="inline-block bg-white p-3">
            <img
              src="/logo.jpg"
              alt="الشاشة"
              className="block h-auto w-auto max-h-24 max-w-64 object-contain"
              draggable={false}
            />
          </div>
          {settings.tagline ? <p className="mt-3 max-w-xs text-sm leading-7 text-brand-gold">{settings.tagline}</p> : null}
        </div>
        <div>
          <h2 className="mb-3 text-lg font-extrabold text-brand-gold">الأقسام</h2>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {nav.map((category) => (
              <li key={category.id}>
                <Link className="hover:text-brand-gold" to={`/category/${category.slug}`}>
                  {category.name}
                </Link>
              </li>
            ))}
            <li>
              <Link className="hover:text-brand-gold" to="/archive">
                النسخة الورقية
              </Link>
            </li>
            <li>
              <Link className="hover:text-brand-gold" to="/about">
                من نحن
              </Link>
            </li>
          </ul>
        </div>
        <div className="text-sm leading-7">
          <h2 className="mb-3 text-lg font-extrabold text-brand-gold">التحرير</h2>
          {settings.contactEmail ? <p>{settings.contactEmail}</p> : null}
          {settings.contactPhone ? <p>{settings.contactPhone}</p> : null}
          {settings.contactAddress ? <p>{settings.contactAddress}</p> : null}
          {social.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-3">
              {social.map(([label, href]) => (
                <li key={label}>
                  <a className="underline decoration-brand-gold underline-offset-4 hover:text-brand-gold" href={href} target="_blank" rel="noopener noreferrer">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-4">
            <Link className="font-bold text-brand-gold hover:text-white" to="/contact">
              اتصل بنا
            </Link>
          </p>
        </div>
      </div>
      <div className="border-t border-white/15 px-4 py-4 text-center text-sm">
        © {new Date().getFullYear()} الشاشة. المواد الموسومة «محتوى تجريبي» ليست أخباراً عن أحداث واقعية.
      </div>
    </footer>
  )
}
