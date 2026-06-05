export type Lang = 'en' | 'ar';

export const TR: Record<string, Record<Lang, string>> = {
  // ── header / nav ──────────────────────────────────────────────────────────
  brand:           { en: 'AI Image Generator',                ar: 'مولّد الصور بالذكاء الاصطناعي' },
  tagline:         { en: 'Powered by gpt-image-1',            ar: 'مدعوم بـ gpt-image-1' },
  create:          { en: 'Create',                            ar: 'إنشاء' },
  gallery:         { en: 'Gallery',                           ar: 'المعرض' },
  stats:           { en: 'Stats',                             ar: 'الإحصائيات' },
  signin:          { en: 'Sign in',                           ar: 'تسجيل الدخول' },
  signout:         { en: 'Sign out',                          ar: 'تسجيل الخروج' },
  toggleTheme:     { en: 'Toggle theme',                      ar: 'تبديل المظهر' },
  switchToAr:      { en: 'ع',                                 ar: 'EN' },

  // ── create page ───────────────────────────────────────────────────────────
  describe:        { en: 'Describe your image',               ar: 'صِف صورتك' },
  promptPh:        { en: 'A majestic dragon flying over snow-capped mountains at sunset… (Arabic prompts are auto-translated)', ar: 'تنّين مهيب يحلّق فوق جبال مكسوّة بالثلج عند الغروب… (المطالبات العربية تُترجم تلقائياً)' },
  voiceInput:      { en: 'Voice input',                       ar: 'إدخال صوتي' },
  enhanceAI:       { en: 'Enhance with AI',                   ar: 'تحسين بالذكاء الاصطناعي' },
  enhancing:       { en: 'Enhancing…',                        ar: 'جارٍ التحسين…' },
  styles:          { en: 'Style presets',                     ar: 'أنماط جاهزة' },
  advanced:        { en: 'Advanced options',                  ar: 'خيارات متقدمة' },
  forceRegen:      { en: 'Force re-generation (skip cache)',  ar: 'إعادة التوليد إجباريًا (تجاهل الذاكرة)' },
  sizeLabel:       { en: 'Size',                              ar: 'الحجم' },
  qualityLabel:    { en: 'Quality',                           ar: 'الجودة' },
  bgLabel:         { en: 'Background',                        ar: 'الخلفية' },
  formatLabel:     { en: 'Format',                            ar: 'الصيغة' },
  generate:        { en: 'Generate',                          ar: 'توليد' },
  generating:      { en: 'Generating…',                       ar: 'جارٍ التوليد…' },
  tryASample:      { en: 'Try a sample',                      ar: 'جرّب مثالًا' },
  minChars:        { en: 'Minimum 3 characters',              ar: 'الحد الأدنى ٣ أحرف' },

  // ── style presets ─────────────────────────────────────────────────────────
  presetPhoto:     { en: 'Photorealistic',                    ar: 'فوتوريالستك' },
  presetAnime:     { en: 'Anime',                             ar: 'أنمي' },
  presetOil:       { en: 'Oil Painting',                      ar: 'رسم زيتي' },
  presetWater:     { en: 'Watercolor',                        ar: 'ألوان مائية' },
  presetPixel:     { en: 'Pixel Art',                         ar: 'بيكسل آرت' },
  presetCinema:    { en: 'Cinematic',                         ar: 'سينمائي' },
  presetGhibli:    { en: 'Studio Ghibli',                     ar: 'ستوديو جيبلي' },
  preset3D:        { en: '3D Render',                         ar: 'ثلاثي الأبعاد' },

  // ── empty state ───────────────────────────────────────────────────────────
  emptyTitle:      { en: 'Your generated image will appear here.',    ar: 'ستظهر صورتك المولّدة هنا.' },
  emptyLink:       { en: 'Or browse your past creations',             ar: 'أو تصفّح أعمالك السابقة' },

  // ── generation progress ───────────────────────────────────────────────────
  stageModerate:   { en: 'Moderating prompt',                 ar: 'مراجعة المطالبة' },
  stageModerateH:  { en: 'Safety check · ~80ms',              ar: 'فحص الأمان · ~٨٠ms' },
  stageTranslate:  { en: 'Translating to English',            ar: 'الترجمة إلى الإنجليزية' },
  stageTranslateH: { en: 'Arabic detected · gpt-4o-mini',     ar: 'تم اكتشاف العربية · gpt-4o-mini' },
  stageCache:      { en: 'Checking cache',                    ar: 'التحقق من الذاكرة' },
  stageCacheH:     { en: 'Hash lookup · no match',            ar: 'بحث بالمفتاح · لا تطابق' },
  stageGen:        { en: 'Generating image',                  ar: 'توليد الصورة' },
  stageGenH:       { en: 'gpt-image-1 · streaming partials',  ar: 'gpt-image-1 · تدفق جزئي' },
  stageSave:       { en: 'Saving + thumbnail',                ar: 'حفظ + صورة مصغّرة' },
  stageSaveH:      { en: 'Object store + DB write',           ar: 'مخزن + كتابة قاعدة بيانات' },
  refining:        { en: 'Refining · pass',                   ar: 'تحسين · تمريرة' },
  cancelGen:       { en: 'Cancel generation',                 ar: 'إلغاء التوليد' },
  translatedTo:    { en: 'Translated → English (sent to model)', ar: 'تُرجم → الإنجليزية (أُرسل للنموذج)' },
  partialHint:     { en: 'Partial previews will appear here as gpt-image-1 refines the image.', ar: 'ستظهر معاينات جزئية هنا بينما يحسّن gpt-image-1 الصورة.' },

  // ── image result ──────────────────────────────────────────────────────────
  savedBadge:      { en: 'Saved',                             ar: 'محفوظ' },
  cachedBadge:     { en: 'Cached',                            ar: 'من الذاكرة' },
  download:        { en: 'Download',                          ar: 'تنزيل' },
  share:           { en: 'Share',                             ar: 'مشاركة' },
  viewGallery:     { en: 'Gallery',                           ar: 'المعرض' },

  // ── gallery page ──────────────────────────────────────────────────────────
  gallerySubAll:   { en: 'All your generated images, in one place', ar: 'جميع صورك المولّدة في مكان واحد' },
  galleryCountFmt: { en: '{n} image(s) in your collection',   ar: '{n} صورة في مجموعتك' },
  newImage:        { en: 'New image',                         ar: 'صورة جديدة' },
  searchPh:        { en: 'Search prompts…',                   ar: 'ابحث في المطالبات…' },
  anySize:         { en: 'Any size',                          ar: 'أي حجم' },
  anyQuality:      { en: 'Any quality',                       ar: 'أي جودة' },
  anyBg:           { en: 'Any background',                    ar: 'أي خلفية' },
  clearFilters:    { en: 'Clear filters',                     ar: 'مسح الفلاتر' },
  nMatches:        { en: '{n} matches',                       ar: '{n} نتيجة' },
  nTotal:          { en: '{n} total',                         ar: '{n} إجمالاً' },
  noImages:        { en: 'Your gallery is empty',             ar: 'مجموعتك فارغة' },
  noImagesSub:     { en: 'Generate your first image to see it here.', ar: 'ولّد صورتك الأولى لترى نتائجها هنا.' },
  noMatch:         { en: 'No images match your filters',      ar: 'لا توجد صور تطابق الفلاتر' },
  noMatchSub:      { en: 'Try removing a filter or clearing your search.', ar: 'جرّب إزالة فلتر أو مسح البحث.' },
  createFirst:     { en: 'Create an image',                   ar: 'أنشئ صورة' },

  // ── pagination ────────────────────────────────────────────────────────────
  showingFmt:      { en: 'Showing {from}–{to} of {total}',   ar: 'عرض {from}–{to} من {total}' },
  prev:            { en: 'Prev',                              ar: 'السابق' },
  next:            { en: 'Next',                              ar: 'التالي' },
  pageOf:          { en: '{page} / {total}',                  ar: '{page} / {total}' },

  // ── image modal ───────────────────────────────────────────────────────────
  promptLabel:     { en: 'Prompt',                            ar: 'المطالبة' },
  tagsLabel:       { en: 'Tags',                              ar: 'الوسوم' },
  addTag:          { en: 'Add a tag…',                        ar: 'أضف وسمًا…' },
  costLabel:       { en: 'Cost',                              ar: 'التكلفة' },
  createdLabel:    { en: 'Created',                           ar: 'أُنشئت' },
  fileSizeLabel:   { en: 'File size',                         ar: 'حجم الملف' },
  regenSimilar:    { en: 'Regenerate',                        ar: 'إعادة توليد' },
  regenerating:    { en: 'Generating…',                       ar: 'جارٍ التوليد…' },
  deleteLabel:     { en: 'Delete',                            ar: 'حذف' },
  confirmDel:      { en: 'Confirm?',                          ar: 'تأكيد؟' },
  closeLabel:      { en: 'Close',                             ar: 'إغلاق' },
  noTags:          { en: 'No tags',                           ar: 'لا وسوم' },

  // ── stats page ────────────────────────────────────────────────────────────
  usageCost:       { en: 'Usage & cost',                      ar: 'الاستخدام والتكلفة' },
  usageSub:        { en: 'All figures are estimates based on gpt-image-1 pricing.', ar: 'جميع الأرقام تقديرية بناءً على تسعير gpt-image-1.' },
  imagesGen:       { en: 'Images generated',                  ar: 'الصور المولّدة' },
  totalSpend:      { en: 'Total spend',                       ar: 'إجمالي الإنفاق' },
  cacheHits:       { en: 'Cache hits',                        ar: 'إصابات الذاكرة' },
  autoTranslated:  { en: 'Auto-translated',                   ar: 'تُرجمت تلقائيًا' },
  usdEstimated:    { en: 'USD, estimated',                    ar: 'USD، تقدير' },
  arToEn:          { en: 'Arabic → English',                  ar: 'عربي → إنجليزي' },
  dailySpend:      { en: 'Daily spend · last 30 days',        ar: 'الإنفاق اليومي · آخر ٣٠ يومًا' },
  byQuality:       { en: 'By quality',                        ar: 'حسب الجودة' },
  bySize:          { en: 'By size',                           ar: 'حسب الحجم' },
  noDataGen:       { en: 'No data yet — generate an image first.', ar: 'لا بيانات بعد — ولّد صورة أولاً.' },
  noData:          { en: 'No data yet.',                      ar: 'لا بيانات.' },
  savedHint:       { en: 'saved',                             ar: 'مُوفّر' },
  approxSaved:     { en: '≈ ${amount} saved',                 ar: '≈ ${amount} مُوفّر' },

  // ── footer ────────────────────────────────────────────────────────────────
  footer:          { en: 'Built with React, TypeScript, Tailwind CSS, TanStack Query, and FastAPI.', ar: 'مبني بـ React وTypeScript وTailwind CSS وTanStack Query وFastAPI.' },

  // ── auth / login ──────────────────────────────────────────────────────────
  ownerSignin:     { en: 'Owner sign-in',                     ar: 'تسجيل دخول المالك' },
  authNote:        { en: 'Authentication protects write operations (generate / delete / edit tags).', ar: 'المصادقة تحمي عمليات الكتابة (توليد / حذف / تعديل الوسوم).' },
  usernameLabel:   { en: 'Username',                          ar: 'اسم المستخدم' },
  passwordLabel:   { en: 'Password',                          ar: 'كلمة المرور' },
  cancelLabel:     { en: 'Cancel',                            ar: 'إلغاء' },
  signingIn:       { en: 'Signing in…',                       ar: 'جارٍ الدخول…' },

  // ── error / loading ───────────────────────────────────────────────────────
  somethingWrong:  { en: 'Something went wrong',              ar: 'حدث خطأ ما' },
  loadingImg:      { en: 'Conjuring your image… this can take 15–30 seconds.', ar: 'جارٍ توليد صورتك… قد يستغرق هذا ١٥–٣٠ ثانية.' },

  // ── toasts ────────────────────────────────────────────────────────────────
  toastCached:     { en: 'Returned a cached image (no API cost). Toggle "Force re-generation" for a new one.', ar: 'تمت استعادة صورة مخزّنة (دون تكلفة API). فعّل "إعادة التوليد إجباريًا" للحصول على صورة جديدة.' },
  toastTranslated: { en: 'Image generated — your prompt was auto-translated to English first.', ar: 'تم توليد الصورة — تُرجمت مطالبتك تلقائيًا إلى الإنجليزية أولاً.' },
  toastGenerated:  { en: 'Image generated and saved.',        ar: 'تم توليد الصورة وحفظها.' },
  toastDeleted:    { en: 'Image deleted',                     ar: 'تم حذف الصورة' },
  toastNewVar:     { en: 'New variation generated',           ar: 'تم توليد نسخة جديدة' },
  toastDownload:   { en: 'Download started',                  ar: 'بدأ التنزيل' },
  toastShared:     { en: 'Shared!',                           ar: 'تمت المشاركة!' },
  toastLinkCopied: { en: 'Link copied to clipboard',          ar: 'تم نسخ الرابط' },
  toastEnhanced:   { en: 'Prompt enhanced with AI.',          ar: 'تم تحسين المطالبة بالذكاء الاصطناعي.' },
  toastVoice:      { en: 'Voice transcribed',                 ar: 'تم نسخ الصوت' },
  toastSignedIn:   { en: 'Signed in',                         ar: 'تم الدخول' },
  toastSignedOut:  { en: 'Signed out',                        ar: 'تم الخروج' },
  toastSignFail:   { en: 'Sign-in failed',                    ar: 'فشل تسجيل الدخول' },
  toastEnhFail:    { en: 'Enhancement failed.',               ar: 'فشل التحسين.' },
  toastShareFail:  { en: 'Share failed.',                     ar: 'فشلت المشاركة.' },
  toastMin2:       { en: 'Type at least 2 characters first.', ar: 'اكتب حرفين على الأقل أولاً.' },
  toastTagFail:    { en: 'Could not update tags',             ar: 'لا يمكن تحديث الوسوم' },
  toastDlFail:     { en: 'Could not download — opened in new tab instead.', ar: 'لا يمكن التنزيل — تم الفتح في تبويب جديد.' },
};

export function makeT(lang: Lang) {
  return (key: string, fallback?: string): string =>
    TR[key]?.[lang] ?? fallback ?? key;
}
