import { ExamDocument } from '../types/exam';
import { createBlankBranch, createBlankBranchItem, createBlankOption, createNewExamDocument, generateId } from './formatters';

const STORAGE_KEY = 'writing_questions_exams_v1';
const LAST_OPEN_KEY = 'writing_questions_last_open_id';
const BACKUP_META_KEY = 'writing_questions_last_backup_meta';

export interface AppBackup {
  version: string;
  appVersion: string;
  createdAt: string;
  documentCount: number;
  totalQuestions: number;
  documents: ExamDocument[];
}

export interface RestorePlan {
  added: number;
  updated: number;
  kept: number;
  total: number;
  changesNothing: boolean;
}

export function createSampleExams(): ExamDocument[] {
  const now = new Date().toISOString();

  // 1. نموذج امتحان اللغة العربية الشامل
  const arabicExam: ExamDocument = {
    id: 'sample-arabic-exam',
    name: 'امتحان نصف السنة - اللغة العربية (الثالث المتوسط)',
    createdAt: now,
    updatedAt: now,
    settings: {
      autoNumberQuestions: true,
      autoLetterBranches: true,
      numerals: 'arabicIndic',
      questionLabelStyle: 'ordinal',
      showQuestionMarks: true,
      pageBorder: false,
      headerBorder: true,
      defaultFont: 'naskh',
      baseFontSize: 11,
      lineSpacing: 1.5,
      marginMm: 15,
    },
    header: {
      schoolName: 'ثانوية المتميزين النموذجية',
      schoolGender: 'boys',
      showBismillah: true,
      examType: 'نصف السنة',
      academicYear: '2026/2027',
      session: 'first',
      subject: 'اللغة العربية',
      grade: 'الثالث المتوسط',
      time: 'ساعتان',
    },
    footer: {
      closingPhrase: 'تمنياتنا لكم بالنجاح والتوفيق',
      primary: {
        title: 'lecturer',
        name: 'أ. أحمد الربيعي',
      },
      secondary: {
        title: 'lecturer',
        name: 'أ. حسين العلي',
      },
    },
    floatingElements: [],
    questions: [
      {
        id: 'q1',
        questionNumber: 1,
        category: 'القواعد',
        statement: 'قال تعالى: {وَقُلِ اعْمَلُوا فَسَيَرَى اللَّهُ عَمَلَكُمْ وَرَسُولُهُ وَالْمُؤْمِنُونَ}',
        body: 'اقرأ النص القرآني المبارك بتمعن، ثم أجب عن الفروع الآتية:',
        spacingAfter: 12,
        showFrame: false,
        items: [],
        attachments: [],
        branches: [
          {
            id: 'b1-1',
            marks: 10,
            attachments: [],
            content: {
              statement: 'زن الكلمات الآتية مبيناً حروف الزيادة فيها:',
              body: '',
              items: [
                {
                  id: 'item-1',
                  text: 'اعْمَلُوا: ............',
                  kind: 'plain',
                  options: [],
                  marks: 3,
                },
                {
                  id: 'item-2',
                  text: 'فَسَيَرَى: ............',
                  kind: 'plain',
                  options: [],
                  marks: 3,
                },
                {
                  id: 'item-3',
                  text: 'الْمُؤْمِنُونَ: ............',
                  kind: 'plain',
                  options: [],
                  marks: 4,
                },
              ],
            },
          },
          {
            id: 'b1-2',
            marks: 10,
            attachments: [],
            content: {
              statement: 'استخرج من النص اسماً مشتقاً وبيّن نوعه وبابه واذكر فعله الماضي:',
              body: '',
              items: [
                {
                  id: 'item-b2-1',
                  text: 'اسم الفاعل الوارد في الآية الكريمة هو ___ وفعله الماضي هو ___',
                  kind: 'fillBlank',
                  options: [],
                  marks: 5,
                },
                {
                  id: 'item-b2-2',
                  text: 'الفعل (رأى) فعل ثلاثي متعدٍ لمفعولين في النص المذكور',
                  kind: 'trueFalse',
                  options: [],
                  marks: 5,
                },
              ],
            },
          },
        ],
      },
      {
        id: 'q2',
        questionNumber: 2,
        category: 'الأدب والنصوص',
        statement: 'للشاعر أحمد شوقي قصيدة مشهورة في مدح النبي محمد ﷺ:',
        body: '',
        spacingAfter: 12,
        showFrame: false,
        items: [
          {
            id: 'q2-item-1',
            text: 'ما لقب الشاعر أحمد شوقي؟ وما عنوان قصيدته المقررة؟',
            kind: 'plain',
            options: [],
            marks: 5,
          },
          {
            id: 'q2-item-2',
            text: 'اكتب أربعة أبيات مضبوطة بالشكل تبدأ من مطلع القصيدة:',
            kind: 'fillBlank',
            options: [],
            marks: 10,
          },
          {
            id: 'q2-item-3',
            text: 'اختر الإجابة الصحيحة: ولد الشاعر أحمد شوقي في مدينة:',
            kind: 'multipleChoice',
            marks: 5,
            options: [
              { id: 'opt-1', text: 'بغداد' },
              { id: 'opt-2', text: 'القاهرة' },
              { id: 'opt-3', text: 'دمشق' },
              { id: 'opt-4', text: 'بيروت' },
            ],
          },
        ],
        branches: [],
        attachments: [],
      },
      {
        id: 'q3',
        questionNumber: 3,
        category: 'الإملاء والإنشاء',
        statement: 'اكتب في أحد الموضوعين الآتيين متوخياً فصاحة التعبير وسلامة الإملاء:',
        body: '1- حب الوطن والانتماء لترابه والدفاع عن مقدساته وأهله.\n2- العلم وسيلة الشعوب للرقي والازدهار ومحاربة الجهل والفقر.',
        marksOverride: 20,
        spacingAfter: 10,
        showFrame: false,
        items: [],
        branches: [],
        attachments: [],
      },
    ],
  };

  // 2. نموذج امتحان الرياضيات والمواد العلمية
  const mathExam: ExamDocument = {
    id: 'sample-math-exam',
    name: 'امتحان الرياضيات - الصف الثالث المتوسط',
    createdAt: now,
    updatedAt: now,
    settings: {
      autoNumberQuestions: true,
      autoLetterBranches: true,
      numerals: 'latin',
      questionLabelStyle: 'compact',
      showQuestionMarks: true,
      pageBorder: false,
      headerBorder: true,
      defaultFont: 'tajawal',
      baseFontSize: 11,
      lineSpacing: 1.6,
      marginMm: 15,
    },
    header: {
      schoolName: 'متوسطة بغداد للبنين',
      schoolGender: 'boys',
      showBismillah: true,
      examType: 'نصف السنة',
      academicYear: '2026/2027',
      session: 'first',
      subject: 'الرياضيات',
      grade: 'الثالث المتوسط',
      time: 'ساعتان',
    },
    footer: {
      closingPhrase: 'مع تمنياتنا لجميع الطلبة بالنجاح والتفوق',
      primary: {
        title: 'lecturer',
        name: 'أ. كنعان عبد المجيد',
      },
    },
    floatingElements: [],
    questions: [
      {
        id: 'mq1',
        questionNumber: 1,
        category: 'الجبر',
        statement: 'بسّط المقادير الجبرية والعددية الآتية بأبسط صورة:',
        body: '',
        spacingAfter: 12,
        showFrame: false,
        items: [],
        attachments: [],
        branches: [
          {
            id: 'mb1-1',
            marks: 10,
            attachments: [],
            content: {
              statement: 'بسّط المقدار الجبري التالي:',
              body: '',
              items: [
                {
                  id: 'm-it-1',
                  text: 'المقدار: $\\frac{x^2 - 4}{x^2 + 4x + 4} \\times \\frac{x + 2}{x - 2}$',
                  kind: 'plain',
                  options: [],
                  marks: 5,
                },
                {
                  id: 'm-it-2',
                  text: 'احسب قيمة: $\\sqrt{12} - \\sqrt{27} + \\sqrt{3}$',
                  kind: 'plain',
                  options: [],
                  marks: 5,
                },
              ],
            },
          },
          {
            id: 'mb1-2',
            marks: 10,
            attachments: [],
            content: {
              statement: 'حل المعادلة الآنية الآتية بطريقة الحذف أو التعويض:',
              body: '$2x + y = 7$\n$x - y = 2$',
              items: [],
            },
          },
        ],
      },
      {
        id: 'mq2',
        questionNumber: 2,
        category: 'المتتابعات والهندسة',
        statement: 'أجب عما يأتي بدقة:',
        body: '',
        spacingAfter: 10,
        showFrame: false,
        items: [
          {
            id: 'mq2-1',
            text: 'اختر الإجابة الصحيحة: أساس المتتابعة الحسابية $3, 7, 11, 15, \\dots$ هو:',
            kind: 'multipleChoice',
            marks: 5,
            options: [
              { id: 'mo-1', text: '$d = 2$' },
              { id: 'mo-2', text: '$d = 4$' },
              { id: 'mo-3', text: '$d = -4$' },
              { id: 'mo-4', text: '$d = 3$' },
            ],
          },
          {
            id: 'mq2-2',
            text: 'مجموعة حل المتباينة $|x + 3| \\le 5$ تمثل على خط الأعداد بالفترة المغلقة:',
            kind: 'fillBlank',
            options: [],
            marks: 5,
          },
        ],
        branches: [],
        attachments: [],
      },
    ],
  };

  return [arabicExam, mathExam];
}

