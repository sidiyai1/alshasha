import { describe, expect, it } from 'vitest'
import { sanitizeHtml } from './sanitize.ts'

describe('sanitizeHtml', () => {
  it('removes scripts and unsafe urls', () => {
    const clean = sanitizeHtml(
      '<p>خبر</p><script>alert(1)</script><a href="javascript:alert(1)">اضغط</a><img src=x onerror=alert(1)>',
    )
    expect(clean).not.toContain('script')
    expect(clean).not.toContain('javascript:')
    expect(clean).not.toContain('<img')
    expect(clean).toContain('خبر')
  })

  it('keeps safe editorial markup and forces safe link attributes', () => {
    const clean = sanitizeHtml('<h2>عنوان</h2><p>نص <strong>مهم</strong></p><a href="https://example.com/story">المصدر</a>')
    expect(clean).toContain('<h2>عنوان</h2>')
    expect(clean).toContain('<strong>مهم</strong>')
    expect(clean).toContain('href="https://example.com/story"')
    expect(clean).toContain('rel="noopener noreferrer"')
  })
})
