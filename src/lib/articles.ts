import type { Article, ArticleInput } from '../types.ts'
import { toDateTimeLocal } from './dates.ts'

export function toArticleInput(article: Article): ArticleInput {
  return {
    title: article.title,
    slug: article.slug,
    summary: article.summary,
    content: article.content,
    categoryId: article.categoryId,
    author: article.author,
    imageUrl: article.imageUrl,
    seoTitle: article.seoTitle,
    seoDescription: article.seoDescription,
    publishedAt: article.publishedAt ? toDateTimeLocal(article.publishedAt) : '',
    status: article.status,
    featured: article.featured,
    breaking: article.breaking,
  }
}
