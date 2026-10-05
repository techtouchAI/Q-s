import React, { useState } from 'react';
import { X, Check, Calculator, Sparkles } from 'lucide-react';
import { MathRenderer } from './MathRenderer';

interface FormulaInserterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (latex: string) => void;
  initialLatex?: string;
}

const TEMPLATES = [
  { name: 'كسر اعتيادي', latex: '\\frac{a}{b}', category: 'أساسي' },
  { name: 'جذر تربيعي', latex: '\\sqrt{x}', category: 'أساسي' },
  { name: 'جذر نوني', latex: '\\sqrt[n]{x}', category: 'أساسي' },
  { name: 'أس / قوة', latex: 'x^{2}', category: 'أساسي' },
  { name: 'دليل سفلي', latex: 'x_{1}', category: 'أساسي' },
  { name: 'قوسين دائريين', latex: '\\left( x + y \\right)', category: 'أقواس' },
  { name: 'قوسين معقوفين', latex: '\\left[ x \\right]', category: 'أقواس' },
  { name: 'قيمة مطلقة', latex: '\\left| x \\right|', category: 'أقواس' },
  { name: 'تكامل محدد', latex: '\\int_{a}^{b} f(x) \\, dx', category: 'تفاضل وتكامل' },
  { name: 'تكامل غير محدد', latex: '\\int f(x) \\, dx', category: 'تفاضل وتكامل' },
  { name: 'مجموع', latex: '\\sum_{i=1}^{n} x_i', category: 'تفاضل وتكامل' },
  { name: 'نهاية غاية', latex: '\\lim_{x \\to 0} \\frac{\\sin x}{x}', category: 'تفاضل وتكامل' },
  { name: 'مشتقة', latex: '\\frac{dy}{dx}', category: 'تفاضل وتكامل' },
  { name: 'متجه', latex: '\\vec{v}', category: 'فيزياء وهندسة' },
  { name: 'معادلة تربيعية', latex: 'ax^2 + bx + c = 0', category: 'جبر' },
  { name: 'القانون العام (الدستور)', latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}', category: 'جبر' },
  { name: 'متطابقة فيثاغورس', latex: '\\sin^2(\\theta) + \\cos^2(\\theta) = 1', category: 'مثلثات' },
];

const SYMBOLS = [
  { label: '×', latex: '\\times' },
  { label: '÷', latex: '\\div' },
  { label: '±', latex: '\\pm' },
  { label: '≤', latex: '\\le' },
  { label: '≥', latex: '\\ge' },
  { label: '≠', latex: '\\neq' },
  { label: '≈', latex: '\\approx' },
  { label: '∞', latex: '\\infty' },
  { label: 'π', latex: '\\pi' },
  { label: 'θ', latex: '\\theta' },
  { label: 'α', latex: '\\alpha' },
  { label: 'β', latex: '\\beta' },
  { label: 'γ', latex: '\\gamma' },
  { label: 'Δ', latex: '\\Delta' },
  { label: 'λ', latex: '\\lambda' },
  { label: 'μ', latex: '\\mu' },
  { label: 'σ', latex: '\\sigma' },
  { label: 'ω', latex: '\\omega' },
  { label: '→', latex: '\\to' },
  { label: '∈', latex: '\\in' },
  { label: '⊂', latex: '\\subset' },
  { label: '∪', latex: '\\cup' },
  { label: '∩', latex: '\\cap' },
  { label: '°', latex: '^\\circ' },
];

export const FormulaInserterModal: React.FC<FormulaInserterModalProps> = ({
  isOpen,
  onClose,
  onInsert,
  initialLatex = '',
}) => {
  const [latex, setLatex] = useState(initialLatex || '\\frac{x + 1}{2}');

  if (!isOpen) return null;

  const handleAppend = (snippet: string) => {
    setLatex((prev) => (prev ? `${prev} ${snippet}` : snippet));
  };

  const handleConfirm = () => {
    if (latex.trim()) {
      onInsert(`$${latex.trim()}$`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-700 font-bold text-lg">
            <Calculator className="w-5 h-5" />
            <span>محرر وصانع المعادلات والصيغ الرياضية</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Live Preview Box */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">المعاينة البصرية المباشرة:</label>
            <div className="min-h-24 bg-blue-50/50 rounded-xl border-2 border-blue-200 p-4 flex items-center justify-center text-xl text-slate-900 shadow-inner">
              {latex.trim() ? (
                <MathRenderer text={`$${latex}$`} className="text-2xl" />
              ) : (
                <span className="text-slate-400 text-sm">اكتب صيغة أو اختر قالباً من الأسفل لمعاينته هنا</span>
              )}
            </div>
          </div>

          {/* LaTeX Input Field */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-700">صيغة LaTeX الرياضية:</label>
              <button
                type="button"
                onClick={() => setLatex('')}
                className="text-xs text-red-500 hover:underline"
              >
                مسح الصيغة
              </button>
            </div>
            <textarea
              dir="ltr"
              value={latex}
              onChange={(e) => setLatex(e.target.value)}
              rows={2}
              className="w-full font-mono text-sm px-3 py-2 bg-slate-900 text-green-400 rounded-xl border border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. \frac{a}{b} + \sqrt{c}"
            />
          </div>

          {/* Quick Symbols Palette */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2">رموز وعمليات سريعة:</label>
            <div className="flex flex-wrap gap-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
              {SYMBOLS.map((sym) => (
                <button
                  key={sym.label}
                  type="button"
                  onClick={() => handleAppend(sym.latex)}
                  className="w-9 h-9 flex items-center justify-center font-bold text-slate-800 bg-white hover:bg-blue-600 hover:text-white rounded-lg border border-slate-200 shadow-xs transition active:scale-95 text-base"
                  title={sym.latex}
                >
                  {sym.label}
                </button>
              ))}
            </div>
          </div>

          {/* Templates Grid */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2">قوالب معادلات جاهزة شائعة:</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.name}
                  type="button"
                  onClick={() => setLatex(tmpl.latex)}
                  className="p-2.5 text-right bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition group"
                >
                  <div className="text-xs font-semibold text-slate-700 group-hover:text-blue-700">
                    {tmpl.name}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-1 truncate" dir="ltr">
                    {tmpl.latex}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition"
          >
            <Check className="w-4 h-4" />
            <span>إدراج في السؤال</span>
          </button>
        </div>
      </div>
    </div>
  );
};
