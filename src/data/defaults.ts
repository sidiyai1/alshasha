import { SITE_NAME, TAGLINE } from '../config.ts'
import type { Category, SiteSettings } from '../types.ts'

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'siyasa',
    name: 'سياسة',
    slug: 'siyasa',
    description: 'قرارات، مؤسسات، وحوار عام يمس حياة الناس.',
    order: 1,
    showInNav: true,
  },
  {
    id: 'iqtisad',
    name: 'اقتصاد',
    slug: 'iqtisad',
    description: 'أسواق، عمل، وأثر السياسات على المعيشة.',
    order: 2,
    showInNav: true,
  },
  {
    id: 'mujtama',
    name: 'مجتمع',
    slug: 'mujtama',
    description: 'خدمات، أحياء، ومبادرات يومية.',
    order: 3,
    showInNav: true,
  },
  {
    id: 'thaqafa',
    name: 'ثقافة',
    slug: 'thaqafa',
    description: 'كتب، مسارح، وذاكرة المدينة.',
    order: 4,
    showInNav: true,
  },
  {
    id: 'riyada',
    name: 'رياضة',
    slug: 'riyada',
    description: 'ملاعب، أندية، وقصص اللاعبين.',
    order: 5,
    showInNav: true,
  },
  {
    id: 'tahqiqat',
    name: 'تحقيقات',
    slug: 'tahqiqat',
    description: 'أسئلة مفتوحة عن المال العام والخدمات.',
    order: 6,
    showInNav: true,
  },
  {
    id: 'maqalat',
    name: 'مقالات',
    slug: 'maqalat',
    description: 'رأي وتحليل يلتزم وضوح الحجة.',
    order: 7,
    showInNav: true,
  },
]

export const DEFAULT_ABOUT_HTML = [
  '<p>الشاشة صحيفة عربية تعمل بمبدأ واحد: أن يصل القارئ إلى الخبر واضحاً، وأن يميّز بين الواقعة والتعليق.</p>',
  '<h2>لماذا هذا الاسم</h2>',
  '<p>الشاشة هي المساحة التي تُعرض عليها الوقائع قبل أن تختلط بالضجيج. اخترنا الاسم التزاماً بثلاثة ضوابط مكتوبة في الشعار: الصدق في نقل ما نعرف، والأمانة في نسبة الكلام إلى صاحبه، والحياد في عدم تحويل الصفحة إلى منبر خاص.</p>',
  '<h2>كيف نعمل</h2>',
  '<p>ننشر الخبر بعد مراجعة عنوانه وموجزه ومصدره. المقال يحمل اسم قسمه، والتحقيق يفصل بين ما تم التحقق منه وما بقي سؤالاً. الأرشيف الورقي يبقى متاحاً للقراءة والتنزيل حين يتوفر ملف العدد.</p>',
  '<p>المحتوى الموسوم بعبارة «محتوى تجريبي» نص تدريبي لعرض شكل الجريدة، وليس تغطية لحدث واقعي.</p>',
].join('')

export const DEFAULT_SETTINGS: SiteSettings = {
  siteName: SITE_NAME,
  tagline: TAGLINE,
  aboutHtml: DEFAULT_ABOUT_HTML,
  contactEmail: 'tahrir@alshasha.example',
  contactPhone: '',
  contactAddress: 'يُحدَّد عنوان التحرير عند الإطلاق.',
  featuredArticleIds: [],
  socialX: '',
  socialFacebook: '',
  socialInstagram: '',
  socialYoutube: '',
}

export function navigationCategories(categories: Category[]): Category[] {
  const source = categories.length > 0 ? categories : DEFAULT_CATEGORIES
  return source.filter((category) => category.showInNav).sort((left, right) => left.order - right.order)
}
