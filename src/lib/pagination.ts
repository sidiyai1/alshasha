import type { Page, PageCursor } from '../types.ts'

export function paginateItems<T>(
  items: T[],
  pageSize: number,
  cursor: PageCursor | null,
  sortAt: (item: T) => Date | null,
  idOf: (item: T) => string,
): Page<T> {
  const sorted = [...items].sort((left, right) => {
    const leftTime = sortAt(left)?.getTime() ?? 0
    const rightTime = sortAt(right)?.getTime() ?? 0
    if (rightTime !== leftTime) return rightTime - leftTime
    const leftId = idOf(left)
    const rightId = idOf(right)
    if (leftId === rightId) return 0
    return leftId < rightId ? 1 : -1
  })

  let start = 0
  if (cursor) {
    const index = sorted.findIndex((item) => idOf(item) === cursor.id)
    start = index >= 0 ? index + 1 : 0
  }

  const window = sorted.slice(start, start + pageSize + 1)
  const hasMore = window.length > pageSize
  const pageItems = hasMore ? window.slice(0, pageSize) : window
  const last = pageItems[pageItems.length - 1]
  const nextCursor =
    hasMore && last && sortAt(last) ? { value: sortAt(last)!.toISOString(), id: idOf(last) } : null

  return { items: pageItems, hasMore, nextCursor }
}
