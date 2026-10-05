import React, { useState } from 'react';
import {
  BranchItem,
  BranchModel,
  ExamDocument,
  PointKind,
  QuestionModel,
  QuestionOption,
} from '../../types/exam';
import {
  calculateQuestionMarks,
  calculateTotalExamMarks,
  createBlankBranch,
  createBlankBranchItem,
  createBlankOption,
  createBlankQuestion,
  formatDocNumber,
  formatMarks,
  getBranchDisplayLabel,
  getQuestionDisplayLabel,
} from '../../utils/formatters';
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  ChevronDown,
  ChevronUp,
  Copy,
  Plus,
  Trash2,
  Eye,
  CheckSquare,
  Sparkles,
} from 'lucide-react';
import { PointKindLabels, SubjectCatalog } from '../../types/catalog';
import { MathRenderer } from '../MathRenderer';
import { FormulaInserterModal } from '../FormulaInserterModal';

interface WizardQuestionStepProps {
  document: ExamDocument;
  onUpdate: (updatedDoc: ExamDocument) => void;
  onBack: () => void;
  onFinish: () => void;
}

export const WizardQuestionStep: React.FC<WizardQuestionStepProps> = ({
  document: doc,
  onUpdate,
  onBack,
  onFinish,
}) => {
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  // Multi-select state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());

  // Formula modal state
  const [formulaModalOpen, setFormulaModalOpen] = useState(false);
  const [formulaTarget, setFormulaTarget] = useState<{
    type: 'statement' | 'body' | 'item' | 'branchStatement' | 'branchBody' | 'branchItem';
    branchIndex?: number;
    itemIndex?: number;
  }>({ type: 'statement' });

  const questions = doc.questions;
  const currentQuestion = questions[activeQuestionIndex] || questions[0];

  const updateDocQuestions = (newQuestions: QuestionModel[]) => {
    // Re-number questions if auto-number is on
    const finalized = doc.settings.autoNumberQuestions
      ? newQuestions.map((q, idx) => ({ ...q, questionNumber: idx + 1 }))
      : newQuestions;

    onUpdate({
      ...doc,
      questions: finalized,
      updatedAt: new Date().toISOString(),
    });
  };

  const updateCurrentQuestion = (partial: Partial<QuestionModel>) => {
    const updated = [...questions];
    updated[activeQuestionIndex] = { ...currentQuestion, ...partial };
    updateDocQuestions(updated);
  };

  // Question navigation actions
  const handleAddQuestion = () => {
    const nextNum = questions.length + 1;
    const newQ = createBlankQuestion(nextNum);
    const updated = [...questions, newQ];
    updateDocQuestions(updated);
    setActiveQuestionIndex(updated.length - 1);
  };

  const handleDuplicateQuestion = (idx: number) => {
    const src = questions[idx];
    const copy: QuestionModel = JSON.parse(JSON.stringify(src));
    copy.id = 'q-' + Math.random().toString(36).substring(2, 9);
    copy.questionNumber = idx + 2;
    const updated = [...questions];
    updated.splice(idx + 1, 0, copy);
    updateDocQuestions(updated);
    setActiveQuestionIndex(idx + 1);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    const updated = questions.filter((_, i) => i !== idx);
    updateDocQuestions(updated);
    setActiveQuestionIndex(Math.max(0, idx - 1));
  };

  const handleMoveQuestion = (from: number, to: number) => {
    if (to < 0 || to >= questions.length) return;
    const updated = [...questions];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    updateDocQuestions(updated);
    setActiveQuestionIndex(to);
  };

  // Branch actions
  const handleAddBranch = () => {
    const newBranch = createBlankBranch(currentQuestion.branches.length);
    updateCurrentQuestion({
      branches: [...currentQuestion.branches, newBranch],
    });
  };

  const handleUpdateBranch = (bIdx: number, partial: Partial<BranchModel>) => {
    const branches = [...currentQuestion.branches];
    branches[bIdx] = { ...branches[bIdx], ...partial };
    updateCurrentQuestion({ branches });
  };

  const handleRemoveBranch = (bIdx: number) => {
    const branches = currentQuestion.branches.filter((_, i) => i !== bIdx);
    updateCurrentQuestion({ branches });
  };

  // Direct Items actions
  const handleAddItem = (kind: PointKind = 'plain') => {
    const newItem = createBlankBranchItem(kind);
    updateCurrentQuestion({
      items: [...currentQuestion.items, newItem],
    });
  };

  const handleUpdateItem = (itemIdx: number, partial: Partial<BranchItem>) => {
    const items = [...currentQuestion.items];
    items[itemIdx] = { ...items[itemIdx], ...partial };
    updateCurrentQuestion({ items });
  };

  const handleRemoveItem = (itemIdx: number) => {
    const items = currentQuestion.items.filter((_, i) => i !== itemIdx);
    updateCurrentQuestion({ items });
  };

  // Branch item actions
  const handleAddBranchItem = (bIdx: number, kind: PointKind = 'plain') => {
    const branches = [...currentQuestion.branches];
    const branch = branches[bIdx];
    const newItem = createBlankBranchItem(kind);
    branch.content = {
      ...branch.content,
      items: [...branch.content.items, newItem],
    };
    updateCurrentQuestion({ branches });
  };

  const handleUpdateBranchItem = (bIdx: number, itemIdx: number, partial: Partial<BranchItem>) => {
    const branches = [...currentQuestion.branches];
    const branch = branches[bIdx];
    const items = [...branch.content.items];
    items[itemIdx] = { ...items[itemIdx], ...partial };
    branch.content = { ...branch.content, items };
    updateCurrentQuestion({ branches });
  };

  const handleRemoveBranchItem = (bIdx: number, itemIdx: number) => {
    const branches = [...currentQuestion.branches];
    const branch = branches[bIdx];
    branch.content = {
      ...branch.content,
      items: branch.content.items.filter((_, i) => i !== itemIdx),
    };
    updateCurrentQuestion({ branches });
  };

  // Formula insertion dispatcher
  const handleOpenFormulaModal = (target: typeof formulaTarget) => {
    setFormulaTarget(target);
    setFormulaModalOpen(true);
  };

  const handleInsertFormula = (latex: string) => {
    if (formulaTarget.type === 'statement') {
      updateCurrentQuestion({
        statement: currentQuestion.statement ? `${currentQuestion.statement} ${latex}` : latex,
      });
    } else if (formulaTarget.type === 'body') {
      updateCurrentQuestion({
        body: currentQuestion.body ? `${currentQuestion.body} ${latex}` : latex,
      });
    } else if (formulaTarget.type === 'item' && formulaTarget.itemIndex !== undefined) {
      const item = currentQuestion.items[formulaTarget.itemIndex];
      handleUpdateItem(formulaTarget.itemIndex, {
        text: item.text ? `${item.text} ${latex}` : latex,
      });
    } else if (formulaTarget.type === 'branchStatement' && formulaTarget.branchIndex !== undefined) {
      const b = currentQuestion.branches[formulaTarget.branchIndex];
      handleUpdateBranch(formulaTarget.branchIndex, {
        content: {
          ...b.content,
          statement: b.content.statement ? `${b.content.statement} ${latex}` : latex,
        },
      });
    } else if (formulaTarget.type === 'branchBody' && formulaTarget.branchIndex !== undefined) {
      const b = currentQuestion.branches[formulaTarget.branchIndex];
      handleUpdateBranch(formulaTarget.branchIndex, {
        content: {
          ...b.content,
          body: b.content.body ? `${b.content.body} ${latex}` : latex,
        },
      });
    } else if (
      formulaTarget.type === 'branchItem' &&
      formulaTarget.branchIndex !== undefined &&
      formulaTarget.itemIndex !== undefined
    ) {
      const b = currentQuestion.branches[formulaTarget.branchIndex];
      const item = b.content.items[formulaTarget.itemIndex];
      handleUpdateBranchItem(formulaTarget.branchIndex, formulaTarget.itemIndex, {
        text: item.text ? `${item.text} ${latex}` : latex,
      });
    }
  };

  // Subject sections
  const template = SubjectCatalog.getLayoutTemplate(doc.header.subject);
  const sections = SubjectCatalog.getSectionsForTemplate(template);

  const qMarks = calculateQuestionMarks(currentQuestion);
  const totalExamMarks = calculateTotalExamMarks(doc);

  return (
    <div className="space-y-6 pb-28">
      {/* Top Question Navigation Bar / Strip */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">قائمة الأسئلة ({questions.length}):</span>
            {selectionMode && (
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                المحدد {selectedQuestionIds.size} من {questions.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (selectionMode) {
                  setSelectionMode(false);
                  setSelectedQuestionIds(new Set());
                } else {
                  setSelectionMode(true);
                }
              }}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-1 rounded-lg hover:bg-slate-100 transition"
            >
              {selectionMode ? 'إلغاء وضع التحديد' : 'وضع التحديد'}
            </button>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة سؤال جديد</span>
            </button>
          </div>
        </div>

        {/* Scrollable Questions List */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {questions.map((q, idx) => {
            const isActive = idx === activeQuestionIndex;
            const isSelected = selectedQuestionIds.has(q.id);
            const label = getQuestionDisplayLabel(q, doc);

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => {
                  if (selectionMode) {
                    const next = new Set(selectedQuestionIds);
                    if (next.has(q.id)) next.delete(q.id);
                    else next.add(q.id);
                    setSelectedQuestionIds(next);
                  } else {
                    setActiveQuestionIndex(idx);
                  }
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border shrink-0 transition flex items-center gap-1.5 ${
                  isActive && !selectionMode
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : isSelected
                    ? 'bg-blue-100 text-blue-900 border-blue-300 ring-2 ring-blue-300'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{label}</span>
                {q.branches.length > 0 && (
                  <span className="text-[10px] opacity-80">({q.branches.length} فروع)</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Question Editor Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
        {/* Question Header & Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>إعداد {getQuestionDisplayLabel(currentQuestion, doc)}</span>
            </h2>
            <div className="text-xs text-slate-500 mt-0.5">
              درجة السؤال: <strong className="text-blue-700 font-bold">{formatDocNumber(formatMarks(qMarks), doc)} درجة</strong> | مجموع درجات الامتحان:{' '}
              <strong className="text-emerald-700 font-bold">{formatDocNumber(formatMarks(totalExamMarks), doc)} درجة</strong>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              disabled={activeQuestionIndex === 0}
              onClick={() => handleMoveQuestion(activeQuestionIndex, activeQuestionIndex - 1)}
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg disabled:opacity-30"
              title="نقل السؤال لأعلى"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={activeQuestionIndex === questions.length - 1}
              onClick={() => handleMoveQuestion(activeQuestionIndex, activeQuestionIndex + 1)}
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg disabled:opacity-30"
              title="نقل السؤال لأسفل"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <button
              type="button"
              onClick={() => handleDuplicateQuestion(activeQuestionIndex)}
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg flex items-center gap-1"
              title="نسخ السؤال"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>نسخ</span>
            </button>
            {questions.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveQuestion(activeQuestionIndex)}
                className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg flex items-center gap-1"
                title="حذف السؤال"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف</span>
              </button>
            )}
          </div>
        </div>

        {/* Category & Custom Label Override */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">رقم/تسمية السؤال المخصصة (اختياري)</label>
            <input
              type="text"
              value={currentQuestion.numberOverride || ''}
              onChange={(e) => updateCurrentQuestion({ numberOverride: e.target.value })}
              placeholder="مثال: س١/ أو السؤال الأول/"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">قسم المادة (اختياري)</label>
            {sections.length > 0 ? (
              <select
                value={currentQuestion.category || ''}
                onChange={(e) => updateCurrentQuestion({ category: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
              >
                <option value="">بدون قسم</option>
                {sections.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={currentQuestion.category || ''}
                onChange={(e) => updateCurrentQuestion({ category: e.target.value })}
                placeholder="مثال: الجبر / الأحياء / القواعد..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">درجة السؤال الثابتة</label>
              <span className="text-[11px] text-slate-500">
                {currentQuestion.marksOverride !== undefined ? 'يدوي' : 'تلقائي (مجموع النقاط)'}
              </span>
            </div>
            <input
              type="number"
              min="0"
              step="0.5"
              value={currentQuestion.marksOverride ?? ''}
              onChange={(e) => {
                const val = e.target.value.trim();
                updateCurrentQuestion({ marksOverride: val === '' ? undefined : parseFloat(val) });
              }}
              placeholder="اتركه فارغاً للحساب التلقائي"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Question Statement (Supports embedded LaTeX) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-800">
              منطوق السؤال (العبارة الرئيسية) <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => handleOpenFormulaModal({ type: 'statement' })}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>إدراج معادلة رياضية</span>
            </button>
          </div>
          <textarea
            rows={2}
            value={currentQuestion.statement}
            onChange={(e) => updateCurrentQuestion({ statement: e.target.value })}
            placeholder="اكتب منطوق السؤال هنا... مثال: أجب عن الأسئلة الآتية أو احسب قيمة المقدار الآتي:"
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
          {currentQuestion.statement.includes('$') && (
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <span className="text-slate-500 block mb-1 font-semibold">المعاينة البصرية للمعادلات:</span>
              <MathRenderer text={currentQuestion.statement} />
            </div>
          )}
        </div>

        {/* Question Body (Optional Text/Paragraph) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700">
              نص السؤال أو الآية/القطعة (اختياري - يُحذف تلقائياً إن ترك فارغاً)
            </label>
            <button
              type="button"
              onClick={() => handleOpenFormulaModal({ type: 'body' })}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
            >
              <Calculator className="w-3 h-3" />
              <span>إدراج معادلة</span>
            </button>
          </div>
          <textarea
            rows={2}
            value={currentQuestion.body}
            onChange={(e) => updateCurrentQuestion({ body: e.target.value })}
            placeholder="مثال: نص قرآني، قطعة قراءة، بيت شعري، أو نص مسألة..."
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
          {currentQuestion.body.includes('$') && (
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <MathRenderer text={currentQuestion.body} />
            </div>
          )}
        </div>

        {/* Direct Question Points / Items (1-, 2-, 3-...) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <span>النقاط المباشرة للسؤال (١-، ٢-، ٣-...)</span>
              <span className="text-slate-400 font-normal">({currentQuestion.items.length})</span>
            </span>

            {/* Quick Add Menu */}
            <div className="flex items-center gap-1.5">
              {(['plain', 'trueFalse', 'fillBlank', 'multipleChoice'] as PointKind[]).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => handleAddItem(kind)}
                  className="px-2 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded-lg transition"
                >
                  + {PointKindLabels[kind].label}
                </button>
              ))}
            </div>
          </div>

          {currentQuestion.items.length === 0 ? (
            <div className="text-center py-4 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
              لا توجد نقاط مباشرة لهذا السؤال. أضف نقطة من الأزرار أعلاه، أو أضف فروعاً بالأسفل.
            </div>
          ) : (
            <div className="space-y-3">
              {currentQuestion.items.map((item, itemIdx) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3 transition"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-xs text-blue-700 shrink-0">
                      {item.labelOverride || `${formatDocNumber(itemIdx + 1, doc)}-`}
                    </span>

                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) => handleUpdateItem(itemIdx, { text: e.target.value })}
                        placeholder={PointKindLabels[item.kind].hint}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => handleOpenFormulaModal({ type: 'item', itemIndex: itemIdx })}
                        className="px-2 py-1 text-slate-600 hover:text-blue-700 border border-slate-200 bg-white rounded-lg"
                        title="إدراج معادلة رياضية"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 text-xs">
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={item.marks || ''}
                          onChange={(e) =>
                            handleUpdateItem(itemIdx, { marks: parseFloat(e.target.value) || 0 })
                          }
                          placeholder="درجة"
                          className="w-16 px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white text-center"
                        />
                        <span className="text-[11px] text-slate-500">درجة</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(itemIdx)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                        title="حذف النقطة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Multiple Choice Options List */}
                  {item.kind === 'multipleChoice' && (
                    <div className="pl-4 pr-6 pt-2 border-t border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                        <span>خيارات الإجابة:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const opts = [...item.options, createBlankOption()];
                            handleUpdateItem(itemIdx, { options: opts });
                          }}
                          className="text-blue-600 hover:underline flex items-center gap-0.5"
                        >
                          <Plus className="w-3 h-3" />
                          <span>إضافة خيار</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {item.options.map((opt, oIdx) => {
                          const optLetters = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];
                          return (
                            <div key={opt.id} className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-700 shrink-0">
                                ({optLetters[oIdx] || oIdx + 1})
                              </span>
                              <input
                                type="text"
                                value={opt.text}
                                onChange={(e) => {
                                  const opts = [...item.options];
                                  opts[oIdx] = { ...opt, text: e.target.value };
                                  handleUpdateItem(itemIdx, { options: opts });
                                }}
                                placeholder="نص الخيار..."
                                className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white"
                              />
                              {item.options.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const opts = item.options.filter((_, idx) => idx !== oIdx);
                                    handleUpdateItem(itemIdx, { options: opts });
                                  }}
                                  className="text-slate-400 hover:text-red-500 p-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Question Branches (أ، ب، ج...) */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 text-sm">
              فروع السؤال ({currentQuestion.branches.length} فروع):
            </span>
            <button
              type="button"
              onClick={handleAddBranch}
              className="text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة فرع جديد ({getBranchDisplayLabel(currentQuestion.branches.length, createBlankBranch(), doc)})</span>
            </button>
          </div>

          {currentQuestion.branches.map((branch, bIdx) => {
            const bLabel = getBranchDisplayLabel(bIdx, branch, doc);

            return (
              <div
                key={branch.id}
                className="p-5 rounded-2xl border-2 border-slate-200 bg-slate-50/60 space-y-4 shadow-xs"
              >
                {/* Branch Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                      {bLabel}
                    </span>
                    <span className="font-bold text-sm text-slate-800">فرع ({bLabel})</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      <span>درجة الفرع:</span>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={branch.marks || ''}
                        onChange={(e) =>
                          handleUpdateBranch(bIdx, { marks: parseFloat(e.target.value) || 0 })
                        }
                        placeholder="0"
                        className="w-16 px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white text-center font-bold"
                      />
                      <span className="text-slate-500">درجة</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveBranch(bIdx)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                      title="حذف هذا الفرع"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Branch Statement */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-semibold text-slate-700">منطوق الفرع</label>
                    <button
                      type="button"
                      onClick={() => handleOpenFormulaModal({ type: 'branchStatement', branchIndex: bIdx })}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Calculator className="w-3 h-3" />
                      <span>إدراج معادلة</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={branch.content.statement}
                    onChange={(e) =>
                      handleUpdateBranch(bIdx, {
                        content: { ...branch.content, statement: e.target.value },
                      })
                    }
                    placeholder="مثال: جد ناتج ما يأتي بأبسط صورة، أو أعرب ما تحته خط..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  {branch.content.statement.includes('$') && (
                    <div className="p-2 bg-white rounded-lg border border-slate-200 text-xs">
                      <MathRenderer text={branch.content.statement} />
                    </div>
                  )}
                </div>

                {/* Branch Body (Optional) */}
                <div className="space-y-1">
                  <input
                    type="text"
                    value={branch.content.body}
                    onChange={(e) =>
                      handleUpdateBranch(bIdx, {
                        content: { ...branch.content, body: e.target.value },
                      })
                    }
                    placeholder="نص إضافي للفرع (اختياري)..."
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                </div>

                {/* Branch Items / Points */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">نقاط الفرع ({branch.content.items.length}):</span>
                    <div className="flex items-center gap-1">
                      {(['plain', 'trueFalse', 'fillBlank', 'multipleChoice'] as PointKind[]).map((kind) => (
                        <button
                          key={kind}
                          type="button"
                          onClick={() => handleAddBranchItem(bIdx, kind)}
                          className="px-2 py-0.5 text-[11px] bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded-md transition"
                        >
                          + {PointKindLabels[kind].label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {branch.content.items.map((bItem, biIdx) => (
                    <div key={bItem.id} className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700">
                          {bItem.labelOverride || `${formatDocNumber(biIdx + 1, doc)}-`}
                        </span>
                        <input
                          type="text"
                          value={bItem.text}
                          onChange={(e) =>
                            handleUpdateBranchItem(bIdx, biIdx, { text: e.target.value })
                          }
                          placeholder={PointKindLabels[bItem.kind].hint}
                          className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenFormulaModal({
                              type: 'branchItem',
                              branchIndex: bIdx,
                              itemIndex: biIdx,
                            })
                          }
                          className="p-1 text-slate-500 hover:text-blue-600"
                          title="معادلة"
                        >
                          <Calculator className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={bItem.marks || ''}
                          onChange={(e) =>
                            handleUpdateBranchItem(bIdx, biIdx, { marks: parseFloat(e.target.value) || 0 })
                          }
                          placeholder="درجة"
                          className="w-14 px-1.5 py-1 text-xs text-center border border-slate-200 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveBranchItem(bIdx, biIdx)}
                          className="text-red-500 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {bItem.kind === 'multipleChoice' && (
                        <div className="pl-4 pr-6 pt-1 grid grid-cols-2 gap-2 text-xs">
                          {bItem.options.map((opt, oIdx) => (
                            <div key={opt.id} className="flex items-center gap-1">
                              <span className="text-[11px] font-bold text-slate-600">
                                ({['أ', 'ب', 'ج', 'د'][oIdx] || oIdx + 1})
                              </span>
                              <input
                                type="text"
                                value={opt.text}
                                onChange={(e) => {
                                  const opts = [...bItem.options];
                                  opts[oIdx] = { ...opt, text: e.target.value };
                                  handleUpdateBranchItem(bIdx, biIdx, { options: opts });
                                }}
                                placeholder="خيار..."
                                className="flex-1 px-2 py-0.5 text-xs border rounded-md"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Bottom Navigation Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={activeQuestionIndex === 0 ? onBack : () => setActiveQuestionIndex(activeQuestionIndex - 1)}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition"
          >
            <ArrowRight className="w-4 h-4" />
            <span>{activeQuestionIndex === 0 ? 'العودة للترويسة' : 'السؤال السابق'}</span>
          </button>

          <div className="flex items-center gap-3">
            {activeQuestionIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setActiveQuestionIndex(activeQuestionIndex + 1)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition"
              >
                <span>السؤال التالي</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة سؤال جديد</span>
              </button>
            )}

            <button
              type="button"
              onClick={onFinish}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition active:scale-95"
            >
              <Eye className="w-4 h-4" />
              <span>إنهاء وعرض المعاينة A4</span>
            </button>
          </div>
        </div>
      </div>

      {/* Visual Formula Inserter Modal */}
      <FormulaInserterModal
        isOpen={formulaModalOpen}
        onClose={() => setFormulaModalOpen(false)}
        onInsert={handleInsertFormula}
      />
    </div>
  );
};
