import { useEffect } from 'react'

export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = title === 'الشاشة' ? 'الشاشة' : `${title} | الشاشة`
    if (!description) return
    document.querySelector('meta[name="description"]')?.setAttribute('content', description)
  }, [title, description])
}

export function useNoIndex() {
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'robots')
      document.head.appendChild(meta)
    }
    const previous = meta.getAttribute('content')
    meta.setAttribute('content', 'noindex, nofollow')
    return () => {
      meta?.setAttribute('content', previous || 'index, follow')
    }
  }, [])
}
