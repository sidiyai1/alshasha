import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const demoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'demo')
const imageDir = join(demoRoot, 'images')
const coverDir = join(demoRoot, 'covers')
mkdirSync(imageDir, { recursive: true })
mkdirSync(coverDir, { recursive: true })

const categories = [
  ['siyasa', 'سياسة'],
  ['iqtisad', 'اقتصاد'],
  ['mujtama', 'مجتمع'],
  ['thaqafa', 'ثقافة'],
  ['riyada', 'رياضة'],
  ['tahqiqat', 'تحقيقات'],
  ['maqalat', 'مقالات'],
]

for (const [id, label] of categories) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 750" role="img" aria-label="${label}">
  <rect width="1200" height="750" fill="#F6F4EF"/>
  <rect width="1200" height="18" fill="#06452E"/>
  <circle cx="170" cy="170" r="74" fill="#C69B35"/>
  <path d="M0 560c240-90 430 50 700-10 190-40 330 20 500-40v240H0z" fill="#06452E"/>
  <text x="1120" y="280" fill="#06452E" font-size="84" font-family="Tahoma, Arial, sans-serif" text-anchor="end" direction="rtl">${label}</text>
  <text x="1120" y="360" fill="#44504A" font-size="32" font-family="Tahoma, Arial, sans-serif" text-anchor="end" direction="rtl">صورة توضيحية للمحتوى التجريبي</text>
</svg>`
  writeFileSync(join(imageDir, `${id}.svg`), svg)
}

const covers = [
  [1284, 'ملف المعيشة'],
  [1283, 'لوائح البناء'],
  [1282, 'ملعب الناشئين'],
  [1281, 'العيادة المتنقلة'],
  [1276, 'العودة إلى المدارس'],
  [1204, 'نهاية العام'],
  [1188, 'موسم الصيف'],
  [1142, 'مطلع العام'],
  [1285, 'قيد الإعداد'],
]

for (const [issue, headline] of covers) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 840">
  <rect width="600" height="840" fill="#FFFFFF" stroke="#E6E2D8"/>
  <rect width="600" height="92" fill="#06452E"/>
  <text x="570" y="58" fill="#FFFFFF" font-size="42" font-family="Tahoma, Arial, sans-serif" text-anchor="end" direction="rtl">الشاشة</text>
  <rect y="92" width="600" height="8" fill="#C69B35"/>
  <text x="570" y="160" fill="#06452E" font-size="22" font-family="Tahoma, Arial, sans-serif" text-anchor="end" direction="rtl">العدد ${issue}</text>
  <text x="570" y="250" fill="#17211C" font-size="40" font-family="Tahoma, Arial, sans-serif" text-anchor="end" direction="rtl">${headline}</text>
  <rect x="36" y="310" width="250" height="12" fill="#E6E2D8"/>
  <rect x="36" y="336" width="220" height="12" fill="#E6E2D8"/>
  <rect x="314" y="310" width="250" height="12" fill="#E6E2D8"/>
  <rect x="314" y="336" width="190" height="12" fill="#E6E2D8"/>
  <rect x="36" y="390" width="528" height="250" fill="#F6F4EF"/>
  <text x="300" y="760" fill="#44504A" font-size="18" font-family="Tahoma, Arial, sans-serif" text-anchor="middle" direction="rtl">غلاف تجريبي</text>
</svg>`
  writeFileSync(join(coverDir, `${issue}.svg`), svg)
}

const page1 = 'BT /F1 18 Tf 64 760 Td (Al-Shasha demo edition) Tj T* 0 -32 Td (Sample file only. Not a real newspaper PDF.) Tj ET'
const page2 = 'BT /F1 18 Tf 64 760 Td (Page 2) Tj T* 0 -32 Td (Reader controls move between these two sample pages.) Tj ET'
const objects = [
  '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
  '2 0 obj\n<< /Type /Pages /Count 2 /Kids [3 0 R 6 0 R] >>\nendobj\n',
  '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
  `4 0 obj\n<< /Length ${Buffer.byteLength(page1)} >>\nstream\n${page1}\nendstream\nendobj\n`,
  '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  '6 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 7 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
  `7 0 obj\n<< /Length ${Buffer.byteLength(page2)} >>\nstream\n${page2}\nendstream\nendobj\n`,
]
let cursor = Buffer.byteLength('%PDF-1.4\n')
const xref = ['0000000000 65535 f \n']
for (const body of objects) {
  xref.push(`${String(cursor).padStart(10, '0')} 00000 n \n`)
  cursor += Buffer.byteLength(body)
}
const pdf = `%PDF-1.4\n${objects.join('')}xref\n0 ${objects.length + 1}\n${xref.join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${cursor}\n%%EOF\n`
writeFileSync(join(demoRoot, 'issue-sample.pdf'), pdf)
console.log('demo assets written')
