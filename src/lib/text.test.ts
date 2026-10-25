import { describe, expect, it } from 'vitest'
import { buildKeywords, primarySearchToken, slugify, tokenize } from './text.ts'

describe('arabic search tokens', () => {
  it('normalizes alef variants, ta marbuta, and the definite article', () => {
    expect(tokenize('الميزانية')).toEqual(['ميزانيه'])
    expect(tokenize('إجراءات')).toEqual(['اجراءات'])
    expect(buildKeywords('صحة الطرق', 'الصحة')).toEqual(['صحه', 'طرق'])
  })

  it('drops stop words and chooses the longest token for Firestore', () => {
    const tokens = tokenize('في كلفة المعيشة خلال الربع')
    expect(tokens).not.toContain('في')
    expect(tokens).not.toContain('خلال')
    expect(primarySearchToken(tokens)).toBe('معيشه')
  })

  it('builds a hyphenated slug without punctuation', () => {
    expect(slugify('حزمة إجراءات لتخفيف الكلفة!')).toBe('حزمه-اجراءات-لتخفيف-الكلفه')
  })
})
