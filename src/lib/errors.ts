export function toMessage(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''

  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found' ||
    code === 'auth/invalid-login-credentials'
  ) {
    return 'البريد أو كلمة المرور غير صحيحة.'
  }
  if (code === 'auth/invalid-email') return 'البريد الإلكتروني غير صالح.'
  if (code === 'auth/too-many-requests') return 'محاولات كثيرة. انتظروا قليلاً ثم أعيدوا المحاولة.'
  if (code === 'auth/user-disabled') return 'هذا الحساب موقوف.'
  if (code === 'auth/network-request-failed') return 'تعذر الاتصال. تحققوا من الشبكة.'
  if (code === 'permission-denied') return 'ليست لديكم صلاحية هذا الإجراء.'
  if (code === 'unavailable') return 'قاعدة البيانات غير متاحة الآن. أعيدوا المحاولة.'
  if (code === 'failed-precondition') {
    return 'العملية تحتاج فهرس Firestore. انشروا الفهارس كما هو موضح في دليل الإعداد.'
  }
  if (code === 'already-exists') return 'هذا العنصر موجود مسبقاً.'
  if (error instanceof Error && error.message) return error.message
  return 'حدث خطأ غير متوقع. أعيدوا المحاولة.'
}
