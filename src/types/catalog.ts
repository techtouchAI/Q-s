import { ExamSession, PaperFont, PointKind, SchoolGender, SignatureTitle, SubjectLayoutTemplate } from './exam';

export const ExamCatalog = {
  bismillah: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
  administrationLabel: 'ادارة',
  examTitlePrefix: 'اسئلة امتحان',
  academicYearPrefix: 'للعام الدراسي',
  subjectLabel: 'المادة:',
  gradeLabel: 'الصف:',
  timeLabel: 'الوقت:',
  studentNameLabel: 'اسم الطالب:',
  blankLine: '....................',
  fillBlank: '............',
  trueFalseSlot: '(        )',
  examTypeSuggestions: [
    'نصف السنة',
    'نهاية السنة',
    'الشهر الأول',
    'الشهر الثاني',
    'الشهر الثالث',
    'الكورس الأول',
    'الكورس الثاني',
    'الامتحان التمهيدي',
    'امتحان تجريبي',
  ],
  timeSuggestions: [
    'نصف ساعة',
    'ساعة واحدة',
    'ساعة ونصف',
    'ساعتان',
    'ساعتان ونصف',
    'ثلاث ساعات',
  ],
  closingPhrases: [
    'انتهت الأسئلة',
    'تمنياتنا لكم بالنجاح والتوفيق',
    'مع تمنياتنا لجميع الطلبة بالنجاح',
    'مع تمنياتي لكم بالنجاح والتفوق',
    'وفقكم الله ونجحكم',
    'بالتوفيق والنجاح للجميع',
    'مع أطيب التمنيات بالنجاح والتفوق',
    'وفقكم الله لما يحب ويرضى',
    'انتهت الأسئلة مع تمنياتنا بالنجاح',
    'والله ولي التوفيق',
  ],
  defaultClosingPhrase: 'تمنياتنا لكم بالنجاح والتوفيق',
};

export const SubjectCatalog = {
  knownSubjects: [
    'التربية الإسلامية',
    'اللغة العربية',
    'اللغة الإنكليزية',
    'الرياضيات',
    'الفيزياء',
    'الكيمياء',
    'الأحياء',
    'العلوم',
    'الاجتماعيات',
    'التاريخ',
    'الجغرافية',
    'الوطنية',
    'الحاسوب',
    'الاقتصاد',
  ],

  isIslamic(subject: string): boolean {
    return subject.includes('إسلام') || subject.includes('اسلام') || subject.includes('قرآن') || subject.includes('قران');
  },

  isArabic(subject: string): boolean {
    return subject.includes('عرب') || subject.includes('قواعد') || subject.includes('أدب') || subject.includes('ادب');
  },

  isEnglish(subject: string): boolean {
    return subject.includes('إنكليز') || subject.includes('انكليز') || subject.includes('إنجليز') || subject.includes('انجليز') || subject.toLowerCase().includes('english');
  },

  isScientific(subject: string): boolean {
    const markers = ['فيزياء', 'كيمياء', 'رياضيات', 'أحياء', 'احياء', 'علوم', 'حاسوب'];
    return markers.some((m) => subject.includes(m));
  },

  getLayoutTemplate(subject: string): SubjectLayoutTemplate {
    const s = subject.trim();
    if (this.isIslamic(s)) return 'islamic';
    if (this.isArabic(s)) return 'arabic';
    if (this.isEnglish(s)) return 'english';
    if (this.isScientific(s)) return 'scientific';
    return 'generic';
  },

  getSectionsForTemplate(template: SubjectLayoutTemplate): string[] {
    switch (template) {
      case 'islamic':
        return ['أحكام التلاوة', 'الحفظ', 'الفهم والتفسير', 'التربية الإسلامية'];
      case 'arabic':
        return ['القواعد', 'الأدب والنصوص', 'الإملاء', 'الإنشاء'];
      default:
        return [];
    }
  },
};

