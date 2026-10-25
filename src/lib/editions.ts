import { toDateTimeLocal } from './dates.ts'
import type { ArticleStatus, Edition, EditionInput } from '../types.ts'

export function toEditionInput(edition: Edition, status: ArticleStatus = edition.status): EditionInput {
  return {
    issueNumber: String(edition.issueNumber),
    title: edition.title,
    description: edition.description,
    coverImageUrl: edition.coverImageUrl,
    pdfUrl: edition.pdfUrl,
    publishedAt: toDateTimeLocal(edition.publishedAt),
    status,
  }
}
