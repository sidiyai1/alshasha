import { describe, expect, it } from 'vitest'
import { missingCategorySuggestions } from '../data/suggestedCategories.ts'
import { visibleNavCount } from './navigation.ts'
import type { Category } from '../types.ts'

describe('visibleNavCount', () => {
  it('shows every item when the row is wide enough', () => {
    expect(visibleNavCount([80, 90, 70], 300, 60)).toBe(3)
  })

  it('reserves room for the overflow control', () => {
    expect(visibleNavCount([80, 90, 70], 200, 60)).toBe(1)
    expect(visibleNavCount([80, 90, 70], 100, 60)).toBe(0)
  })
})

describe('missingCategorySuggestions', () => {
  it('reuses an existing sports category instead of offering a duplicate', () => {
    const existing = [
      { id: 'sports', name: 'الرياضة', slug: 'sports', description: '', order: 1, showInNav: true },
    ] satisfies Category[]
    const missing = missingCategorySuggestions(existing)
    expect(missing.some((item) => item.slug === 'sports' || item.name === 'الرياضة')).toBe(false)
    expect(missing.map((item) => item.name)).toContain('السياسة')
    expect(missing.map((item) => item.name)).toContain('الأخبار الوطنية')
  })
})
