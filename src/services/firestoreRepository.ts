import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  documentId,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  startAfter,
  where,
  writeBatch,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { LIMITS } from '../config.ts'
import { resolveEditionBounds } from '../lib/archiveQuery.ts'
import { demoArticles, demoEditions, demoSettings } from '../data/demo.ts'
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from '../data/defaults.ts'
import { getFirebaseAuth, getFirebaseDb } from '../lib/firebase.ts'
import { sanitizeHtml } from '../lib/sanitize.ts'
import { buildKeywords, primarySearchToken, tokenize } from '../lib/text.ts'
import type {
  Article,
  ArticleInput,
  ArticleStatus,
  Category,
  CategoryInput,
  ContactInput,
  ContactMessage,
  DashboardStats,
  Edition,
  HomeStories,
  EditionInput,
  Page,
  PageCursor,
  SettingsInput,
  SiteSettings,
} from '../types.ts'

function asDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate()
  return null
}

function mapArticle(id: string, data: DocumentData): Article {
  const createdAt = asDate(data.createdAt) ?? new Date()
  return {
    id,
    title: String(data.title ?? ''),
    slug: String(data.slug ?? ''),
    summary: String(data.summary ?? ''),
    content: String(data.content ?? ''),
    categoryId: String(data.categoryId ?? ''),
    categorySlug: String(data.categorySlug ?? ''),
    categoryName: String(data.categoryName ?? ''),
    author: String(data.author ?? ''),
    imageUrl: String(data.imageUrl ?? ''),
    seoTitle: String(data.seoTitle ?? ''),
    seoDescription: String(data.seoDescription ?? ''),
    status: data.status === 'published' ? 'published' : 'draft',
    featured: Boolean(data.featured),
    breaking: Boolean(data.breaking),
    isDemo: Boolean(data.isDemo),
    keywords: Array.isArray(data.keywords) ? data.keywords.filter((item) => typeof item === 'string') : [],
    publishedAt: asDate(data.publishedAt),
    createdAt,
    updatedAt: asDate(data.updatedAt) ?? createdAt,
    createdBy: String(data.createdBy ?? ''),
  }
}

function mapEdition(id: string, data: DocumentData): Edition {
  const createdAt = asDate(data.createdAt) ?? new Date()
  return {
    id,
    issueNumber: Number(data.issueNumber ?? 0),
    title: String(data.title ?? ''),
    description: String(data.description ?? ''),
    coverImageUrl: String(data.coverImageUrl ?? ''),
    pdfUrl: String(data.pdfUrl ?? ''),
    status: data.status === 'published' ? 'published' : 'draft',
    isDemo: Boolean(data.isDemo),
    publishedAt: asDate(data.publishedAt),
    createdAt,
    updatedAt: asDate(data.updatedAt) ?? createdAt,
  }
}

function mapCategory(id: string, data: DocumentData): Category {
  return {
    id,
    name: String(data.name ?? ''),
    slug: String(data.slug ?? id),
    description: String(data.description ?? ''),
    order: Number(data.order ?? 0),
    showInNav: Boolean(data.showInNav),
  }
}

function mapSettings(data: DocumentData | undefined): SiteSettings {
  if (!data) return DEFAULT_SETTINGS
  return {
    siteName: String(data.siteName ?? DEFAULT_SETTINGS.siteName),
    tagline: String(data.tagline ?? DEFAULT_SETTINGS.tagline),
    aboutHtml: String(data.aboutHtml ?? DEFAULT_SETTINGS.aboutHtml),
    contactEmail: String(data.contactEmail ?? ''),
    contactPhone: String(data.contactPhone ?? ''),
    contactAddress: String(data.contactAddress ?? ''),
    featuredArticleIds: Array.isArray(data.featuredArticleIds)
      ? data.featuredArticleIds.filter((item) => typeof item === 'string').slice(0, LIMITS.featured)
      : [],
    socialX: String(data.socialX ?? ''),
    socialFacebook: String(data.socialFacebook ?? ''),
    socialInstagram: String(data.socialInstagram ?? ''),
    socialYoutube: String(data.socialYoutube ?? ''),
  }
}

