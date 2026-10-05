import React from 'react';
import { BookOpen, Settings, ArrowRight, Save } from 'lucide-react';
import { ExamDocument } from '../types/exam';

interface NavbarProps {
  currentView: 'dashboard' | 'wizard';
  wizardStep?: 1 | 2 | 3;
  documentName?: string;
  onGoHome: () => void;
  onOpenSettings: () => void;
  onSetWizardStep?: (step: 1 | 2 | 3) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  wizardStep = 1,
  documentName,
  onGoHome,
  onOpenSettings,
  onSetWizardStep,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3 transition print:hidden">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Logo & View Navigation */}
        <div className="flex items-center gap-3">
          {currentView === 'wizard' ? (
            <button
              type="button"
              onClick={onGoHome}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl flex items-center gap-1.5 text-xs font-bold transition"
            >
              <ArrowRight className="w-4 h-4" />
              <span>الرئيسية</span>
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20 font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-black text-slate-900 leading-tight">
                  صانع ومحرر الأسئلة
                </h1>
                <span className="text-[10px] text-slate-500 font-medium block">
                  تحرير أوراق الامتحانات وتصدير PDF و Word
                </span>
              </div>
            </div>
          )}

          {/* Active document title in Wizard */}
          {currentView === 'wizard' && documentName && (
            <div className="hidden sm:flex items-center gap-2 border-r border-slate-200 pr-3">
              <span className="text-xs font-bold text-slate-800 truncate max-w-xs">
                {documentName}
              </span>
            </div>
          )}
        </div>

        {/* Wizard Steps Stepper */}
        {currentView === 'wizard' && onSetWizardStep && (
          <div className="hidden md:flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => onSetWizardStep(1)}
              className={`px-3 py-1.5 rounded-lg transition ${
                wizardStep === 1
                  ? 'bg-white text-blue-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. الترويسة والتذييل
            </button>
            <button
              type="button"
              onClick={() => onSetWizardStep(2)}
              className={`px-3 py-1.5 rounded-lg transition ${
                wizardStep === 2
                  ? 'bg-white text-blue-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2. إعداد الأسئلة
            </button>
            <button
              type="button"
              onClick={() => onSetWizardStep(3)}
              className={`px-3 py-1.5 rounded-lg transition ${
                wizardStep === 3
                  ? 'bg-white text-blue-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3. معاينة A4 والطباعة
            </button>
          </div>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
            title="الإعدادات والنسخ الاحتياطي"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
