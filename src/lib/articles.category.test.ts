import { describe, expect, it } from 'vitest'
import { resolveCategorySelection } from './articles.ts'

const categories = [
  { id: 'local-news' },
  { id: 'sport' },
]

describe('resolveCategorySelection', () => {
  it('keeps a selected Firestore document id', () => {
    expect(resolveCategorySelection('sport', categories, true)).toBe('sport')
  })

  it('replaces a missing default on a new article with the first stored category', () => {
    expect(resolveCategorySelection('siyasa', categories, true)).toBe('local-news')
    expect(resolveCategorySelection('سياسة', categories, true)).toBe('local-news')
  })

  it('clears a category that is no longer stored', () => {
    expect(resolveCategorySelection('siyasa', categories, false)).toBe('')
    expect(resolveCategorySelection('sport', [], false)).toBe('')
  })
})
