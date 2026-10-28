import { describe, expect, it } from 'vitest'
import { formatNewsTime } from './dates.ts'

describe('formatNewsTime', () => {
  const now = new Date('2026-10-27T12:00:00Z')

  it('uses a relative phrase for fresh stories and a calendar date after a week', () => {
    expect(formatNewsTime(new Date('2026-10-27T12:00:00Z'), now)).toBe('الآن')
    expect(formatNewsTime(new Date('2026-10-27T10:00:00Z'), now)).toMatch(/ساع/)
    expect(formatNewsTime(new Date('2026-10-01T12:00:00Z'), now)).toContain('2026')
  })
})
