import React, { useState } from 'react';
import { ExamDocument } from '../types/exam';
import {
  calculateQuestionMarks,
  calculateTotalExamMarks,
  formatDateTime,
  formatDocNumber,
  formatMarks,
} from '../utils/formatters';
import {
  FileText,
  Plus,
  History,
  FileDown,
  Printer,
  MoreVertical,
  Edit3,
  Copy,
  Trash2,
  Settings,
  Sparkles,
  BookOpen,
  HelpCircle,
} from 'lucide-react';
import { exportExamToDocx } from '../utils/docxExport';

interface DashboardProps {
  documents: ExamDocument[];
  lastOpenDoc: ExamDocument | null;
  onOpenExam: (doc: ExamDocument) => void;
  onCreateNew: () => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onOpenSettings: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  documents,
  lastOpenDoc,
  onOpenExam,
  onCreateNew,
  onDuplicate,
  onRename,
  onDelete,
  onOpenSettings,
}) => {
  const [busyDocId, setBusyDocId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // Rename Dialog
  const [renamingDoc, setRenamingDoc] = useState<ExamDocument | null>(null);
  const [renameText, setRenameText] = useState('');

  // Delete Confirm Dialog
  const [deletingDoc, setDeletingDoc] = useState<ExamDocument | null>(null);

  const handleExportWord = async (doc: ExamDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setBusyDocId(doc.id);
      const blob = await exportExamToDocx(doc);
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${doc.name}_ورقة_الامتحان.docx`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setBusyDocId(null);
    }
  };

  const handleOpenPrint = (doc: ExamDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenExam(doc);
  };

  const handleStartRename = (doc: ExamDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingDoc(doc);
    setRenameText(doc.name);
    setMenuOpenId(null);
  };

  const handleConfirmRename = () => {
    if (renamingDoc && renameText.trim()) {
      onRename(renamingDoc.id, renameText.trim());
      setRenamingDoc(null);
    }
  };

  const handleStartDelete = (doc: ExamDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingDoc(doc);
    setMenuOpenId(null);
  };

  const handleConfirmDelete = () => {
    if (deletingDoc) {
      onDelete(deletingDoc.id);
      setDeletingDoc(null);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner Dashboard Card */}
      <div className="bg-gradient-to-l from-blue-700 via-blue-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold text-blue-100">
            <BookOpen className="w-3.5 h-3.5" />
            <span>نظام إعداد أوراق الاختبارات والامتحانات المدرسية</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
            صانع ومحرر الأسئلة الامتحانية
          </h1>

          <p className="text-blue-100/90 text-xs sm:text-sm leading-relaxed">
            صمم الترويسة والأسئلة بفروعها ونقاطها، وحرر الورقة مباشرة على معاينة A4 بدقة متناهية، ثم صدّرها كملف PDF عالي الجودة أو ملف Word (.docx) قابل للتعديل.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onCreateNew}
              className="px-5 py-2.5 bg-white text-blue-800 hover:bg-blue-50 font-bold text-xs sm:text-sm rounded-xl shadow-lg flex items-center gap-2 transition active:scale-95"
            >
              <Plus className="w-4 h-4 text-blue-700" />
              <span>إنشاء ورقة أسئلة جديدة</span>
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              className="px-4 py-2.5 bg-white/15 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm rounded-xl border border-white/20 backdrop-blur-md flex items-center gap-1.5 transition"
            >
              <Settings className="w-4 h-4" />
              <span>النسخ الاحتياطي والإعدادات</span>
            </button>
          </div>
        </div>
      </div>

      {/* Resume Work Banner */}
      {lastOpenDoc && (
        <div
          onClick={() => onOpenExam(lastOpenDoc)}
          className="bg-amber-50/80 hover:bg-amber-100/80 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition shadow-xs group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-900">متابعة العمل على آخر ورقة</div>
              <div className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition">
                {lastOpenDoc.name}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {lastOpenDoc.questions.length} أسئلة • {lastOpenDoc.header.subject} • آخر تعديل: {formatDateTime(lastOpenDoc.updatedAt)}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="px-4 py-2 text-xs font-bold text-amber-900 bg-white group-hover:bg-amber-500 group-hover:text-white rounded-xl border border-amber-300 shadow-xs transition"
          >
            متابعة التحرير
          </button>
        </div>
      )}

      {/* Saved Documents Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>أوراق الأسئلة المحفوظة ({documents.length})</span>
          </h2>
        </div>

        {documents.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3 shadow-xs">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-slate-700">لم تنشئ أي ورقة أسئلة بعد</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              انقر على "إنشاء ورقة أسئلة جديدة" لبدء تصميم ورقتك الامتحانية الأولى بالمعالج المتسلسل.
            </p>
            <button
              type="button"
              onClick={onCreateNew}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition"
            >
              + إنشاء ورقة جديدة الآن
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {documents.map((doc) => {
              const totalBranches = doc.questions.reduce((sum, q) => sum + q.branches.length, 0);
              const marks = calculateTotalExamMarks(doc);
              const isBusy = busyDocId === doc.id;
              const isMenuOpen = menuOpenId === doc.id;

              return (
                <div
                  key={doc.id}
                  onClick={() => onOpenExam(doc)}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 hover:border-blue-400 hover:shadow-md transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-600 group-hover:text-white transition">
                      <FileText className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-blue-700 transition">
                        {doc.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">{doc.questions.length} سؤال</span>
                        <span>•</span>
                        <span>{totalBranches} فرع</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-bold">{formatDocNumber(formatMarks(marks), doc)} درجة</span>
                        <span>•</span>
                        <span className="text-blue-700 font-medium">{doc.header.subject || 'مادة عامة'}</span>
                        <span>•</span>
                        <span>آخر تعديل: {formatDateTime(doc.updatedAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-end gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={(e) => handleOpenPrint(doc, e)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-1 transition"
                      title="معاينة وطباعة الورقة كـ PDF"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-600" />
                      <span className="hidden md:inline">طباعة / PDF</span>
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={(e) => handleExportWord(doc, e)}
                      className="px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-1 transition"
                      title="تصدير كملف Word DOCX"
                    >
                      <FileDown className="w-3.5 h-3.5 text-blue-600" />
                      <span className="hidden md:inline">Word</span>
                    </button>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(isMenuOpen ? null : doc.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {isMenuOpen && (
                        <div className="absolute left-0 mt-1 w-44 bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 z-50 text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpenId(null);
                              onOpenExam(doc);
                            }}
                            className="w-full px-3 py-2 text-right hover:bg-blue-50 rounded-lg flex items-center gap-2 text-slate-700"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>فتح وتعديل</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              setMenuOpenId(null);
                              onDuplicate(doc.id);
                            }}
                            className="w-full px-3 py-2 text-right hover:bg-blue-50 rounded-lg flex items-center gap-2 text-slate-700"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>نسخ الورقة</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleStartRename(doc, e)}
                            className="w-full px-3 py-2 text-right hover:bg-blue-50 rounded-lg flex items-center gap-2 text-slate-700"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>إعادة تسمية</span>
                          </button>
                          <div className="my-1 border-t border-slate-100" />
                          <button
                            type="button"
                            onClick={(e) => handleStartDelete(doc, e)}
                            className="w-full px-3 py-2 text-right hover:bg-rose-50 rounded-lg flex items-center gap-2 text-rose-600 font-semibold"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف الورقة</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rename Dialog */}
      {renamingDoc && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">إعادة تسمية الورقة</h3>
            <input
              type="text"
              autoFocus
              value={renameText}
              onChange={(e) => setRenameText(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRenamingDoc(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmRename}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingDoc && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">تأكيد حذف الورقة</h3>
            <p className="text-xs text-slate-600">
              هل أنت متأكد من حذف النموذج "{deletingDoc.name}"؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingDoc(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
