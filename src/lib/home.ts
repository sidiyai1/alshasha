import type { Article } from '../types.ts'

export interface ArrangedHome {
  featured: Article | null
  slides: Article[]
  secondary: Article[]
  latest: Article[]
}

const BADGE_COLORS = ['#06452e', '#8d1d3b', '#1e4d8c', '#9a3412', '#5b21b6', '#0f766e', '#a16207', '#9f1239']

/** Stable badge color from a category slug, so sections stay distinct without hardcoded names. */
export function categoryBadgeColor(key: string): string {
  let hash = 0
  for (const char of key) hash = (hash + char.charCodeAt(0) * 17) % BADGE_COLORS.length
  return BADGE_COLORS[hash] ?? BADGE_COLORS[0]
}

/**
 * Split the pinned stories and the first latest page into a slider, three cards, and the list.
 * Hero stories are not repeated in the latest list when newer pages remain.
 * A single published story still appears in the latest list.
 */
export function arrangeHomeStories(picked: Article[], latestPage: Article[]): ArrangedHome {
  const pool: Article[] = []
  const seen = new Set<string>()
  for (const article of [...picked, ...latestPage]) {
    if (seen.has(article.id)) continue
    seen.add(article.id)
    pool.push(article)
  }
  const slides = pool.slice(0, Math.min(4, pool.length))
  const secondary = pool.slice(slides.length, slides.length + 3)
  const consumed = new Set([...slides, ...secondary].map((article) => article.id))
  const remainder = pool.filter((article) => !consumed.has(article.id))
  return {
    featured: slides[0] ?? null,
    slides,
    secondary,
    // Keep the latest list visible when every published story is already in the hero.
    latest: remainder.length > 0 ? remainder : pool.slice(0, 6),
  }
}

/** Prefer stories that are not already in the hero or the latest list. */
export function selectCategoryStories(articles: Article[], reservedIds: ReadonlySet<string>, limit = 4): Article[] {
  return articles.filter((article) => !reservedIds.has(article.id)).slice(0, limit)
}
