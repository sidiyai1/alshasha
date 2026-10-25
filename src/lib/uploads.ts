/**
 * Direct uploads stay off until a signer outside this browser can issue a
 * one-time upload. Do not place a storage secret or an unsigned upload preset
 * in frontend code, and do not enable Firebase Storage on the Spark plan.
 */
export function secureUploadsConfigured(): boolean {
  return false
}

export const PDF_MAX_BYTES = 25 * 1024 * 1024

export function validatePdfFile(file: { name: string; type: string; size: number }): string | null {
  const name = file.name.trim().toLowerCase()
  const type = file.type.trim().toLowerCase()
  const typeOk = type === 'application/pdf' || type === 'application/x-pdf' || type === ''
  if (!name.endsWith('.pdf') || !typeOk) return 'اختاروا ملف PDF فقط.'
  if (!Number.isFinite(file.size) || file.size <= 0) return 'الملف فارغ.'
  if (file.size > PDF_MAX_BYTES) return 'حجم ملف PDF يجب ألا يتجاوز 25 ميغابايت.'
  return null
}
