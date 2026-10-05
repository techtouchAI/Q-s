import {
  ExamDocument,
  ExamFooterModel,
  ExamHeaderModel,
  PaperSettings,
  QuestionModel,
  BranchModel,
  BranchItem,
  QuestionOption,
} from '../types/exam';
import {
  ArabicBranchLetters,
  ExamCatalog,
  getCurrentAcademicYear,
  getQuestionOrdinal,
  SubjectCatalog,
} from '../types/catalog';

export function toArabicIndicDigits(text: string | number): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(text).replace(/\d/g, (d) => arabicDigits[Number(d)]);
}

export function toLatinDigits(text: string | number): string {
  return String(text).replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

export function formatDocNumber(value: number | string, doc: ExamDocument): string {
  const isArabicIndic =
    doc.settings.numerals === 'arabicIndic' ||
    (doc.settings.numerals === 'auto' && doc.header.subject ? !SubjectCatalog.isEnglish(doc.header.subject) : true);

  const numStr = typeof value === 'number'
    ? value % 1 === 0 ? value.toFixed(0) : value.toString()
    : String(value);

  return isArabicIndic ? toArabicIndicDigits(numStr) : toLatinDigits(numStr);
}

export function formatMarks(marks: number): string {
  return marks % 1 === 0 ? marks.toFixed(0) : marks.toFixed(1);
}

export function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    const two = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}/${two(d.getMonth() + 1)}/${two(d.getDate())} ${two(d.getHours())}:${two(d.getMinutes())}`;
  } catch {
    return isoString;
  }
}

export function generateId(): string {
  return 'id-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
}

export function createBlankOption(text = ''): QuestionOption {
  return {
    id: generateId(),
    text,
  };
}

export function createBlankBranchItem(kind: BranchItem['kind'] = 'plain'): BranchItem {
  return {
    id: generateId(),
    text: '',
    kind,
    options: kind === 'multipleChoice' ? [createBlankOption(), createBlankOption(), createBlankOption(), createBlankOption()] : [],
    marks: 0,
  };
}

export function createBlankBranch(index = 0): BranchModel {
  return {
    id: generateId(),
    content: {
      statement: '',
      body: '',
      items: [],
    },
    marks: 0,
    attachments: [],
    showFrame: false,
  };
}

export function createBlankQuestion(questionNumber: number): QuestionModel {
  return {
    id: generateId(),
    questionNumber,
    statement: '',
    body: '',
    category: '',
    spacingAfter: 10,
    items: [],
    branches: [],
    attachments: [],
    showFrame: false,
  };
}

export function getDefaultPaperSettings(): PaperSettings {
  return {
    autoNumberQuestions: true,
    autoLetterBranches: true,
    numerals: 'auto',
    questionLabelStyle: 'ordinal',
    showQuestionMarks: true,
    pageBorder: false,
    headerBorder: true,
    defaultFont: 'naskh',
    baseFontSize: 10.5,
    lineSpacing: 1.45,
    marginMm: 15,
  };
}

export function getDefaultHeader(): ExamHeaderModel {
  return {
    schoolName: '',
    schoolGender: 'boys',
    showBismillah: true,
    examType: 'نصف السنة',
    academicYear: getCurrentAcademicYear(),
    session: 'first',
    subject: 'اللغة العربية',
    grade: '',
    time: '',
  };
}

export function getDefaultFooter(): ExamFooterModel {
  return {
    closingPhrase: ExamCatalog.defaultClosingPhrase,
    primary: {
      title: 'lecturer',
      name: '',
    },
  };
}

export function createNewExamDocument(name = 'ورقة امتحانية جديدة'): ExamDocument {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    name,
    header: getDefaultHeader(),
    footer: getDefaultFooter(),
    questions: [createBlankQuestion(1)],
    floatingElements: [],
    createdAt: now,
    updatedAt: now,
    settings: getDefaultPaperSettings(),
  };
}

export function getQuestionDisplayLabel(question: QuestionModel, doc: ExamDocument): string {
  if (question.numberOverride?.trim()) {
    return question.numberOverride.trim();
  }
  const isEnglish = SubjectCatalog.isEnglish(doc.header.subject);
  if (doc.settings.questionLabelStyle === 'compact') {
    if (isEnglish) return `Q${question.questionNumber}`;
    return `س${formatDocNumber(question.questionNumber, doc)}`;
  }
  if (isEnglish) return `Question ${question.questionNumber}`;
  return `السؤال ${getQuestionOrdinal(question.questionNumber)}`;
}

export function getBranchDisplayLabel(branchIndex: number, branch: BranchModel, doc: ExamDocument): string {
  if (branch.labelOverride?.trim()) {
    return branch.labelOverride.trim();
  }
  const isEnglish = SubjectCatalog.isEnglish(doc.header.subject);
  if (isEnglish) {
    return branchIndex < 26 ? String.fromCharCode(65 + branchIndex) : String(branchIndex + 1);
  }
  return branchIndex < ArabicBranchLetters.length ? ArabicBranchLetters[branchIndex] : String(branchIndex + 1);
}

export function calculateQuestionMarks(question: QuestionModel): number {
  if (question.marksOverride !== undefined && question.marksOverride !== null) {
    return question.marksOverride;
  }
  const branchesTotal = question.branches.reduce((sum, b) => sum + (b.marks || 0), 0);
  const itemsTotal = question.items.reduce((sum, item) => sum + (item.marks || 0), 0);
  return branchesTotal + itemsTotal;
}

export function calculateTotalExamMarks(doc: ExamDocument): number {
  return doc.questions.reduce((sum, q) => sum + calculateQuestionMarks(q), 0);
}
