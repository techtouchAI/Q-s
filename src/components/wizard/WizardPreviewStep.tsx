import React, { useState, useRef, useEffect } from 'react';
import {
  ExamDocument,
  FloatingElement,
  FloatingShapeType,
  PaperAlign,
  PaperFont,
  PaperSettings,
} from '../../types/exam';
import {
  calculateQuestionMarks,
  calculateTotalExamMarks,
  formatDocNumber,
  formatMarks,
  generateId,
  getBranchDisplayLabel,
  getQuestionDisplayLabel,
} from '../../utils/formatters';
import {
  ExamCatalog,
  ExamSessionLabels,
  PaperFontMeta,
  SchoolGenderLabels,
  SignatureTitleLabels,
} from '../../types/catalog';
import {
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Lock,
  Unlock,
  Type,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignRight,
  AlignCenter,
  AlignLeft,
  AlignJustify,
  Image as ImageIcon,
  Shapes,
  FileDown,
  Printer,
  Save,
  Calculator,
  Square,
  Minus,
  Check,
  Edit3,
  Trash2,
  Move,
  ArrowRight,
} from 'lucide-react';
import { MathRenderer } from '../MathRenderer';
import { FormulaInserterModal } from '../FormulaInserterModal';
import { exportExamToDocx } from '../../utils/docxExport';

interface WizardPreviewStepProps {
  document: ExamDocument;
  onUpdate: (doc: ExamDocument) => void;
  onSave: () => void;
  onBackToQuestions: () => void;
}

