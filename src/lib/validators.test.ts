import { describe, expect, it } from 'vitest'
import { isSafeMediaUrl, validateArticle } from './validators.ts'
import type { ArticleInput } from '../types.ts'

const validArticle = (): ArticleInput => ({
  title: 'حزمة إجراءات لتخفيف كلفة المعيشة',
  slug: 'حزمه-اجراءات',
  summary: 'موجز تجريبي يوضح خبر المعيشة بتفاصيل كافية للنشر.',
  content: '<p>هذا نص تجريبي طويل بما يكفي ليكون خبراً صالحاً للنشر على موقع الشاشة اليوم.</p>',
  categoryId: 'siyasa',
  author: 'قسم السياسة',
  imageUrl: 'https://example.com/photo.jpg',
  seoTitle: '',
  seoDescription: '',
  publishedAt: '2026-10-25T09:00',
  status: 'published',
  featured: false,
  breaking: false,
})

describe('media urls', () => {
  it('accepts https and safe site paths, and rejects embedded or script urls', () => {
    expect(isSafeMediaUrl('https://cdn.example.com/issue.pdf')).toBe(true)
    expect(isSafeMediaUrl('/demo/issue-sample.pdf')).toBe(true)
    expect(isSafeMediaUrl('http://example.com/a.jpg')).toBe(false)
    expect(isSafeMediaUrl('javascript:alert(1)')).toBe(false)
    expect(isSafeMediaUrl('/../secret.pdf')).toBe(false)
    expect(isSafeMediaUrl('data:application/pdf;base64,AAAA')).toBe(false)
  })
})

describe('validateArticle', () => {
  it('accepts a complete published article', () => {
    expect(validateArticle(validArticle())).toEqual({})
  })

  it('requires a date and a real summary before publishing', () => {
    const errors = validateArticle({ ...validArticle(), summary: 'قصير', publishedAt: '' })
    expect(errors.summary).toBeTruthy()
    expect(errors.publishedAt).toBeTruthy()
  })
})