export const ArabicOrdinals = [
  'الأول',
  'الثاني',
  'الثالث',
  'الرابع',
  'الخامس',
  'السادس',
  'السابع',
  'الثامن',
  'التاسع',
  'العاشر',
  'الحادي عشر',
  'الثاني عشر',
  'الثالث عشر',
  'الرابع عشر',
  'الخامس عشر',
  'السادس عشر',
  'السابع عشر',
  'الثامن عشر',
  'التاسع عشر',
  'العشرون',
];

export const ArabicBranchLetters = [
  'أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ي', 'ك', 'ل', 'م', 'ن', 'س', 'ع', 'ف', 'ص', 'ق', 'ر', 'ش', 'ت', 'ث', 'خ', 'ذ', 'ض', 'ظ', 'غ'
];

export function getBranchLabel(index: number, isLtr: boolean): string {
  if (isLtr) {
    if (index >= 0 && index < 26) {
      return String.fromCharCode(65 + index);
    }
    return String(index + 1);
  }
  if (index >= 0 && index < ArabicBranchLetters.length) {
    return ArabicBranchLetters[index];
  }
  return String(index + 1);
}

export function getQuestionOrdinal(num: number): string {
  if (num >= 1 && num <= ArabicOrdinals.length) {
    return ArabicOrdinals[num - 1];
  }
  return `رقم ${num}`;
}

export function getCurrentAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const start = month >= 9 ? year : year - 1;
  return `${start}/${start + 1}`;
}

export function getAcademicYearSuggestions(): string[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const start = month >= 9 ? year : year - 1;
  return [
    `${start - 1}/${start}`,
    `${start}/${start + 1}`,
    `${start + 1}/${start + 2}`,
  ];
}

export const SchoolGenderLabels: Record<SchoolGender, { label: string; menuLabel: string }> = {
  boys: { label: 'للبنين', menuLabel: 'للبنين' },
  girls: { label: 'للبنات', menuLabel: 'للبنات' },
  none: { label: '', menuLabel: 'بدون' },
};

export const ExamSessionLabels: Record<ExamSession, { label: string; menuLabel: string }> = {
  first: { label: 'الدور الأول', menuLabel: 'الدور الأول' },
  second: { label: 'الدور الثاني', menuLabel: 'الدور الثاني' },
  third: { label: 'الدور الثالث', menuLabel: 'الدور الثالث' },
  none: { label: '', menuLabel: 'بدون دور' },
};

export const SignatureTitleLabels: Record<SignatureTitle, string> = {
  lecturer: 'مدرس المادة',
  educator: 'معلم المادة',
  lecturerFemale: 'مدرسة المادة',
  educatorFemale: 'معلمة المادة',
};

export const PointKindLabels: Record<PointKind, { label: string; hint: string }> = {
  plain: {
    label: 'نص حر',
    hint: 'اكتب نص النقطة هنا (يدعم المعادلات الرياضية)',
  },
  trueFalse: {
    label: 'صح أو خطأ',
    hint: 'اكتب العبارة فقط (يُضاف قوسا الإجابة تلقائياً)',
  },
  fillBlank: {
    label: 'إكمال الفراغ',
    hint: 'اكتب الجملة (يُضاف فراغ منقّط في آخرها إن لم تضع ___ بنفسك)',
  },
  multipleChoice: {
    label: 'اختيار من متعدد',
    hint: 'اكتب نص السؤال (تُكتب الخيارات تحته)',
  },
};

export const PaperFontMeta: Record<PaperFont, { label: string; family: string; cssClass: string }> = {
  naskh: { label: 'خط النسخ (Noto Naskh)', family: "'Noto Naskh Arabic', serif", cssClass: 'font-naskh' },
  amiri: { label: 'الخط القرآني (Amiri)', family: "'Amiri', serif", cssClass: 'font-amiri' },
  tajawal: { label: 'خط تجوال (Tajawal)', family: "'Tajawal', sans-serif", cssClass: 'font-tajawal' },
  rakkas: { label: 'خط الرقعة والعناوين (Rakkas)', family: "'Rakkas', cursive", cssClass: 'font-rakkas' },
  cairo: { label: 'خط كايرو (Cairo)', family: "'Cairo', sans-serif", cssClass: 'font-cairo' },
};
