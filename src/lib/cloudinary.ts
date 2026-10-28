import { getFirebaseAuth } from './firebase.ts'
import { validatePdfFile } from './uploads.ts'

/** Public signer. It holds no Cloudinary secret in this website. */
export const CLOUDINARY_SIGNER_URL = 'https://elchacha-cloudinary-signer.it96sidiya.workers.dev'

export const CLOUDINARY_CLOUD_NAME = 'xia2bmxx'

const PRESETS = {
  image: 'alshasha_images',
  archive: 'alshasha_archive',
} as const

/**
 * PDF.js reads the original file bytes. The signer does not return a resource
 * type, and unsigned probes could not tell the preset's type apart. Raw
 * delivery is the original PDF. A resource_type from the signer overrides this.
 */
export const ARCHIVE_RESOURCE_FALLBACK = 'raw' as const

export const IMAGE_MAX_BYTES = 8 * 1024 * 1024

/** Smaller Cloudinary delivery. Original stored URLs stay unchanged. */
export function deliveryImage(url: string, width = 960): string {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return url
  }
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'res.cloudinary.com') return url
  const marker = '/image/upload/'
  const index = parsed.pathname.indexOf(marker)
  if (index === -1) return url
  const rest = parsed.pathname.slice(index + marker.length)
  if (/(^|\/)(f_auto|q_auto|w_|c_limit)/.test(rest)) return url
  const safeWidth = Math.min(1600, Math.max(200, Math.round(width)))
  parsed.pathname = `${parsed.pathname.slice(0, index)}${marker}f_auto,q_auto,w_${safeWidth},c_limit/${rest}`
  return parsed.toString()
}

/** Archive grids ask for a modest cover. */
export function coverThumbnail(url: string, width = 480): string {
  return deliveryImage(url, width)
}

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']

export type UploadType = 'image' | 'archive'
export type ResourceType = 'image' | 'raw' | 'auto'

export interface UploadSignature {
  signature: string
  apiKey: string
  cloudName: string
  resourceType: ResourceType
  params: Record<string, string>
}

export interface UploadedAsset {
  url: string
  publicId: string
}

type ProgressHandler = (percent: number) => void

export function validateImageFile(file: { name: string; type: string; size: number }): string | null {
  const name = file.name.trim().toLowerCase()
  const type = file.type.trim().toLowerCase()
  const extensionOk = IMAGE_EXTENSIONS.some((extension) => name.endsWith(extension))
  const typeOk = type === '' || IMAGE_TYPES.has(type)
  if (!extensionOk || !typeOk) return 'اختاروا صورة JPG أو PNG أو WebP.'
  if (!Number.isFinite(file.size) || file.size <= 0) return 'الملف فارغ.'
  if (file.size > IMAGE_MAX_BYTES) return 'حجم الصورة يجب ألا يتجاوز 8 ميغابايت.'
  return null
}

export function validateUploadFile(type: UploadType, file: { name: string; type: string; size: number }): string | null {
  return type === 'image' ? validateImageFile(file) : validatePdfFile(file)
}

function text(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed ? trimmed : null
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return null
}

