import type { Article, ArticleInput } from '../types.ts'
import { toDateTimeLocal } from './dates.ts'

/** Keep a category only when its value is a loaded Firestore document id. */
export function resolveCategorySelection(categoryId: string, categories: { id: string }[], isNew: boolean): string {
  if (categories.some((category) => category.id === categoryId)) return categoryId
  if (isNew && categories.length > 0) return categories[0].id
  return ''
}

export function toArticleInput(article: Article): ArticleInput {
  return {
    title: article.title,
    slug: article.slug,
    summary: article.summary,
    content: article.content,
    categoryId: article.categoryId,
    author: article.author,
    imageUrl: article.imageUrl,
    imagePublicId: article.imagePublicId,
    seoTitle: article.seoTitle,
    seoDescription: article.seoDescription,
    publishedAt: article.publishedAt ? toDateTimeLocal(article.publishedAt) : '',
    status: article.status,
    featured: article.featured,
    breaking: article.breaking,
  }
}
