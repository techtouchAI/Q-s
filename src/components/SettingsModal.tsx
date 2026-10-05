import React, { useState, useRef } from 'react';
import { X, Download, Upload, ShieldCheck, Database, Info, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { AppBackup, RestorePlan, StorageService } from '../utils/storage';
import { formatDateTime } from '../utils/formatters';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreCompleted: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onRestoreCompleted }) => {
  const [lastBackup, setLastBackup] = useState(() => StorageService.getLastBackupMeta());
  const [docCount] = useState(() => StorageService.getDocuments().length);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Restore flow states
  const [pendingBackup, setPendingBackup] = useState<AppBackup | null>(null);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
  const [restorePlan, setRestorePlan] = useState<RestorePlan | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportBackup = () => {
    try {
      const backup = StorageService.createBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = `نسخة_احتياطية_أوراق_الأسئلة_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setLastBackup({
        createdAt: backup.createdAt,
        documentCount: backup.documentCount,
      });
      setStatusMessage('تم تنزيل النسخة الاحتياطية بنجاح.');
      setErrorMessage(null);
    } catch {
      setErrorMessage('تعذر إنشاء ملف النسخة الاحتياطية.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text) as AppBackup;
        if (!parsed.documents || !Array.isArray(parsed.documents)) {
          throw new Error('ملف غير صالح');
        }
        setPendingBackup(parsed);
        setRestorePlan(StorageService.planRestore(parsed, restoreMode));
        setErrorMessage(null);
      } catch {
        setErrorMessage('الملف المحدد ليس نسخة احتياطية صالحة لتطبيق صانع الأسئلة.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleModeChange = (mode: 'merge' | 'replace') => {
    setRestoreMode(mode);
    if (pendingBackup) {
      setRestorePlan(StorageService.planRestore(pendingBackup, mode));
    }
  };

  const handleConfirmRestore = () => {
    if (!pendingBackup) return;
    try {
      const outcome = StorageService.executeRestore(pendingBackup, restoreMode);
      setStatusMessage(
        `تمت الاستعادة بنجاح: أُضيفت ${outcome.added} ورقة، وحُدّثت ${outcome.updated}، وبقيت ${outcome.kept}، فصار في المكتبة ${outcome.total} ورقة.`
      );
      setPendingBackup(null);
      setRestorePlan(null);
      onRestoreCompleted();
    } catch {
      setErrorMessage('حدث خطأ أثناء استعادة البيانات.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
            <Database className="w-5 h-5 text-blue-600" />
            <span>الإعدادات والنسخ الاحتياطي</span>
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
          {statusMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Pending Restore Preview Flow */}
          {pendingBackup && restorePlan && (
            <div className="p-5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-4">
              <h4 className="font-bold text-blue-900 text-base flex items-center gap-2">
                <Upload className="w-4 h-4" />
                <span>معاينة استعادة النسخة الاحتياطية</span>
              </h4>

              <div className="text-xs text-slate-600 space-y-1">
                <p>تاريخ النسخة: <strong className="text-slate-800">{formatDateTime(pendingBackup.createdAt)}</strong></p>
                <p>المحتوى: <strong className="text-slate-800">{pendingBackup.documentCount} ورقة امتحانية</strong> ({pendingBackup.totalQuestions} سؤالاً)</p>
              </div>

              {/* Mode Options */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-700 block">اختر أسلوب الاستعادة:</label>
                <div
                  onClick={() => handleModeChange('merge')}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2 ${
                    restoreMode === 'merge' ? 'bg-white border-blue-500 ring-2 ring-blue-200' : 'bg-white/60 border-slate-200 hover:bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="restoreMode"
                    checked={restoreMode === 'merge'}
                    onChange={() => handleModeChange('merge')}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-bold text-xs text-slate-900">دمج ذكي (مُوصى به)</div>
                    <div className="text-[11px] text-slate-500">يضيف الأوراق الجديدة ويحدّث المعدّلة ويُبقي أوراقك الحالية دون حذف.</div>
                  </div>
                </div>

                <div
                  onClick={() => handleModeChange('replace')}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2 ${
                    restoreMode === 'replace' ? 'bg-white border-blue-500 ring-2 ring-blue-200' : 'bg-white/60 border-slate-200 hover:bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="restoreMode"
                    checked={restoreMode === 'replace'}
                    onChange={() => handleModeChange('replace')}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-bold text-xs text-slate-900">استبدال كامل للمكتبة</div>
                    <div className="text-[11px] text-slate-500">يحذف الأوراق الموجودة حالياً ويضع محتويات النسخة فقط.</div>
                  </div>
                </div>
              </div>

              {/* Impact Summary */}
              <div className="p-3 bg-white rounded-xl border border-blue-200 text-xs text-slate-700 font-medium">
                الأثر على المكتبة: تُضاف <strong>{restorePlan.added}</strong> ورقة، وتُحدَّث <strong>{restorePlan.updated}</strong>،
                {restoreMode === 'replace' ? ' (استبدال شامل)' : ` وتبقى ${restorePlan.kept} ورقة،`} فتصبح المكتبة <strong>{restorePlan.total}</strong> ورقة.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setPendingBackup(null); setRestorePlan(null); }}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg transition"
                >
                  إلغاء الاستعادة
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRestore}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
                >
                  تأكيد وتطبيق الاستعادة
                </button>
              </div>
            </div>
          )}

          {/* Backup Section */}
          <div className="border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">نسخة كاملة من مكتبة الأوراق</h4>
                <p className="text-xs text-slate-500">تصدير أو استيراد ملف يحوي كافة الأوراق والأسئلة والفروع والمعادلات والإعدادات.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 flex items-center justify-between">
              <span>آخر نسخة احتياطية:</span>
              <strong className="text-slate-800">
                {lastBackup ? `${formatDateTime(lastBackup.createdAt)} (${lastBackup.documentCount} ورقة)` : 'لم تنشئ نسخة بعد'}
              </strong>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleExportBackup}
                className="flex-1 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                <span>إنشاء وتنزيل نسخة احتياطية</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 flex items-center justify-center gap-2 transition"
              >
                <Upload className="w-4 h-4" />
                <span>استعادة من ملف JSON</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>

          {/* Info Section */}
          <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden text-xs">
            <div className="p-4 flex items-center gap-3">
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="flex-1">
                <div className="font-bold text-slate-700">إصدار التطبيق</div>
                <div className="text-slate-500">1.0.0 (نسخة الويب الكاملة)</div>
              </div>
            </div>
            <div className="p-4 flex items-center gap-3">
              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="flex-1">
                <div className="font-bold text-slate-700">أوراق المكتبة الحالية</div>
                <div className="text-slate-500">{docCount} ورقة محفوظة على هذا المتصفح</div>
              </div>
            </div>
            <div className="p-4 flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="flex-1">
                <div className="font-bold text-slate-700">الخصوصية والأمان</div>
                <div className="text-slate-500">
                  كافة أوراقك الامتحانية تُحفظ محلياً على جهازك؛ لا يتم إرسال أي بيانات دراسية أو أسئلة إلى خوادم خارجية.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-xl transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