export const WizardPreviewStep: React.FC<WizardPreviewStepProps> = ({
  document: doc,
  onUpdate,
  onSave,
  onBackToQuestions,
}) => {
  // History for Undo / Redo
  const [history, setHistory] = useState<ExamDocument[]>([doc]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Canvas View state
  const [zoom, setZoom] = useState(1.0);
  const [isLocked, setIsLocked] = useState(false);
  const [activeElementId, setActiveElementId] = useState<string | null>(null);

  // Formatting state
  const [selectedFont, setSelectedFont] = useState<PaperFont>(doc.settings.defaultFont);
  const [fontSize, setFontSize] = useState<number>(doc.settings.baseFontSize);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [alignment, setAlignment] = useState<PaperAlign>('right');
  const [textColor, setTextColor] = useState<string>('#000000');

  // Modals
  const [formulaModalOpen, setFormulaModalOpen] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const applyChange = (updated: ExamDocument) => {
    onUpdate(updated);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(updated);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      onUpdate(prev);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      onUpdate(next);
    }
  };

  const showNotification = (msg: string) => {
    setStatusNotification(msg);
    setTimeout(() => setStatusNotification(null), 3000);
  };

  // Export to Word (.docx)
  const handleExportWord = async () => {
    try {
      setIsExportingWord(true);
      const blob = await exportExamToDocx(doc);
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${doc.name}_ورقة_الامتحان.docx`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification('تم تصدير ملف Word بنجاح.');
    } catch (e) {
      console.error(e);
      showNotification('تعذر إنشاء ملف Word.');
    } finally {
      setIsExportingWord(false);
    }
  };

  // Print directly (Print to PDF via browser dialog with exact styling)
  const handlePrintPdf = () => {
    window.print();
  };

  // Add floating shape
  const handleAddShape = (shape: FloatingShapeType) => {
    const newEl: FloatingElement = {
      id: generateId(),
      type: shape === 'textBox' ? 'shape' : 'shape',
      shape,
      dx: 40,
      dy: 200,
      pageIndex: 0,
      width: shape === 'line' ? 200 : shape === 'textBox' ? 180 : 100,
      height: shape === 'line' ? 4 : shape === 'textBox' ? 70 : 80,
      label: shape === 'textBox' ? 'مربع نص للملاحظات' : '',
      strokeWidth: 2,
      rotationDegrees: 0,
      framed: shape === 'textBox',
    };
    applyChange({
      ...doc,
      floatingElements: [...doc.floatingElements, newEl],
    });
    setActiveElementId(newEl.id);
  };

  // Add floating image
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const bytes = event.target?.result as string;
      const newEl: FloatingElement = {
        id: generateId(),
        type: 'image',
        bytes,
        dx: 50,
        dy: 220,
        pageIndex: 0,
        width: 140,
        height: 120,
        label: '',
        strokeWidth: 1,
        rotationDegrees: 0,
      };
      applyChange({
        ...doc,
        floatingElements: [...doc.floatingElements, newEl],
      });
      setActiveElementId(newEl.id);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Add floating formula
  const handleInsertFormulaElement = (latex: string) => {
    const newEl: FloatingElement = {
      id: generateId(),
      type: 'formula',
      label: latex,
      dx: 60,
      dy: 250,
      pageIndex: 0,
      width: 150,
      height: 60,
      strokeWidth: 1,
      rotationDegrees: 0,
    };
    applyChange({
      ...doc,
      floatingElements: [...doc.floatingElements, newEl],
    });
    setActiveElementId(newEl.id);
  };

  const removeFloatingElement = (id: string) => {
    applyChange({
      ...doc,
      floatingElements: doc.floatingElements.filter((el) => el.id !== id),
    });
    setActiveElementId(null);
  };

  const updateFloatingElementPos = (id: string, dx: number, dy: number) => {
    applyChange({
      ...doc,
      floatingElements: doc.floatingElements.map((el) =>
        el.id === id ? { ...el, dx, dy } : el
      ),
    });
  };

  const fontClass = PaperFontMeta[selectedFont]?.cssClass || 'font-naskh';
  const totalMarks = calculateTotalExamMarks(doc);

  return (
    <div className="space-y-4 pb-20">
      {/* Top Floating Smart Toolbar */}
      <div className="sticky top-2 z-30 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-md p-2.5 flex flex-wrap items-center justify-between gap-2 print:hidden">
        {/* Left Section: Undo, Redo, Zoom, Lock */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={historyIndex === 0}
            onClick={handleUndo}
            className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition"
            title="تراجع"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={historyIndex === history.length - 1}
            onClick={handleRedo}
            className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition"
            title="إعادة"
          >
            <Redo className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-slate-200 mx-1" />

          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
            className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg"
            title="تصغير"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1.0)}
            className="text-xs font-bold text-slate-700 px-2 py-1 hover:bg-slate-100 rounded-lg"
            title="إعادة ضبط الحجم"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.6, z + 0.1))}
            className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg"
            title="تكبير"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsLocked(!isLocked)}
            className={`p-1.5 rounded-lg transition ${
              isLocked ? 'bg-amber-100 text-amber-800' : 'text-slate-700 hover:bg-slate-100'
            }`}
            title={isLocked ? 'القفل مفعل (السحب معطل)' : 'قفل السحب'}
          >
            {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
        </div>

        {/* Center Section: Typography & Styling */}
        <div className="flex items-center gap-1.5">
          {/* Font Selector */}
          <select
            value={selectedFont}
            onChange={(e) => {
              const font = e.target.value as PaperFont;
              setSelectedFont(font);
              applyChange({
                ...doc,
                settings: { ...doc.settings, defaultFont: font },
              });
            }}
            className="px-2 py-1 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg"
            title="نوع الخط"
          >
            {Object.entries(PaperFontMeta).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>

          {/* Font Size */}
          <select
            value={fontSize}
            onChange={(e) => {
              const sz = parseFloat(e.target.value);
              setFontSize(sz);
              applyChange({
                ...doc,
                settings: { ...doc.settings, baseFontSize: sz },
              });
            }}
            className="px-2 py-1 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg"
            title="حجم الخط"
          >
            {[9, 10, 10.5, 11, 12, 13, 14, 16].map((s) => (
              <option key={s} value={s}>
                {s} pt
              </option>
            ))}
          </select>

          {/* Bold, Italic, Underline */}
          <button
            type="button"
            onClick={() => setIsBold(!isBold)}
            className={`p-1.5 rounded-lg ${isBold ? 'bg-blue-100 text-blue-800' : 'hover:bg-slate-100 text-slate-700'}`}
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsItalic(!isItalic)}
            className={`p-1.5 rounded-lg ${isItalic ? 'bg-blue-100 text-blue-800' : 'hover:bg-slate-100 text-slate-700'}`}
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsUnderline(!isUnderline)}
            className={`p-1.5 rounded-lg ${isUnderline ? 'bg-blue-100 text-blue-800' : 'hover:bg-slate-100 text-slate-700'}`}
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-slate-200 mx-1" />

          {/* Color Picker */}
          <input
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
            className="w-7 h-7 p-0.5 rounded-md border border-slate-200 cursor-pointer"
            title="لون الخط"
          />
        </div>

        {/* Right Section: Insert Elements & Export Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Insert Image */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-1 text-xs"
            title="إدراج صورة"
          >
            <ImageIcon className="w-4 h-4" />
            <span className="hidden sm:inline">صورة</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />

          {/* Insert Shape Menu */}
          <div className="relative group">
            <button
              type="button"
              className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-1 text-xs"
            >
              <Shapes className="w-4 h-4" />
              <span className="hidden sm:inline">أشكال</span>
            </button>
            <div className="absolute left-0 mt-1 hidden group-hover:flex flex-col bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 z-50 min-w-32">
              <button
                type="button"
                onClick={() => handleAddShape('rectangle')}
                className="px-3 py-1.5 text-xs text-right hover:bg-blue-50 rounded-lg"
              >
                مستطيل
              </button>
              <button
                type="button"
                onClick={() => handleAddShape('circle')}
                className="px-3 py-1.5 text-xs text-right hover:bg-blue-50 rounded-lg"
              >
                دائرة
              </button>
              <button
                type="button"
                onClick={() => handleAddShape('triangle')}
                className="px-3 py-1.5 text-xs text-right hover:bg-blue-50 rounded-lg"
              >
                مثلث
              </button>
              <button
                type="button"
                onClick={() => handleAddShape('line')}
                className="px-3 py-1.5 text-xs text-right hover:bg-blue-50 rounded-lg"
              >
                خط مستقيم
              </button>
              <button
                type="button"
                onClick={() => handleAddShape('textBox')}
                className="px-3 py-1.5 text-xs text-right hover:bg-blue-50 rounded-lg font-bold text-blue-700"
              >
                مربع نص
              </button>
            </div>
          </div>

          {/* Insert Formula */}
          <button
            type="button"
            onClick={() => setFormulaModalOpen(true)}
            className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-1 text-xs"
            title="إدراج معادلة عائمة"
          >
            <Calculator className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">معادلة</span>
          </button>

          <div className="w-px h-5 bg-slate-200 mx-1" />

          {/* Save Button */}
          <button
            type="button"
            onClick={() => {
              onSave();
              showNotification('تم حفظ الورقة بنجاح.');
            }}
            className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1 transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>حفظ</span>
          </button>

          {/* Export to Word */}
          <button
            type="button"
            disabled={isExportingWord}
            onClick={handleExportWord}
            className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl flex items-center gap-1 transition"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Word</span>
          </button>

          {/* Print to PDF */}
          <button
            type="button"
            onClick={handlePrintPdf}
            className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs flex items-center gap-1 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة / PDF</span>
          </button>
        </div>
      </div>

      {statusNotification && (
        <div className="p-3 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md text-center max-w-sm mx-auto animate-bounce print:hidden">
          {statusNotification}
        </div>
      )}

      {/* Main A4 Canvas Container */}
      <div
        className="flex justify-center p-4 overflow-auto scrollbar-thin"
        style={{ minHeight: 'calc(100vh - 200px)' }}
      >
        {/* Printable Sheet (Simulating standard A4 sheet: 210mm x 297mm) */}
        <div
          id="printable-a4-sheet"
          className={`bg-white shadow-2xl transition-transform origin-top mx-auto relative ${fontClass} ${
            doc.settings.pageBorder ? 'border-4 border-slate-900' : 'border border-slate-300'
          }`}
          style={{
            width: '210mm',
            minHeight: '297mm',
            transform: `scale(${zoom})`,
            padding: `${doc.settings.marginMm}mm`,
            color: textColor,
            fontSize: `${fontSize}pt`,
            fontWeight: isBold ? 'bold' : 'normal',
            fontStyle: isItalic ? 'italic' : 'normal',
            textDecoration: isUnderline ? 'underline' : 'none',
          }}
        >
          {/* 3-Column Header Table */}
          <div
            className={`grid grid-cols-3 gap-2 p-3 text-xs mb-6 ${
              doc.settings.headerBorder ? 'border-2 border-slate-800' : 'border-b border-slate-300'
            }`}
          >
            {/* Right Column */}
            <div className="text-center flex flex-col justify-center space-y-0.5 border-l border-slate-200 pl-2">
              <div className="font-bold text-slate-700">{ExamCatalog.administrationLabel}</div>
              <div className="font-bold text-slate-900 text-sm">
                {doc.header.schoolName || 'مدرسة ....................'}
              </div>
              {SchoolGenderLabels[doc.header.schoolGender]?.label && (
                <div className="text-slate-600">{SchoolGenderLabels[doc.header.schoolGender].label}</div>
              )}
            </div>

            {/* Center Column */}
            <div className="text-center flex flex-col justify-center space-y-1">
              {doc.header.showBismillah && (
                <div className="font-amiri font-bold text-sm text-slate-800">{ExamCatalog.bismillah}</div>
              )}
              <div className="font-bold text-slate-900">
                {ExamCatalog.examTitlePrefix} {doc.header.examType || 'نصف السنة'}
              </div>
              <div className="text-slate-600 text-[11px]">
                {ExamCatalog.academicYearPrefix} {formatDocNumber(doc.header.academicYear || '2026/2027', doc)}
              </div>
              {ExamSessionLabels[doc.header.session]?.label && (
                <div className="text-slate-700 font-medium text-[11px]">{ExamSessionLabels[doc.header.session].label}</div>
              )}
            </div>

            {/* Left Column */}
            <div className="text-right flex flex-col justify-center space-y-1 border-r border-slate-200 pr-2 text-[11px]">
              <div>
                <span className="font-bold text-slate-800">{ExamCatalog.subjectLabel}</span>{' '}
                <span className="text-slate-700">{doc.header.subject || ExamCatalog.blankLine}</span>
              </div>
              <div>
                <span className="font-bold text-slate-800">{ExamCatalog.gradeLabel}</span>{' '}
                <span className="text-slate-700">{doc.header.grade || ExamCatalog.blankLine}</span>
              </div>
              <div>
                <span className="font-bold text-slate-800">{ExamCatalog.timeLabel}</span>{' '}
                <span className="text-slate-700">{doc.header.time || ExamCatalog.blankLine}</span>
              </div>
              <div>
                <span className="font-bold text-slate-800">{ExamCatalog.studentNameLabel}</span>{' '}
                <span className="text-slate-400">{ExamCatalog.blankLine}</span>
              </div>
            </div>
          </div>

          {/* Exam Questions Body */}
          <div className="space-y-6">
            {doc.questions.map((question, qIdx) => {
              const qMarks = calculateQuestionMarks(question);
              const qLabel = getQuestionDisplayLabel(question, doc);

              return (
                <div
                  key={question.id}
                  className={`space-y-2 ${
                    question.showFrame ? 'p-3 border-2 border-slate-800 rounded-lg' : ''
                  }`}
                  style={{ marginBottom: `${question.spacingAfter}px` }}
                >
                  {/* Category line */}
                  {question.category?.trim() && (
                    <div className="text-center my-2">
                      <span className="inline-block px-3 py-0.5 font-bold text-sm text-blue-900 border-b-2 border-blue-900">
                        [ {question.category.trim()} ]
                      </span>
                    </div>
                  )}

                  {/* Question Title & Statement */}
                  <div className="flex items-start justify-between gap-3 font-bold text-slate-900 leading-relaxed">
                    <div className="flex-1">
                      <span className="text-blue-900 ml-1.5">{qLabel}:</span>
                      <MathRenderer text={question.statement} />
                    </div>

                    {doc.settings.showQuestionMarks && qMarks > 0 && (
                      <span className="shrink-0 text-emerald-800 text-xs font-bold mr-2 whitespace-nowrap">
                        ({formatDocNumber(formatMarks(qMarks), doc)} درجة)
                      </span>
                    )}
                  </div>

                  {/* Question Body */}
                  {question.body?.trim() && (
                    <div className="text-xs leading-relaxed text-slate-800 pr-3">
                      <MathRenderer text={question.body.trim()} />
                    </div>
                  )}

                  {/* Direct Items / Points */}
                  {question.items.length > 0 && (
                    <div className="space-y-1.5 pr-4 pt-1 text-xs">
                      {question.items.map((item, iIdx) => {
                        const itemLabel = item.labelOverride || `${formatDocNumber(iIdx + 1, doc)}-`;
                        return (
                          <div key={item.id} className="space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 flex items-start gap-1.5">
                                <span className="font-bold text-slate-800 shrink-0">{itemLabel}</span>
                                <div>
                                  <MathRenderer text={item.text} />
                                  {item.kind === 'trueFalse' && (
                                    <span className="font-bold tracking-widest mr-2">{ExamCatalog.trueFalseSlot}</span>
                                  )}
                                  {item.kind === 'fillBlank' && !item.text.includes('___') && !item.text.includes('...') && (
                                    <span className="font-bold mr-2">{ExamCatalog.fillBlank}</span>
                                  )}
                                </div>
                              </div>

                              {doc.settings.showQuestionMarks && item.marks > 0 && (
                                <span className="text-[11px] text-emerald-700 font-semibold shrink-0">
                                  ({formatDocNumber(formatMarks(item.marks), doc)} درجة)
                                </span>
                              )}
                            </div>

                            {/* Multiple choice options */}
                            {item.kind === 'multipleChoice' && item.options?.length > 0 && (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pr-6 pt-1 text-[11px]">
                                {item.options.map((opt, oIdx) => (
                                  <div key={opt.id} className="flex items-center gap-1 text-slate-700">
                                    <span className="font-bold">
                                      {opt.labelOverride || `( ${['أ', 'ب', 'ج', 'د', 'هـ'][oIdx] || oIdx + 1} )`}
                                    </span>
                                    <MathRenderer text={opt.text} />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Question Branches */}
                  {question.branches.length > 0 && (
                    <div className="space-y-3 pr-3 pt-2">
                      {question.branches.map((branch, bIdx) => {
                        const bLabel = getBranchDisplayLabel(bIdx, branch, doc);
                        return (
                          <div key={branch.id} className="space-y-1 text-xs">
                            <div className="flex items-start justify-between gap-2 font-bold text-slate-800">
                              <div className="flex items-start gap-1.5">
                                <span className="text-blue-900 shrink-0">{bLabel})</span>
                                <MathRenderer text={branch.content.statement} />
                              </div>
                              {doc.settings.showQuestionMarks && branch.marks > 0 && (
                                <span className="text-[11px] text-emerald-700 font-semibold shrink-0">
                                  ({formatDocNumber(formatMarks(branch.marks), doc)} درجة)
                                </span>
                              )}
                            </div>

                            {branch.content.body?.trim() && (
                              <div className="pr-4 text-slate-700 text-[11px]">
                                <MathRenderer text={branch.content.body} />
                              </div>
                            )}

                            {/* Branch points */}
                            {branch.content.items.length > 0 && (
                              <div className="space-y-1 pr-4 pt-1">
                                {branch.content.items.map((bItem, biIdx) => (
                                  <div key={bItem.id} className="flex items-start justify-between gap-2 text-xs">
                                    <div className="flex items-start gap-1.5">
                                      <span className="font-bold text-slate-700 shrink-0">
                                        {bItem.labelOverride || `${formatDocNumber(biIdx + 1, doc)}-`}
                                      </span>
                                      <div>
                                        <MathRenderer text={bItem.text} />
                                        {bItem.kind === 'trueFalse' && (
                                          <span className="font-bold tracking-widest mr-2">
                                            {ExamCatalog.trueFalseSlot}
                                          </span>
                                        )}
                                        {bItem.kind === 'fillBlank' && !bItem.text.includes('___') && !bItem.text.includes('...') && (
                                          <span className="font-bold mr-2">{ExamCatalog.fillBlank}</span>
                                        )}
                                      </div>
                                    </div>
                                    {doc.settings.showQuestionMarks && bItem.marks > 0 && (
                                      <span className="text-[11px] text-emerald-700 font-semibold shrink-0">
                                        ({formatDocNumber(formatMarks(bItem.marks), doc)} درجة)
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Exam Footer (Printed at the end) */}
          <div className="mt-12 pt-6 border-t border-slate-300 text-xs">
            {doc.footer.closingPhrase && (
              <div className="text-center font-bold text-slate-900 mb-6 tracking-wide text-sm">
                *** {doc.footer.closingPhrase} ***
              </div>
            )}

            <div className="flex items-center justify-between px-8 text-xs font-bold text-slate-800">
              {/* Secondary Teacher (Right) */}
              <div className="text-right">
                {doc.footer.secondary && (
                  <>
                    <div>{SignatureTitleLabels[doc.footer.secondary.title] || 'مدرس المادة'}</div>
                    <div className="text-slate-600 mt-2">{doc.footer.secondary.name || '....................'}</div>
                  </>
                )}
              </div>

              {/* Primary Teacher (Left) */}
              <div className="text-left">
                <div>{SignatureTitleLabels[doc.footer.primary.title] || 'مدرس المادة'}</div>
                <div className="text-slate-600 mt-2">{doc.footer.primary.name || '....................'}</div>
              </div>
            </div>
          </div>

          {/* Floating Canvas Elements (Images, Shapes, Textboxes, Formulas) */}
          {doc.floatingElements.map((el) => {
            const isSelected = activeElementId === el.id;

            return (
              <div
                key={el.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveElementId(el.id);
                }}
                className={`absolute select-none cursor-move group ${
                  isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                }`}
                style={{
                  left: `${el.dx}px`,
                  top: `${el.dy}px`,
                  width: `${el.width}px`,
                  height: `${el.height}px`,
                }}
              >
                {/* Floating Image */}
                {el.type === 'image' && el.bytes && (
                  <img
                    src={el.bytes}
                    alt="floating asset"
                    className="w-full h-full object-contain pointer-events-none"
                  />
                )}

                {/* Floating Shapes */}
                {el.type === 'shape' && (
                  <div className="w-full h-full flex items-center justify-center pointer-events-none">
                    {el.shape === 'rectangle' && (
                      <div className="w-full h-full border-2 border-slate-800 rounded-sm bg-transparent" />
                    )}
                    {el.shape === 'circle' && (
                      <div className="w-full h-full border-2 border-slate-800 rounded-full bg-transparent" />
                    )}
                    {el.shape === 'triangle' && (
                      <div className="w-full h-full border-b-2 border-r-2 border-l-2 border-slate-800 rotate-45 transform" />
                    )}
                    {el.shape === 'line' && (
                      <div className="w-full h-0.5 bg-slate-900" />
                    )}
                    {el.shape === 'textBox' && (
                      <div className="w-full h-full border border-slate-400 bg-white/90 p-2 text-xs text-slate-800 shadow-xs overflow-hidden">
                        {el.label || 'مربع نص'}
                      </div>
                    )}
                  </div>
                )}

                {/* Floating Formula */}
                {el.type === 'formula' && (
                  <div className="w-full h-full flex items-center justify-center p-2 bg-white/90 border border-slate-200 rounded-lg shadow-xs pointer-events-none">
                    <MathRenderer text={el.label} />
                  </div>
                )}

                {/* Delete button on active selection */}
                {isSelected && !isLocked && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFloatingElement(el.id);
                    }}
                    className="absolute -top-3 -right-3 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-md text-xs"
                    title="حذف هذا العنصر"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Bottom Navigation Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 z-40 print:hidden">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBackToQuestions}
            className="px-5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة لإعداد الأسئلة (الخطوة 2)</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportWord}
              className="px-4 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl flex items-center gap-1.5 transition"
            >
              <FileDown className="w-4 h-4" />
              <span>تصدير ملف Word (.docx)</span>
            </button>
            <button
              type="button"
              onClick={handlePrintPdf}
              className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 transition active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة / حفظ كـ PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Visual Formula Inserter Modal */}
      <FormulaInserterModal
        isOpen={formulaModalOpen}
        onClose={() => setFormulaModalOpen(false)}
        onInsert={handleInsertFormulaElement}
      />
    </div>
  );
};