function cursorFrom(snap: QueryDocumentSnapshot | undefined, field: string): PageCursor | null {
  if (!snap) return null
  const value = asDate(snap.get(field))
  if (!value) return null
  return { value: value.toISOString(), id: snap.id }
}

async function readArticlePage(
  constraints: QueryConstraint[],
  pageSize: number,
  orderField: 'publishedAt' | 'updatedAt',
): Promise<Page<Article>> {
  const snapshot = await getDocs(query(collection(getFirebaseDb(), 'articles'), ...constraints, limit(pageSize + 1)))
  const hasMore = snapshot.docs.length > pageSize
  const docs = snapshot.docs.slice(0, pageSize)
  return {
    items: docs.map((item) => mapArticle(item.id, item.data())),
    hasMore,
    nextCursor: hasMore ? cursorFrom(docs[docs.length - 1], orderField) : null,
  }
}

function articleConstraints(options: {
  status?: ArticleStatus
  categorySlug?: string
  breaking?: boolean
  keyword?: string
  orderField: 'publishedAt' | 'updatedAt'
  cursor?: PageCursor | null
}): QueryConstraint[] {
  const constraints: QueryConstraint[] = []
  if (options.status) constraints.push(where('status', '==', options.status))
  if (options.categorySlug) constraints.push(where('categorySlug', '==', options.categorySlug))
  if (options.breaking) constraints.push(where('breaking', '==', true))
  if (options.keyword) constraints.push(where('keywords', 'array-contains', options.keyword))
  constraints.push(orderBy(options.orderField, 'desc'))
  constraints.push(orderBy(documentId(), 'desc'))
  if (options.cursor) {
    constraints.push(startAfter(Timestamp.fromDate(new Date(options.cursor.value)), options.cursor.id))
  }
  return constraints
}

function requireUserId(): string {
  const uid = getFirebaseAuth().currentUser?.uid
  if (!uid) throw new Error('يلزم تسجيل الدخول بحساب إدارة.')
  return uid
}

export async function listCategories(): Promise<Category[]> {
  const snapshot = await getDocs(
    query(collection(getFirebaseDb(), 'categories'), orderBy('order', 'asc'), limit(LIMITS.categories)),
  )
  return snapshot.docs.map((item) => mapCategory(item.id, item.data()))
}

export async function getSettings(): Promise<SiteSettings> {
  const snapshot = await getDoc(doc(getFirebaseDb(), 'settings', 'site'))
  return mapSettings(snapshot.exists() ? snapshot.data() : undefined)
}

export async function listPublishedArticles(options: {
  categorySlug?: string
  cursor?: PageCursor | null
  limit?: number
}): Promise<Page<Article>> {
  return readArticlePage(
    articleConstraints({
      status: 'published',
      categorySlug: options.categorySlug,
      orderField: 'publishedAt',
      cursor: options.cursor,
    }),
    options.limit ?? LIMITS.page,
    'publishedAt',
  )
}

export async function searchPublishedArticles(term: string, cursor?: PageCursor | null): Promise<Page<Article>> {
  const tokens = tokenize(term)
  const primary = primarySearchToken(tokens)
  if (!primary) return { items: [], hasMore: false, nextCursor: null }
  const page = await readArticlePage(
    articleConstraints({
      status: 'published',
      keyword: primary,
      orderField: 'publishedAt',
      cursor,
    }),
    LIMITS.search,
    'publishedAt',
  )
  return {
    ...page,
    items: page.items.filter((article) => tokens.every((token) => article.keywords.includes(token))),
  }
}

export async function getPublishedArticleBySlug(slug: string): Promise<Article | null> {
  const snapshot = await getDocs(
    query(
      collection(getFirebaseDb(), 'articles'),
      where('slug', '==', slug),
      where('status', '==', 'published'),
      limit(1),
    ),
  )
  const first = snapshot.docs[0]
  return first ? mapArticle(first.id, first.data()) : null
}

