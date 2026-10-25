export type ArticleStatus = 'draft' | 'published'

export interface Category {
  id: string
  name: string
  slug: string
  description: string
  order: number
  showInNav: boolean
}

export interface Article {
  id: string
  title: string
  slug: string
  summary: string
  content: string
  categoryId: string
  categorySlug: string
  categoryName: string
  author: string
  imageUrl: string
  seoTitle: string
  seoDescription: string
  status: ArticleStatus
  featured: boolean
  breaking: boolean
  isDemo: boolean
  keywords: string[]
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface Edition {
  id: string
  issueNumber: number
  title: string
  description: string
  coverImageUrl: string
  pdfUrl: string
  status: ArticleStatus
  isDemo: boolean
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface SiteSettings {
  siteName: string
  tagline: string
  aboutHtml: string
  contactEmail: string
  contactPhone: string
  contactAddress: string
  featuredArticleIds: string[]
  socialX: string
  socialFacebook: string
  socialInstagram: string
  socialYoutube: string
}

export interface ContactMessage {
  id: string
  name: string
  email: string
  message: string
  createdAt: Date
}

export interface PageCursor {
  value: string
  id: string
}

export interface Page<T> {
  items: T[]
  hasMore: boolean
  nextCursor: PageCursor | null
}

export interface HomeStories {
  featured: Article | null
  side: Article[]
  latest: Article[]
  breaking: Article[]
  editions: Edition[]
}

export interface DashboardStats {
  articles: number
  published: number
  drafts: number
  editions: number
}

export interface ArticleInput {
  title: string
  slug: string
  summary: string
  content: string
  categoryId: string
  author: string
  imageUrl: string
  seoTitle: string
  seoDescription: string
  publishedAt: string
  status: ArticleStatus
  featured: boolean
  breaking: boolean
}

export interface EditionInput {
  issueNumber: string
  title: string
  description: string
  coverImageUrl: string
  pdfUrl: string
  publishedAt: string
  status: ArticleStatus
}

export interface CategoryInput {
  name: string
  slug: string
  description: string
  order: string
  showInNav: boolean
}

export interface ContactInput {
  name: string
  email: string
  message: string
  fax: string
}

export interface SettingsInput {
  siteName: string
  tagline: string
  aboutHtml: string
  contactEmail: string
  contactPhone: string
  contactAddress: string
  featuredArticleIds: string[]
  socialX: string
  socialFacebook: string
  socialInstagram: string
  socialYoutube: string
}
