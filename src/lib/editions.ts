import { toDateTimeLocal } from './dates.ts'
import type { ArticleStatus, Edition, EditionInput } from '../types.ts'

export function toEditionInput(edition: Edition, status: ArticleStatus = edition.status): EditionInput {
  return {
    issueNumber: String(edition.issueNumber),
    title: edition.title,
    description: edition.description,
    coverImageUrl: edition.coverImageUrl,
    coverPublicId: edition.coverPublicId,
    pdfUrl: edition.pdfUrl,
    pdfPublicId: edition.pdfPublicId,
    publishedAt: toDateTimeLocal(edition.publishedAt),
    status,
  }
}
