export function visibleNavCount(widths: number[], available: number, moreWidth: number): number {
  if (widths.length === 0 || available <= 0) return 0
  const total = widths.reduce((sum, width) => sum + width, 0)
  if (total <= available) return widths.length
  let used = moreWidth
  let count = 0
  for (const width of widths) {
    if (used + width > available) break
    used += width
    count += 1
  }
  return count
}