export async function listRelatedArticles(article: Article): Promise<Article[]> {
  const page = await listPublishedArticles({ categorySlug: article.categorySlug, limit: LIMITS.related + 1 })
  return page.items.filter((item) => item.id !== article.id).slice(0, LIMITS.related)
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
  if (bounds.empty || bounds.searchError) return { items: [], hasMore: false, nextCursor: null }
  const pageSize = options?.limit ?? LIMITS.archive
  const constraints: QueryConstraint[] = [where('status', '==', 'published')]
  if (bounds.issueNumber != null) constraints.push(where('issueNumber', '==', bounds.issueNumber))
  if (bounds.start) constraints.push(where('publishedAt', '>=', Timestamp.fromDate(bounds.start)))
  if (bounds.end) constraints.push(where('publishedAt', '<', Timestamp.fromDate(bounds.end)))
  constraints.push(orderBy('publishedAt', 'desc'), orderBy(documentId(), 'desc'))
  if (options?.cursor) {
    constraints.push(startAfter(Timestamp.fromDate(new Date(options.cursor.value)), options.cursor.id))
  }
  const snapshot = await getDocs(query(collection(getFirebaseDb(), 'editions'), ...constraints, limit(pageSize + 1)))
  const hasMore = snapshot.docs.length > pageSize
  const docs = snapshot.docs.slice(0, pageSize)
  return {
    items: docs.map((item) => mapEdition(item.id, item.data())),
    hasMore,
    nextCursor: hasMore ? cursorFrom(docs[docs.length - 1], 'publishedAt') : null,
  }
}

export async function getPublishedEdition(id: string): Promise<Edition | null> {
  try {
    const snapshot = await getDoc(doc(getFirebaseDb(), 'editions', id))
    if (!snapshot.exists()) return null
    const edition = mapEdition(snapshot.id, snapshot.data())
    return edition.status === 'published' ? edition : null
  } catch (error) {
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
    if (code === 'permission-denied') return null
    throw error
  }
}

async function getPublishedById(id: string): Promise<Article | null> {
  try {
    const snapshot = await getDoc(doc(getFirebaseDb(), 'articles', id))
    if (!snapshot.exists()) return null
    const article = mapArticle(snapshot.id, snapshot.data())
    return article.status === 'published' ? article : null
  } catch {
    return null
  }
}

