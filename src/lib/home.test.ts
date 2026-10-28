import { describe, expect, it } from 'vitest'
import { arrangeHomeStories, categoryBadgeColor, selectCategoryStories } from './home.ts'
import type { Article } from '../types.ts'

function article(id: string): Article {
  const stamp = new Date('2026-10-20T09:00:00Z')
  return {
    id,
    title: id,
    slug: id,
    summary: '',
    content: '',
    categoryId: 'siyasa',
    categorySlug: 'siyasa',
    categoryName: 'سياسة',
    author: '',
    imageUrl: '',
    imagePublicId: '',
    seoTitle: '',
    seoDescription: '',
    status: 'published',
    featured: false,
    breaking: false,
    isDemo: false,
    keywords: [],
    publishedAt: stamp,
    createdAt: stamp,
    updatedAt: stamp,
    createdBy: '',
  }
}

describe('arrangeHomeStories', () => {
  it('keeps every fetched article once and leads with a pinned story', () => {
    const page = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'].map(article)
    const pinned = article('pinned')
    const arranged = arrangeHomeStories([pinned, page[0]], page)
    expect(arranged.slides.map((item) => item.id)).toEqual(['pinned', 'a', 'b', 'c'])
    expect(arranged.secondary.map((item) => item.id)).toEqual(['d', 'e', 'f'])
    expect(arranged.latest.map((item) => item.id)).toEqual(['g', 'h', 'i'])
    const shown = [...arranged.slides, ...arranged.secondary, ...arranged.latest].map((item) => item.id)
    expect(new Set(shown).size).toBe(shown.length)
    expect(shown).toContain('pinned')
  })

  it('returns an empty arrangement when nothing is published', () => {
    expect(arrangeHomeStories([], [])).toEqual({ featured: null, slides: [], secondary: [], latest: [] })
  })

  it('still lists a lone story under the latest heading', () => {
    const only = article('only')
    const arranged = arrangeHomeStories([], [only])
    expect(arranged.slides.map((item) => item.id)).toEqual(['only'])
    expect(arranged.latest.map((item) => item.id)).toEqual(['only'])
  })
})

describe('selectCategoryStories', () => {
  it('skips stories already used higher on the page, then falls back', () => {
    const items = ['a', 'b', 'c'].map(article)
    expect(selectCategoryStories(items, new Set(['a'])).map((item) => item.id)).toEqual(['b', 'c'])
    expect(selectCategoryStories(items, new Set(['a', 'b', 'c']))).toEqual([])
  })
})

describe('categoryBadgeColor', () => {
  it('stays inside the palette and stays stable for a slug', () => {
    const first = categoryBadgeColor('siyasa')
    expect(first).toBe(categoryBadgeColor('siyasa'))
    expect(['#06452e', '#8d1d3b', '#1e4d8c', '#9a3412', '#5b21b6', '#0f766e', '#a16207', '#9f1239']).toContain(first)
  })
})
