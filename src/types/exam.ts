export type SchoolGender = 'boys' | 'girls' | 'none';
export type ExamSession = 'none' | 'first' | 'second' | 'third';
export type SignatureTitle = 'lecturer' | 'educator' | 'lecturerFemale' | 'educatorFemale';
export type PaperNumerals = 'auto' | 'arabicIndic' | 'latin';
export type QuestionLabelStyle = 'ordinal' | 'compact';
export type PaperFont = 'naskh' | 'amiri' | 'tajawal' | 'rakkas' | 'cairo';
export type PaperAlign = 'right' | 'center' | 'left' | 'justify';

export type PointKind = 'plain' | 'trueFalse' | 'fillBlank' | 'multipleChoice';

export type FloatingElementType = 'image' | 'shape' | 'formula';
export type FloatingShapeType =
  | 'rectangle'
  | 'square'
  | 'circle'
  | 'triangle'
  | 'line'
  | 'arrow'
  | 'textBox'
  | 'divider';

export interface PaperTextStyle {
  font?: PaperFont;
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: number | string;
  align?: PaperAlign;
  lineHeight?: number;
  paragraphSpacing?: number;
}

export interface PaperDivider {
  thickness?: number;
  color?: string;
  dashed?: boolean;
  spacingBefore?: number;
  spacingAfter?: number;
}

export interface QuestionOption {
  id: string;
  text: string;
  labelOverride?: string;
  align?: PaperAlign;
}

export interface BranchItem {
  id: string;
  text: string;
  kind: PointKind;
  options: QuestionOption[];
  marks: number;
  labelOverride?: string;
  align?: PaperAlign;
}

export interface FloatingElement {
  id: string;
  type: FloatingElementType;
  shape?: FloatingShapeType;
  bytes?: string; // base64 or object URL
  dx: number;
  dy: number;
  pageIndex: number;
  width: number;
  height: number;
  label: string;
  ownerQuestionId?: string;
  strokeWidth: number;
  rotationDegrees: number;
  textStyle?: PaperTextStyle;
  framed?: boolean;
}

export interface BranchContent {
  statement: string;
  body: string;
  items: BranchItem[];
}

export interface BranchModel {
  id: string;
  content: BranchContent;
  marks: number;
  attachments: FloatingElement[];
  style?: PaperTextStyle;
  showFrame?: boolean;
  dividerAfter?: PaperDivider;
  labelOverride?: string;
}

export interface QuestionModel {
  id: string;
  questionNumber: number;
  branches: BranchModel[];
  category: string;
  statement: string;
  body: string;
  marksOverride?: number;
  numberOverride?: string;
  spacingAfter: number;
  items: BranchItem[];
  attachments: FloatingElement[];
  style?: PaperTextStyle;
  titleColor?: number | string;
  showFrame?: boolean;
  dividerAfter?: PaperDivider;
  titleAlign?: PaperAlign;
  bodyAlign?: PaperAlign;
  categoryAlign?: PaperAlign;
}

export interface SignatureModel {
  title: SignatureTitle;
  name: string;
}

export interface ExamFooterModel {
  closingPhrase: string;
  primary: SignatureModel;
  secondary?: SignatureModel;
}

export interface PaperSettings {
  autoNumberQuestions: boolean;
  autoLetterBranches: boolean;
  numerals: PaperNumerals;
  questionLabelStyle: QuestionLabelStyle;
  showQuestionMarks: boolean;
  pageBorder: boolean;
  frameImagePath?: string;
  headerBorder: boolean;
  defaultFont: PaperFont;
  baseFontSize: number;
  lineSpacing: number;
  marginMm: number;
}

export interface ExamHeaderModel {
  schoolName: string;
  schoolGender: SchoolGender;
  showBismillah: boolean;
  examType: string;
  academicYear: string;
  session: ExamSession;
  subject: string;
  grade: string;
  time: string;
  style?: PaperTextStyle;
}

export interface ExamDocument {
  id: string;
  name: string;
  header: ExamHeaderModel;
  footer: ExamFooterModel;
  questions: QuestionModel[];
  floatingElements: FloatingElement[];
  createdAt: string;
  updatedAt: string;
  settings: PaperSettings;
}

export type SubjectLayoutTemplate = 'islamic' | 'arabic' | 'english' | 'scientific' | 'generic';