export async function getHomeStories(featuredIds: string[]): Promise<HomeStories> {
  const db = getFirebaseDb()
  const [latestPage, breakingSnapshot, editionPage, featured] = await Promise.all([
    listPublishedArticles({ limit: LIMITS.homeLatest }),
    getDocs(
      query(
        collection(db, 'articles'),
        where('status', '==', 'published'),
        where('breaking', '==', true),
        orderBy('publishedAt', 'desc'),
        limit(LIMITS.homeBreaking),
      ),
    ),
    listPublishedEditions({ limit: LIMITS.homeEditions }),
    Promise.all(featuredIds.slice(0, LIMITS.featured).map((id) => getPublishedById(id))),
  ])

  const picked = featured.filter((article): article is Article => Boolean(article))
  const latest = latestPage.items
  const main = picked[0] ?? latest[0] ?? null
  const used = new Set(main ? [main.id] : [])
  const side: Article[] = []
  for (const article of [...picked.slice(1), ...latest]) {
    if (used.has(article.id)) continue
    side.push(article)
    used.add(article.id)
    if (side.length === 3) break
  }

  return {
    featured: main,
    side,
    latest: latest.filter((article) => article.id !== main?.id).slice(0, 6),
    breaking: breakingSnapshot.docs.map((item) => mapArticle(item.id, item.data())),
    editions: editionPage.items,
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const db = getFirebaseDb()
  const [articles, published, drafts, editions] = await Promise.all([
    getCountFromServer(query(collection(db, 'articles'))),
    getCountFromServer(query(collection(db, 'articles'), where('status', '==', 'published'))),
    getCountFromServer(query(collection(db, 'articles'), where('status', '==', 'draft'))),
    getCountFromServer(query(collection(db, 'editions'))),
  ])
  return {
    articles: articles.data().count,
    published: published.data().count,
    drafts: drafts.data().count,
    editions: editions.data().count,
  }
}

function featuredIdsFrom(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string').slice(0, LIMITS.featured)
}

export async function listAdminArticles(options: {
  status?: ArticleStatus | 'all'
  search?: string
  cursor?: PageCursor | null
}): Promise<Page<Article>> {
  const status = options.status && options.status !== 'all' ? options.status : undefined
  const tokens = tokenize(options.search ?? '')
  const primary = primarySearchToken(tokens)
  if ((options.search ?? '').trim() && !primary) return { items: [], hasMore: false, nextCursor: null }
  const page = await readArticlePage(
    articleConstraints({
      status,
      keyword: primary ?? undefined,
      orderField: 'updatedAt',
      cursor: options.cursor,
    }),
    LIMITS.adminPage,
    'updatedAt',
  )
  if (!primary) return page
  return {
    ...page,
    items: page.items.filter((article) => tokens.every((token) => article.keywords.includes(token))),
  }
}

export async function listPickerArticles(): Promise<Article[]> {
  const page = await listPublishedArticles({ limit: LIMITS.picker })
  return page.items
}

export async function getArticle(id: string): Promise<Article | null> {
  const snapshot = await getDoc(doc(getFirebaseDb(), 'articles', id))
  return snapshot.exists() ? mapArticle(snapshot.id, snapshot.data()) : null
}

export async function saveArticle(id: string | null, input: ArticleInput): Promise<string> {
  const db = getFirebaseDb()
  const uid = requireUserId()
  const categorySnapshot = await getDoc(doc(db, 'categories', input.categoryId))
  if (!categorySnapshot.exists()) throw new Error('القسم المحدد غير موجود.')
  const categoryName = String(categorySnapshot.data().name ?? '')
  const categorySlug = String(categorySnapshot.data().slug ?? '')
  if (categorySlug !== input.categoryId) throw new Error('معرّف القسم غير صالح.')

  const articleId = id ?? doc(collection(db, 'articles')).id
  const articleRef = doc(db, 'articles', articleId)
  const publishedAt = input.publishedAt ? Timestamp.fromDate(new Date(input.publishedAt)) : null

  await runTransaction(db, async (transaction) => {
    const current = await transaction.get(articleRef)
    const slugRef = doc(db, 'slugs', input.slug)
    const slugSnapshot = await transaction.get(slugRef)
    if (slugSnapshot.exists() && slugSnapshot.data().articleId !== articleId) {
      throw new Error('هذا المعرّف مستخدم لخبر آخر. اختاروا معرفاً مختلفاً.')
    }
    const settingsRef = doc(db, 'settings', 'site')
    const settingsSnap = await transaction.get(settingsRef)
    const previousSlug = current.exists() ? String(current.data().slug ?? '') : ''
    if (previousSlug && previousSlug !== input.slug) {
      transaction.delete(doc(db, 'slugs', previousSlug))
    }
    const featuredIds = featuredIdsFrom(settingsSnap.data()?.featuredArticleIds)
    const onHomepage = input.featured && input.status === 'published'
    let nextFeatured: string[] | null = null
    if (onHomepage && !featuredIds.includes(articleId)) {
      if (!settingsSnap.exists()) {
        throw new Error('احفظوا إعدادات الموقع أولاً، ثم ثبّتوا المقال في الصفحة الرئيسية.')
      }
      if (featuredIds.length >= LIMITS.featured) {
        throw new Error(`يمكن تثبيت ${LIMITS.featured} مقالات في الصفحة الرئيسية. أزيلوا واحدة من إعدادات الموقع.`)
      }
      nextFeatured = [...featuredIds, articleId]
    } else if (!onHomepage && featuredIds.includes(articleId)) {
      nextFeatured = featuredIds.filter((item) => item !== articleId)
    }
    transaction.set(slugRef, { articleId })
    transaction.set(articleRef, {
      title: input.title.trim(),
      slug: input.slug.trim(),
      summary: input.summary.trim(),
      content: sanitizeHtml(input.content),
      categoryId: input.categoryId,
      categorySlug,
      categoryName,
      author: input.author.trim(),
      imageUrl: input.imageUrl.trim(),
      seoTitle: input.seoTitle.trim(),
      seoDescription: input.seoDescription.trim(),
      status: input.status,
      featured: input.featured,
      breaking: input.breaking,
      isDemo: current.exists() ? Boolean(current.data().isDemo) : false,
      keywords: buildKeywords(input.title, input.summary, categoryName, input.author),
      publishedAt,
      createdAt: current.exists() ? current.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: current.exists() ? current.data().createdBy : uid,
    })
    if (nextFeatured) {
      transaction.update(settingsRef, {
        featuredArticleIds: nextFeatured,
        updatedAt: serverTimestamp(),
      })
    }
  })

  return articleId
}

export async function deleteArticle(id: string): Promise<void> {
  const db = getFirebaseDb()
  requireUserId()
  await runTransaction(db, async (transaction) => {
    const articleRef = doc(db, 'articles', id)
    const settingsRef = doc(db, 'settings', 'site')
    const current = await transaction.get(articleRef)
    const settingsSnap = await transaction.get(settingsRef)
    if (!current.exists()) return
    const slug = String(current.data().slug ?? '')
    const featuredIds = featuredIdsFrom(settingsSnap.data()?.featuredArticleIds)
    if (slug) transaction.delete(doc(db, 'slugs', slug))
    transaction.delete(articleRef)
    if (settingsSnap.exists() && featuredIds.includes(id)) {
      transaction.update(settingsRef, {
        featuredArticleIds: featuredIds.filter((item) => item !== id),
        updatedAt: serverTimestamp(),
      })
    }
  })
}

export async function listAdminEditions(options?: {
  status?: ArticleStatus | 'all'
  cursor?: PageCursor | null
}): Promise<Page<Edition>> {
  const pageSize = LIMITS.adminPage
  const status = options?.status && options.status !== 'all' ? options.status : undefined
  const constraints: QueryConstraint[] = []
  if (status) constraints.push(where('status', '==', status))
  constraints.push(orderBy('publishedAt', 'desc'), orderBy(documentId(), 'desc'))
  if (options?.cursor) constraints.push(startAfter(Timestamp.fromDate(new Date(options.cursor.value)), options.cursor.id))
  const snapshot = await getDocs(query(collection(getFirebaseDb(), 'editions'), ...constraints, limit(pageSize + 1)))
  const hasMore = snapshot.docs.length > pageSize
  const docs = snapshot.docs.slice(0, pageSize)
  return {
    items: docs.map((item) => mapEdition(item.id, item.data())),
    hasMore,
    nextCursor: hasMore ? cursorFrom(docs[docs.length - 1], 'publishedAt') : null,
  }
}

export async function getEdition(id: string): Promise<Edition | null> {
  const snapshot = await getDoc(doc(getFirebaseDb(), 'editions', id))
  return snapshot.exists() ? mapEdition(snapshot.id, snapshot.data()) : null
}

export async function saveEdition(id: string | null, input: EditionInput): Promise<string> {
  const db = getFirebaseDb()
  requireUserId()
  const editionId = id ?? doc(collection(db, 'editions')).id
  const editionRef = doc(db, 'editions', editionId)
  await runTransaction(db, async (transaction) => {
    const current = await transaction.get(editionRef)
    transaction.set(editionRef, {
      issueNumber: Number(input.issueNumber),
      title: input.title.trim(),
      description: input.description.trim(),
      coverImageUrl: input.coverImageUrl.trim(),
      pdfUrl: input.pdfUrl.trim(),
      status: input.status,
      isDemo: current.exists() ? Boolean(current.data().isDemo) : false,
      publishedAt: input.publishedAt ? Timestamp.fromDate(new Date(input.publishedAt)) : null,
      createdAt: current.exists() ? current.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  })
  return editionId
}

export async function deleteEdition(id: string): Promise<void> {
  requireUserId()
  await deleteDoc(doc(getFirebaseDb(), 'editions', id))
}

export async function saveCategory(id: string | null, input: CategoryInput): Promise<string> {
  const db = getFirebaseDb()
  requireUserId()
  const slug = (id ?? input.slug).trim()
  const ref = doc(db, 'categories', slug)
  const current = await getDoc(ref)
  if (!id && current.exists()) throw new Error('معرّف القسم مستخدم.')
  await setDoc(ref, {
    name: input.name.trim(),
    slug,
    description: input.description.trim(),
    order: Number(input.order),
    showInNav: input.showInNav,
  })
  return slug
}

export async function deleteCategory(id: string): Promise<void> {
  requireUserId()
  await deleteDoc(doc(getFirebaseDb(), 'categories', id))
}

export async function saveSettings(input: SettingsInput): Promise<void> {
  requireUserId()
  await setDoc(doc(getFirebaseDb(), 'settings', 'site'), {
    siteName: input.siteName.trim(),
    tagline: input.tagline.trim(),
    aboutHtml: sanitizeHtml(input.aboutHtml),
    contactEmail: input.contactEmail.trim(),
    contactPhone: input.contactPhone.trim(),
    contactAddress: input.contactAddress.trim(),
    featuredArticleIds: input.featuredArticleIds.slice(0, LIMITS.featured),
    socialX: input.socialX.trim(),
    socialFacebook: input.socialFacebook.trim(),
    socialInstagram: input.socialInstagram.trim(),
    socialYoutube: input.socialYoutube.trim(),
    updatedAt: serverTimestamp(),
  })
}

export async function submitMessage(input: ContactInput): Promise<void> {
  await addDoc(collection(getFirebaseDb(), 'messages'), {
    name: input.name.trim(),
    email: input.email.trim(),
    message: input.message.trim(),
    fax: '',
    createdAt: serverTimestamp(),
  })
}

export async function listMessages(): Promise<ContactMessage[]> {
  const snapshot = await getDocs(
    query(collection(getFirebaseDb(), 'messages'), orderBy('createdAt', 'desc'), limit(LIMITS.messages)),
  )
  return snapshot.docs.map((item) => ({
    id: item.id,
    name: String(item.data().name ?? ''),
    email: String(item.data().email ?? ''),
    message: String(item.data().message ?? ''),
    createdAt: asDate(item.data().createdAt) ?? new Date(),
  }))
}

export async function deleteMessage(id: string): Promise<void> {
  requireUserId()
  await deleteDoc(doc(getFirebaseDb(), 'messages', id))
}

export async function importDemoContent(): Promise<void> {
  const db = getFirebaseDb()
  const uid = requireUserId()
  const categoryBatch = writeBatch(db)
  for (const category of DEFAULT_CATEGORIES) {
    categoryBatch.set(doc(db, 'categories', category.id), {
      name: category.name,
      slug: category.slug,
      description: category.description,
      order: category.order,
      showInNav: category.showInNav,
    })
  }
  await categoryBatch.commit()

  const batch = writeBatch(db)
  const existingArticles = await Promise.all(demoArticles.map((article) => getDoc(doc(db, 'articles', article.id))))
  demoArticles.forEach((article, index) => {
    const current = existingArticles[index]
    batch.set(doc(db, 'articles', article.id), {
      title: article.title,
      slug: article.slug,
      summary: article.summary,
      content: article.content,
      categoryId: article.categoryId,
      categorySlug: article.categorySlug,
      categoryName: article.categoryName,
      author: article.author,
      imageUrl: article.imageUrl,
      seoTitle: article.seoTitle,
      seoDescription: article.seoDescription,
      status: article.status,
      featured: article.featured,
      breaking: article.breaking,
      isDemo: true,
      keywords: article.keywords,
      publishedAt: article.publishedAt ? Timestamp.fromDate(article.publishedAt) : null,
      createdAt: current?.exists() ? current.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: current?.exists() ? current.data().createdBy : uid,
    })
    batch.set(doc(db, 'slugs', article.slug), { articleId: article.id })
  })

  const existingEditions = await Promise.all(demoEditions.map((edition) => getDoc(doc(db, 'editions', edition.id))))
  demoEditions.forEach((edition, index) => {
    const current = existingEditions[index]
    batch.set(doc(db, 'editions', edition.id), {
      issueNumber: edition.issueNumber,
      title: edition.title,
      description: edition.description,
      coverImageUrl: edition.coverImageUrl,
      pdfUrl: edition.pdfUrl,
      status: edition.status,
      isDemo: true,
      publishedAt: edition.publishedAt ? Timestamp.fromDate(edition.publishedAt) : null,
      createdAt: current?.exists() ? current.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  })

  batch.set(doc(db, 'settings', 'site'), {
    ...demoSettings,
    updatedAt: serverTimestamp(),
  })

  await batch.commit()
}
