import { isFirebaseConfigured } from '../lib/firebase.ts'
import * as demo from './demoRepository.ts'
import * as remote from './firestoreRepository.ts'
import type {
  Article,
  ArticleInput,
  ArticleStatus,
  CategoryInput,
  ContactInput,
  EditionInput,
  PageCursor,
  SettingsInput,
} from '../types.ts'

export function usingDemoData(): boolean {
  return !isFirebaseConfigured
}

function requireRemote(): void {
  if (!isFirebaseConfigured) {
    throw new Error('الحفظ يحتاج ربط Firebase. اتبعوا دليل الإعداد، ثم سجّلوا الدخول من حساب إدارة مضاف يدوياً.')
  }
}

export function listCategories() {
  return isFirebaseConfigured ? remote.listCategories() : demo.listCategories()
}

export function getSettings() {
  return isFirebaseConfigured ? remote.getSettings() : demo.getSettings()
}

export function listPublishedArticles(options: {
  categorySlug?: string
  cursor?: PageCursor | null
  limit?: number
}) {
  return isFirebaseConfigured ? remote.listPublishedArticles(options) : demo.listPublishedArticles(options)
}

export function searchPublishedArticles(term: string, cursor?: PageCursor | null) {
  return isFirebaseConfigured ? remote.searchPublishedArticles(term, cursor) : demo.searchPublishedArticles(term, cursor)
}

export function getPublishedArticleBySlug(slug: string) {
  return isFirebaseConfigured ? remote.getPublishedArticleBySlug(slug) : demo.getPublishedArticleBySlug(slug)
}

export function listRelatedArticles(article: Article) {
  return isFirebaseConfigured ? remote.listRelatedArticles(article) : demo.listRelatedArticles(article)
}

export function listPublishedEditions(options?: {
  cursor?: PageCursor | null
  limit?: number
  year?: number | null
  month?: number | null
  search?: string
}) {
  return isFirebaseConfigured ? remote.listPublishedEditions(options) : demo.listPublishedEditions(options)
}

export function getPublishedEdition(id: string) {
  return isFirebaseConfigured ? remote.getPublishedEdition(id) : demo.getPublishedEdition(id)
}

export function getHomeStories(featuredIds: string[]) {
  return isFirebaseConfigured ? remote.getHomeStories(featuredIds) : demo.getHomeStories(featuredIds)
}

export function getDashboardStats() {
  requireRemote()
  return remote.getDashboardStats()
}

export function listAdminArticles(options: { status?: ArticleStatus | 'all'; search?: string; cursor?: PageCursor | null }) {
  requireRemote()
  return remote.listAdminArticles(options)
}

export function listPickerArticles() {
  requireRemote()
  return remote.listPickerArticles()
}

export function getArticle(id: string) {
  requireRemote()
  return remote.getArticle(id)
}

export function saveArticle(id: string | null, input: ArticleInput) {
  requireRemote()
  return remote.saveArticle(id, input)
}

export function deleteArticle(id: string) {
  requireRemote()
  return remote.deleteArticle(id)
}

export function listAdminEditions(options?: { status?: ArticleStatus | 'all'; cursor?: PageCursor | null }) {
  requireRemote()
  return remote.listAdminEditions(options)
}

export function getEdition(id: string) {
  requireRemote()
  return remote.getEdition(id)
}

export function saveEdition(id: string | null, input: EditionInput) {
  requireRemote()
  return remote.saveEdition(id, input)
}

export function deleteEdition(id: string) {
  requireRemote()
  return remote.deleteEdition(id)
}

export function saveCategory(id: string | null, input: CategoryInput) {
  requireRemote()
  return remote.saveCategory(id, input)
}

export function deleteCategory(id: string) {
  requireRemote()
  return remote.deleteCategory(id)
}

export function saveSettings(input: SettingsInput) {
  requireRemote()
  return remote.saveSettings(input)
}

export function submitMessage(input: ContactInput) {
  requireRemote()
  return remote.submitMessage(input)
}

export function listMessages() {
  requireRemote()
  return remote.listMessages()
}

export function deleteMessage(id: string) {
  requireRemote()
  return remote.deleteMessage(id)
}

export function importDemoContent() {
  requireRemote()
  return remote.importDemoContent()
}
