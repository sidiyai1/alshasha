import { LIMITS } from '../config.ts'
import { sanitizeHtml } from './sanitize.ts'
import { plainTextFromHtml } from './text.ts'
import type { ArticleInput, CategoryInput, ContactInput, EditionInput, SettingsInput } from '../types.ts'

const HTTPS_URL = /^https:\/\/[^\s<>"']+$/i
const RELATIVE_URL = /^\/[A-Za-z0-9][A-Za-z0-9._~/-]*$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CATEGORY_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const ARTICLE_SLUG = /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u

export function isSafeMediaUrl(value: string): boolean {
  if (!value || value.length > 2000 || value.includes('..')) return false
  return HTTPS_URL.test(value) || RELATIVE_URL.test(value)
}

export function validateArticle(input: ArticleInput): Record<string, string> {
  const errors: Record<string, string> = {}
  const title = input.title.trim()
  const slug = input.slug.trim()
  const summary = input.summary.trim()
  const author = input.author.trim()
  const contentText = plainTextFromHtml(sanitizeHtml(input.content))

  if (title.length < 8 || title.length > 180) {
    errors.title = 'العنوان يجب أن يكون بين 8 و180 حرفاً.'
  }
  if (!ARTICLE_SLUG.test(slug) || slug.length > 80) {
    errors.slug = 'المعرّف يتكون من كلمات عربية أو لاتينية مفصولة بشرطة.'
  }
  if (!input.categoryId) errors.categoryId = 'اختاروا القسم.'
  if (author.length < 2 || author.length > 80) errors.author = 'أدخلوا اسم الكاتب أو القسم.'
  if (input.imageUrl.trim() && !isSafeMediaUrl(input.imageUrl.trim())) {
    errors.imageUrl = 'رابط الصورة يجب أن يبدأ بـ https:// أو يكون مساراً داخلياً آمناً.'
  }
  if (input.seoTitle.trim().length > 70) errors.seoTitle = 'عنوان محركات البحث يجب ألا يتجاوز 70 حرفاً.'
  if (input.seoDescription.trim().length > 160) errors.seoDescription = 'وصف محركات البحث يجب ألا يتجاوز 160 حرفاً.'

  if (input.status === 'published') {
    if (summary.length < 20 || summary.length > 400) {
      errors.summary = 'الموجز المنشور يكون بين 20 و400 حرف.'
    }
    if (contentText.length < 40) errors.content = 'نص الخبر أقصر من المطلوب للنشر.'
    if (sanitizeHtml(input.content).length > 100000) errors.content = 'نص الخبر طويل جداً.'
    if (!input.publishedAt || Number.isNaN(new Date(input.publishedAt).getTime())) {
      errors.publishedAt = 'حددوا تاريخ النشر.'
    }
  } else if (summary.length > 400) {
    errors.summary = 'الموجز أطول من 400 حرف.'
  }

  return errors
}

export function validateEdition(input: EditionInput): Record<string, string> {
  const errors: Record<string, string> = {}
  const issueNumber = Number(input.issueNumber)
  if (!Number.isInteger(issueNumber) || issueNumber < 1 || issueNumber > 100000) {
    errors.issueNumber = 'رقم العدد يجب أن يكون رقماً صحيحاً.'
  }
  if (input.title.trim().length < 3 || input.title.trim().length > 120) {
    errors.title = 'أدخلوا عنوان العدد.'
  }
  if (input.description.trim().length > 500) errors.description = 'الوصف أطول من المسموح.'
  if (input.coverImageUrl.trim() && !isSafeMediaUrl(input.coverImageUrl.trim())) {
    errors.coverImageUrl = 'رابط الغلاف غير صالح.'
  }
  if (input.pdfUrl.trim() && !isSafeMediaUrl(input.pdfUrl.trim())) {
    errors.pdfUrl = 'رابط ملف PDF غير صالح.'
  }
  if (input.status === 'published') {
    if (!input.coverImageUrl.trim()) errors.coverImageUrl = 'أدخلوا رابط غلاف العدد.'
    if (!input.pdfUrl.trim()) errors.pdfUrl = 'أدخلوا رابط ملف PDF.'
    if (!input.publishedAt || Number.isNaN(new Date(input.publishedAt).getTime())) {
      errors.publishedAt = 'حددوا تاريخ العدد.'
    }
    if (input.description.trim().length < 10) errors.description = 'أضيفوا وصفاً قصيراً للعدد.'
  }
  return errors
}

export function validateCategory(input: CategoryInput, isNew: boolean): Record<string, string> {
  const errors: Record<string, string> = {}
  if (input.name.trim().length < 2 || input.name.trim().length > 40) {
    errors.name = 'اسم القسم بين 2 و40 حرفاً.'
  }
  if (isNew && !CATEGORY_SLUG.test(input.slug.trim())) {
    errors.slug = 'المعرّف لاتيني بحروف صغيرة، مثل siyasa.'
  }
  if (input.description.trim().length > 300) errors.description = 'الوصف أطول من المسموح.'
  const order = Number(input.order)
  if (!Number.isInteger(order) || order < 0 || order > 100) {
    errors.order = 'الترتيب رقم بين 0 و100.'
  }
  return errors
}

export function validateContact(input: ContactInput): Record<string, string> {
  const errors: Record<string, string> = {}
  if (input.fax.trim()) errors.form = 'تعذر إرسال الرسالة.'
  if (input.name.trim().length < 2 || input.name.trim().length > 80) errors.name = 'أدخلوا الاسم.'
  if (!EMAIL.test(input.email.trim()) || input.email.trim().length > 120) {
    errors.email = 'البريد الإلكتروني غير صالح.'
  }
  if (input.message.trim().length < 10 || input.message.trim().length > 2000) {
    errors.message = 'الرسالة بين 10 و2000 حرف.'
  }
  return errors
}

export function validateSettings(input: SettingsInput): Record<string, string> {
  const errors: Record<string, string> = {}
  if (input.siteName.trim().length < 2 || input.siteName.trim().length > 60) {
    errors.siteName = 'اسم الموقع مطلوب.'
  }
  if (input.tagline.trim().length > 80) errors.tagline = 'الشعار النصي طويل.'
  if (sanitizeHtml(input.aboutHtml).length > 50000) errors.aboutHtml = 'نص التعريف طويل جداً.'
  if (input.contactEmail.trim() && !EMAIL.test(input.contactEmail.trim())) {
    errors.contactEmail = 'البريد الإلكتروني غير صالح.'
  }
  if (input.contactPhone.trim().length > 40) errors.contactPhone = 'رقم الهاتف طويل.'
  if (input.contactAddress.trim().length > 200) errors.contactAddress = 'العنوان طويل.'
  if (input.featuredArticleIds.length > LIMITS.featured) {
    errors.featuredArticleIds = `يمكن تثبيت ${LIMITS.featured} أخبار كحد أقصى.`
  }
  for (const key of ['socialX', 'socialFacebook', 'socialInstagram', 'socialYoutube'] as const) {
    const value = input[key].trim()
    if (value && !HTTPS_URL.test(value)) errors[key] = 'الرابط يجب أن يبدأ بـ https://'
  }
  return errors
}
