import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { demoSettings } from '../data/demo.ts'
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from '../data/defaults.ts'
import { usingDemoData, getSettings, listCategories } from '../services/content.ts'
import type { Category, SiteSettings } from '../types.ts'
import { Footer } from './Footer.tsx'
import { Header } from './Header.tsx'
import { Alert } from './ui.tsx'

export interface PublicContext {
  categories: Category[]
  settings: SiteSettings
  ready: boolean
}

export function PublicLayout() {
  const demoMode = usingDemoData()
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES)
  const [settings, setSettings] = useState<SiteSettings>(demoMode ? demoSettings : DEFAULT_SETTINGS)
  const [ready, setReady] = useState(demoMode)

  useEffect(() => {
    let active = true
    Promise.all([listCategories(), getSettings()])
      .then(([nextCategories, nextSettings]) => {
        if (!active) return
        if (nextCategories.length > 0) setCategories(nextCategories)
        setSettings(nextSettings)
        setReady(true)
      })
      .catch(() => {
        if (active) setReady(true)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header categories={categories} />
      {demoMode ? (
        <div className="no-print border-b border-brand-gold bg-brand-cream">
          <div className="mx-auto max-w-6xl px-4 py-2">
            <Alert>
              وضع العرض التجريبي: المحتوى محلي على هذا الجهاز ولم يُحفظ في Firebase. اربطوا المشروع ليبدأ النشر الحقيقي.
            </Alert>
          </div>
        </div>
      ) : null}
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet context={{ categories, settings, ready } satisfies PublicContext} />
      </main>
      <Footer categories={categories} settings={settings} />
    </div>
  )
}