function record(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function resourceType(value: unknown, type: UploadType): ResourceType {
  const name = text(value)
  if (type === 'image') {
    if (name && name !== 'image') throw new Error('توقيع الصورة لا يطابق رفع الصور.')
    return 'image'
  }
  if (!name) return ARCHIVE_RESOURCE_FALLBACK
  if (name === 'image' || name === 'raw' || name === 'auto') return name
  throw new Error('نوع ملف الأرشيف في التوقيع غير مدعوم.')
}

const EXTRA_SIGNED_KEYS = ['folder', 'public_id', 'tags', 'context', 'asset_folder', 'filename_override'] as const

function signedParams(source: Record<string, unknown>, timestamp: string, preset: string): Record<string, string> {
  const rawParams = record(source.params)
  const params: Record<string, string> = {}
  const entries = rawParams ? Object.entries(rawParams) : []
  for (const [key, value] of entries) {
    if (key === 'file' || key === 'api_key' || key === 'signature' || key === 'resource_type' || key === 'cloud_name') continue
    const next = text(value)
    if (!next) continue
    params[key] = next
  }
  for (const key of EXTRA_SIGNED_KEYS) {
    if (params[key]) continue
    const next = text(source[key])
    if (next) params[key] = next
  }
  if (params.timestamp && params.timestamp !== timestamp) throw new Error('توقيع الرفع غير متطابق.')
  if (params.upload_preset && params.upload_preset !== preset) throw new Error('توقيع الرفع غير متطابق.')
  params.timestamp = timestamp
  params.upload_preset = preset
  return params
}

export function parseUploadSignature(payload: unknown, type: UploadType): UploadSignature {
  const root = record(payload)
  const nested = root ? record(root.data) : null
  const source = root && (text(root.signature) || text(root.api_key) || text(root.apiKey)) ? root : nested
  if (!source) throw new Error('استجابة توقيع الرفع غير صالحة.')
  const signature = text(source.signature)
  const timestamp = text(source.timestamp)
  const preset = text(source.upload_preset) ?? text(source.uploadPreset) ?? text(source.preset)
  const apiKey = text(source.api_key) ?? text(source.apiKey)
  const cloudName = text(source.cloud_name) ?? text(source.cloudName)
  if (!signature || !timestamp || !preset || !apiKey || !cloudName) throw new Error('استجابة توقيع الرفع ناقصة.')
  if (!/^\d{10,13}$/.test(timestamp)) throw new Error('وقت توقيع الرفع غير صالح.')
  if (cloudName !== CLOUDINARY_CLOUD_NAME) throw new Error('اسم حساب الرفع غير مطابق.')
  if (preset !== PRESETS[type]) throw new Error('إعداد الرفع الموقّع غير مطابق.')
  if (apiKey.length < 8 || apiKey.length > 64 || /\s/.test(apiKey)) throw new Error('مفتاح الرفع غير صالح.')
  return {
    signature,
    apiKey,
    cloudName,
    resourceType: resourceType(source.resource_type ?? source.resourceType, type),
    params: signedParams(source, timestamp, preset),
  }
}

export function cloudinaryUploadUrl(signature: UploadSignature): string {
  return `https://api.cloudinary.com/v1_1/${signature.cloudName}/${signature.resourceType}/upload`
}

export function cloudinaryFormFields(signature: UploadSignature): Record<string, string> {
  return {
    ...signature.params,
    api_key: signature.apiKey,
    signature: signature.signature,
  }
}

async function requestSignature(type: UploadType): Promise<UploadSignature> {
  const user = getFirebaseAuth().currentUser
  if (!user) throw new Error('يلزم تسجيل الدخول بحساب إدارة قبل رفع الملف.')
  const token = await user.getIdToken()
  let response: Response
  try {
    response = await fetch(CLOUDINARY_SIGNER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type }),
    })
  } catch {
    throw new Error('تعذر الاتصال بخدمة توقيع الرفع.')
  }
  if (response.status === 401 || response.status === 403) throw new Error('ليس لديكم صلاحية رفع الملفات.')
  if (!response.ok) throw new Error('تعذر الحصول على توقيع الرفع.')
  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new Error('استجابة توقيع الرفع غير صالحة.')
  }
  return parseUploadSignature(payload, type)
}

function readUploadResult(payload: unknown): UploadedAsset {
  const source = record(payload)
  const url = source ? text(source.secure_url) : null
  const publicId = source ? text(source.public_id) : null
  if (!url || !publicId) throw new Error('استجابة الرفع ناقصة.')
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error('رابط الملف المرفوع غير صالح.')
  }
  const expectedPrefix = `/xia2bmxx/`
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'res.cloudinary.com' || !parsed.pathname.startsWith(expectedPrefix)) {
    throw new Error('رابط الملف المرفوع خارج الحساب المتوقع.')
  }
  if (publicId.length > 255 || publicId.includes('..') || /[\s<>]/.test(publicId)) throw new Error('معرّف الملف المرفوع غير صالح.')
  return { url, publicId }
}

function cloudinaryFailure(payload: unknown): string {
  const source = record(payload)
  const error = source ? record(source.error) : null
  const message = error ? text(error.message) ?? '' : ''
  if (/file size|too large/i.test(message)) return 'الملف أكبر من الحد المسموح في Cloudinary.'
  if (/preset|resource type/i.test(message)) return 'إعداد الرفع الموقّع لا يطابق نوع الملف.'
  if (/invalid image|format/i.test(message)) return 'نوع الملف غير مقبول.'
  return 'تعذر رفع الملف.'
}

export async function uploadCloudinaryFile(file: File, type: UploadType, onProgress?: ProgressHandler): Promise<UploadedAsset> {
  const invalid = validateUploadFile(type, file)
  if (invalid) throw new Error(invalid)
  const signature = await requestSignature(type)
  const fields = cloudinaryFormFields(signature)
  const body = new FormData()
  for (const [key, value] of Object.entries(fields)) body.append(key, value)
  body.append('file', file)

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('POST', cloudinaryUploadUrl(signature))
    request.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable || event.total <= 0) return
      onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)))
    }
    request.onerror = () => reject(new Error('تعذر الاتصال بـ Cloudinary.'))
    request.onload = () => {
      let payload: unknown = null
      try {
        payload = JSON.parse(request.responseText) as unknown
      } catch {
        payload = null
      }
      if (request.status < 200 || request.status >= 300) {
        reject(new Error(cloudinaryFailure(payload)))
        return
      }
      try {
        resolve(readUploadResult(payload))
      } catch (error) {
        reject(error instanceof Error ? error : new Error('تعذر رفع الملف.'))
      }
    }
    request.send(body)
  })
}