export const StorageService = {
  getDocuments(): ExamDocument[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        const samples = createSampleExams();
        this.saveDocuments(samples);
        return samples;
      }
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      const samples = createSampleExams();
      this.saveDocuments(samples);
      return samples;
    } catch {
      const samples = createSampleExams();
      return samples;
    }
  },

  saveDocuments(documents: ExamDocument[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
    } catch (e) {
      console.error('Error saving documents to LocalStorage:', e);
    }
  },

  getDocumentById(id: string): ExamDocument | null {
    const list = this.getDocuments();
    return list.find((doc) => doc.id === id) || null;
  },

  saveDocument(doc: ExamDocument): void {
    const list = this.getDocuments();
    const index = list.findIndex((item) => item.id === doc.id);
    const updated = {
      ...doc,
      updatedAt: new Date().toISOString(),
    };
    if (index >= 0) {
      list[index] = updated;
    } else {
      list.unshift(updated);
    }
    this.saveDocuments(list);
    this.saveLastOpenDocumentId(doc.id);
  },

  deleteDocument(id: string): void {
    const list = this.getDocuments().filter((doc) => doc.id !== id);
    this.saveDocuments(list);
    if (this.getLastOpenDocumentId() === id) {
      this.saveLastOpenDocumentId(null);
    }
  },

  renameDocument(id: string, newName: string): ExamDocument | null {
    const list = this.getDocuments();
    const doc = list.find((d) => d.id === id);
    if (!doc) return null;
    doc.name = newName.trim();
    doc.updatedAt = new Date().toISOString();
    this.saveDocuments(list);
    return doc;
  },

  duplicateDocument(id: string): ExamDocument | null {
    const list = this.getDocuments();
    const doc = list.find((d) => d.id === id);
    if (!doc) return null;

    const copy: ExamDocument = {
      ...JSON.parse(JSON.stringify(doc)),
      id: generateId(),
      name: `${doc.name} (نسخة)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    // Re-generate question, branch, item, and option IDs
    copy.questions.forEach((q) => {
      q.id = generateId();
      q.items.forEach((item) => {
        item.id = generateId();
        item.options?.forEach((opt) => {
          opt.id = generateId();
        });
      });
      q.branches.forEach((b) => {
        b.id = generateId();
        b.content.items.forEach((item) => {
          item.id = generateId();
          item.options?.forEach((opt) => {
            opt.id = generateId();
          });
        });
      });
    });

    list.unshift(copy);
    this.saveDocuments(list);
    return copy;
  },

  getLastOpenDocumentId(): string | null {
    return localStorage.getItem(LAST_OPEN_KEY);
  },

  saveLastOpenDocumentId(id: string | null): void {
    if (id) {
      localStorage.setItem(LAST_OPEN_KEY, id);
    } else {
      localStorage.removeItem(LAST_OPEN_KEY);
    }
  },

  createBackup(): AppBackup {
    const docs = this.getDocuments();
    const totalQuestions = docs.reduce((sum, d) => sum + d.questions.length, 0);
    const backup: AppBackup = {
      version: '1.0',
      appVersion: '1.0.0',
      createdAt: new Date().toISOString(),
      documentCount: docs.length,
      totalQuestions,
      documents: docs,
    };
    try {
      localStorage.setItem(BACKUP_META_KEY, JSON.stringify({
        createdAt: backup.createdAt,
        documentCount: backup.documentCount,
      }));
    } catch {}
    return backup;
  },

  getLastBackupMeta(): { createdAt: string; documentCount: number } | null {
    try {
      const data = localStorage.getItem(BACKUP_META_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  planRestore(backup: AppBackup, mode: 'merge' | 'replace'): RestorePlan {
    const existing = this.getDocuments();
    const existingMap = new Map(existing.map((d) => [d.id, d]));

    let added = 0;
    let updated = 0;
    let kept = 0;

    if (mode === 'replace') {
      return {
        added: backup.documents.length,
        updated: 0,
        kept: 0,
        total: backup.documents.length,
        changesNothing: false,
      };
    }

    // Merge mode
    for (const doc of backup.documents) {
      if (!existingMap.has(doc.id)) {
        added++;
      } else {
        const current = existingMap.get(doc.id)!;
        if (new Date(doc.updatedAt).getTime() > new Date(current.updatedAt).getTime()) {
          updated++;
        }
      }
    }
    kept = existing.length - updated;
    const total = existing.length + added;
    const changesNothing = added === 0 && updated === 0;

    return {
      added,
      updated,
      kept,
      total,
      changesNothing,
    };
  },

  executeRestore(backup: AppBackup, mode: 'merge' | 'replace'): RestorePlan {
    const plan = this.planRestore(backup, mode);
    if (mode === 'replace') {
      this.saveDocuments(backup.documents);
    } else {
      const existing = this.getDocuments();
      const map = new Map(existing.map((d) => [d.id, d]));

      for (const doc of backup.documents) {
        if (!map.has(doc.id)) {
          map.set(doc.id, doc);
        } else {
          const current = map.get(doc.id)!;
          if (new Date(doc.updatedAt).getTime() > new Date(current.updatedAt).getTime()) {
            map.set(doc.id, doc);
          }
        }
      }
      this.saveDocuments(Array.from(map.values()));
    }
    return plan;
  },
};
