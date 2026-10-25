import { LIMITS } from '../config.ts'
import { demoArticles, demoEditions, demoSettings, publishedArticles, publishedEditions } from '../data/demo.ts'
import { DEFAULT_CATEGORIES } from '../data/defaults.ts'
import { editionWithinBounds, resolveEditionBounds } from '../lib/archiveQuery.ts'
import { paginateItems } from '../lib/pagination.ts'
import { primarySearchToken, tokenize } from '../lib/text.ts'
import type {
  Article,
  Category,
  DashboardStats,
  Edition,
  HomeStories,
  Page,
  PageCursor,
  SiteSettings,
} from '../types.ts'

function emptyPage<T>(): Page<T> {
  return { items: [], hasMore: false, nextCursor: null }
}

function pageArticles(
  items: Article[],
  pageSize: number,
  cursor: PageCursor | null,
  field: 'publishedAt' | 'updatedAt',
): Page<Article> {
  return paginateItems(
    items,
    pageSize,
    cursor,
    (item) => (field === 'publishedAt' ? item.publishedAt : item.updatedAt),
    (item) => item.id,
  )
}

export async function listCategories(): Promise<Category[]> {
  return DEFAULT_CATEGORIES
}

export async function getSettings(): Promise<SiteSettings> {
  return demoSettings
}

export async function listPublishedArticles(options: {
  categorySlug?: string
  cursor?: PageCursor | null
  limit?: number
}): Promise<Page<Article>> {
  const items = publishedArticles().filter((article) =>
    options.categorySlug ? article.categorySlug === options.categorySlug : true,
  )
  return pageArticles(items, options.limit ?? LIMITS.page, options.cursor ?? null, 'publishedAt')
}

export async function searchPublishedArticles(term: string, cursor?: PageCursor | null): Promise<Page<Article>> {
  const tokens = tokenize(term)
  if (!primarySearchToken(tokens)) return emptyPage()
  const matched = publishedArticles().filter((article) => tokens.every((token) => article.keywords.includes(token)))
  return pageArticles(matched, LIMITS.search, cursor ?? null, 'publishedAt')
}

export async function getPublishedArticleBySlug(slug: string): Promise<Article | null> {
  return publishedArticles().find((article) => article.slug === slug) ?? null
}

export async function listRelatedArticles(article: Article): Promise<Article[]> {
  return publishedArticles()
    .filter((item) => item.categorySlug === article.categorySlug && item.id !== article.id)
    .sort((left, right) => (right.publishedAt?.getTime() ?? 0) - (left.publishedAt?.getTime() ?? 0))
    .slice(0, LIMITS.related)
}

export async function listPublishedEditions(options?: {
  cursor?: PageCursor | null
  limit?: number
  year?: number | null
  month?: number | null
  search?: string
}): Promise<Page<Edition>> {
  const bounds = resolveEditionBounds({
    year: options?.year,
    month: options?.month,
    search: options?.search,
  })
  if (bounds.empty || bounds.searchError) return emptyPage()
  const items = publishedEditions().filter((edition) => editionWithinBounds(edition, bounds))
  return paginateItems(
    items,
    options?.limit ?? LIMITS.archive,
    options?.cursor ?? null,
    (item) => item.publishedAt,
    (item) => item.id,
  )
}

export async function getPublishedEdition(id: string): Promise<Edition | null> {
  return publishedEditions().find((edition) => edition.id === id) ?? null
}

export async function getHomeStories(featuredIds: string[]): Promise<HomeStories> {
  const latest = publishedArticles()
    .slice()
    .sort((left, right) => (right.publishedAt?.getTime() ?? 0) - (left.publishedAt?.getTime() ?? 0))
  const featured = featuredIds
    .map((id) => latest.find((article) => article.id === id))
    .filter((article): article is Article => Boolean(article))
  const main = featured[0] ?? latest[0] ?? null
  const used = new Set(main ? [main.id] : [])
  const side: Article[] = []
  for (const article of [...featured.slice(1), ...latest]) {
    if (used.has(article.id)) continue
    side.push(article)
    used.add(article.id)
    if (side.length === 3) break
  }
  return {
    featured: main,
    side,
    latest: latest.filter((article) => article.id !== main?.id).slice(0, 6),
    breaking: latest.filter((article) => article.breaking).slice(0, LIMITS.homeBreaking),
    editions: publishedEditions()
      .slice()
      .sort((left, right) => (right.publishedAt?.getTime() ?? 0) - (left.publishedAt?.getTime() ?? 0))
      .slice(0, LIMITS.homeEditions),
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return {
    articles: demoArticles.length,
    published: demoArticles.filter((article) => article.status === 'published').length,
    drafts: demoArticles.filter((article) => article.status === 'draft').length,
    editions: demoEditions.length,
  }
}

export async function listAdminArticles(options: {
  status?: 'draft' | 'published' | 'all'
  cursor?: PageCursor | null
}): Promise<Page<Article>> {
  const status = options.status ?? 'all'
  const items = demoArticles.filter((article) => (status === 'all' ? true : article.status === status))
  return pageArticles(items, LIMITS.adminPage, options.cursor ?? null, 'updatedAt')
}
