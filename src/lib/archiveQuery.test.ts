import { describe, expect, it } from 'vitest'
import { publishedEditions } from '../data/demo.ts'
import { editionWithinBounds, latinDigits, resolveEditionBounds } from './archiveQuery.ts'
import { listPublishedEditions } from '../services/demoRepository.ts'

describe('archive search', () => {
  it('reads Arabic digits and an issue-number prefix', () => {
    expect(latinDigits('١٢٨٤')).toBe('1284')
    const bounds = resolveEditionBounds({ search: 'العدد ١٢٨١' })
    const matched = publishedEditions().filter((edition) => editionWithinBounds(edition, bounds))
    expect(matched.map((edition) => edition.issueNumber)).toEqual([1281])
  })

  it('keeps a month inside the selected year and ignores drafts', () => {
    const bounds = resolveEditionBounds({ year: 2026, month: 10 })
    const matched = publishedEditions().filter((edition) => editionWithinBounds(edition, bounds))
    expect(matched.length).toBeGreaterThan(0)
    expect(matched.every((edition) => edition.publishedAt?.getFullYear() === 2026)).toBe(true)
    expect(matched.every((edition) => edition.publishedAt?.getMonth() === 9)).toBe(true)
    expect(matched.some((edition) => edition.issueNumber === 1281)).toBe(false)
    expect(matched.some((edition) => edition.issueNumber === 1285)).toBe(false)
  })

  it('matches one publication day and rejects a day outside the year filter', () => {
    const day = resolveEditionBounds({ search: '20/10/2026' })
    const matched = publishedEditions().filter((edition) => editionWithinBounds(edition, day))
    expect(matched.map((edition) => edition.issueNumber)).toEqual([1284])

    const outside = resolveEditionBounds({ year: 2025, search: '2026-10-20' })
    expect(outside.empty).toBe(true)
    expect(publishedEditions().some((edition) => editionWithinBounds(edition, outside))).toBe(false)
  })

  it('pages the public archive newest first', async () => {
    const first = await listPublishedEditions({ limit: 2 })
    expect(first.items.map((edition) => edition.issueNumber)).toEqual([1284, 1283])
    expect(first.hasMore).toBe(true)
    const second = await listPublishedEditions({ limit: 2, cursor: first.nextCursor })
    expect(second.items[0]?.issueNumber).toBe(1282)

    const year = resolveEditionBounds({ year: 2025 })
    const older = publishedEditions().filter((edition) => editionWithinBounds(edition, year))
    expect(older.map((edition) => edition.issueNumber).sort((left, right) => right - left)).toEqual([1204, 1188, 1142])
  })
})
