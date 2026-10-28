import type { Category } from '../types.ts'

export interface SuggestedCategory {
  name: string
  slug: string
  description: string
  order: string
}

/** Suggestions only. Nothing here is written until an administrator saves it. */
export const SUGGESTED_CATEGORIES: SuggestedCategory[] = [
  { name: 'الأخبار الوطنية', slug: 'wataniya', description: 'أخبار المدن والمؤسسات داخل البلاد.', order: '2' },
  { name: 'السياسة', slug: 'siyasa', description: 'قرارات، مؤسسات، وحوار عام.', order: '3' },
  { name: 'الاقتصاد', slug: 'iqtisad', description: 'أسواق، عمل، وأثرها على المعيشة.', order: '4' },
  { name: 'المجتمع', slug: 'mujtama', description: 'خدمات، أحياء، وحياة يومية.', order: '5' },
  { name: 'الرياضة', slug: 'sports', description: 'ملاعب، أندية، وقصص اللاعبين.', order: '6' },
  { name: 'الأخبار الدولية', slug: 'dawliya', description: 'أحداث العالم خارج الحدود.', order: '7' },
  { name: 'الثقافة', slug: 'thaqafa', description: 'كتب، فنون، وذاكرة.', order: '8' },
  { name: 'التكنولوجيا', slug: 'technology', description: 'أدوات، شبكات، وأثر التقنية.', order: '9' },
  { name: 'الصحة', slug: 'siha', description: 'طب، وقاية، وخدمات صحية.', order: '10' },
  { name: 'مقالات وآراء', slug: 'maqalat', description: 'رأي وتحليل يلتزم وضوح الحجة.', order: '11' },
]

export function missingCategorySuggestions(existing: Category[]): SuggestedCategory[] {
  return SUGGESTED_CATEGORIES.filter(
    (suggestion) =>
      !existing.some((category) => category.slug === suggestion.slug || category.name.trim() === suggestion.name.trim()),
  )
}
