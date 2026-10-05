import React, { useState } from 'react';
import { ExamDocument, ExamFooterModel, ExamHeaderModel, PaperFont, PaperSettings, SchoolGender, ExamSession, SignatureTitle } from '../../types/exam';
import {
  ExamCatalog,
  ExamSessionLabels,
  PaperFontMeta,
  SchoolGenderLabels,
  SignatureTitleLabels,
  SubjectCatalog,
  getAcademicYearSuggestions,
} from '../../types/catalog';
import { Palette, Eye, ArrowLeft, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { formatDocNumber } from '../../utils/formatters';

interface WizardHeaderStepProps {
  document: ExamDocument;
  onUpdate: (updatedDoc: ExamDocument) => void;
  onNext: () => void;
}

export const WizardHeaderStep: React.FC<WizardHeaderStepProps> = ({
  document: doc,
  onUpdate,
  onNext,
}) => {
  const [header, setHeader] = useState<ExamHeaderModel>(doc.header);
  const [footer, setFooter] = useState<ExamFooterModel>(doc.footer);
  const [settings, setSettings] = useState<PaperSettings>(doc.settings);
  const [name, setName] = useState<string>(doc.name);
  const [customSubject, setCustomSubject] = useState(
    header.subject && !SubjectCatalog.knownSubjects.includes(header.subject)
  );

  const updateDoc = (
    nextHeader = header,
    nextFooter = footer,
    nextSettings = settings,
    nextName = name
  ) => {
    onUpdate({
      ...doc,
      name: nextName,
      header: nextHeader,
      footer: nextFooter,
      settings: nextSettings,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleHeaderChange = (partial: Partial<ExamHeaderModel>) => {
    const updated = { ...header, ...partial };
    setHeader(updated);
    updateDoc(updated, footer, settings, name);
  };

  const handleFooterChange = (partial: Partial<ExamFooterModel>) => {
    const updated = { ...footer, ...partial };
    setFooter(updated);
    updateDoc(header, updated, settings, name);
  };

  const handleSettingsChange = (partial: Partial<PaperSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    updateDoc(header, footer, updated, name);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    updateDoc(header, footer, settings, val);
  };

  const template = SubjectCatalog.getLayoutTemplate(header.subject);

  return (
    <div className="space-y-6 pb-24">
      {/* Document Name */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-2">
        <label className="block text-sm font-bold text-slate-800">
          اسم ورقة الامتحان (للتنظيم داخل التطبيق) <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="مثال: امتحان نصف السنة - اللغة العربية (الثالث المتوسط)"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-sm"
        />
      </div>

      {/* 3-Column Header Forms */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Right Column: School */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-blue-700 font-bold text-sm">
            <span>يمين الورقة: المدرسة</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">اسم المدرسة</label>
            <input
              type="text"
              value={header.schoolName}
              onChange={(e) => handleHeaderChange({ schoolName: e.target.value })}
              placeholder="مثال: ثانوية المتميزين النموذجية"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">جنس المدرسة (السطر الثالث)</label>
            <select
              value={header.schoolGender}
              onChange={(e) => handleHeaderChange({ schoolGender: e.target.value as SchoolGender })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
            >
              {Object.entries(SchoolGenderLabels).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.menuLabel}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center Column: Exam & Year */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-blue-700 font-bold text-sm">
            <span>وسط الورقة: تفاصيل الامتحان</span>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-normal text-slate-600">
              <input
                type="checkbox"
                checked={header.showBismillah}
                onChange={(e) => handleHeaderChange({ showBismillah: e.target.checked })}
                className="rounded-sm text-blue-600"
              />
              <span>إظهار البسملة</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">نوع الامتحان</label>
            <input
              type="text"
              list="examTypeSuggestions"
              value={header.examType}
              onChange={(e) => handleHeaderChange({ examType: e.target.value })}
              placeholder="مثال: نصف السنة"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
            <datalist id="examTypeSuggestions">
              {ExamCatalog.examTypeSuggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">العام الدراسي</label>
            <input
              type="text"
              list="yearSuggestions"
              value={header.academicYear}
              onChange={(e) => handleHeaderChange({ academicYear: e.target.value })}
              placeholder="مثال: 2026/2027"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
            <datalist id="yearSuggestions">
              {getAcademicYearSuggestions().map((y) => (
                <option key={y} value={y} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">الدور الامتحاني</label>
            <select
              value={header.session}
              onChange={(e) => handleHeaderChange({ session: e.target.value as ExamSession })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
            >
              {Object.entries(ExamSessionLabels).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.menuLabel}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Left Column: Subject, Grade, Time */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-blue-700 font-bold text-sm">
            <span>يسار الورقة: المادة والصف</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">المادة</label>
            {!customSubject ? (
              <select
                value={SubjectCatalog.knownSubjects.includes(header.subject) ? header.subject : '__custom__'}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setCustomSubject(true);
                    handleHeaderChange({ subject: '' });
                  } else {
                    handleHeaderChange({ subject: e.target.value });
                  }
                }}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
              >
                {SubjectCatalog.knownSubjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
                <option value="__custom__">مادة أخرى (إدخال يدوي)...</option>
              </select>
            ) : (
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={header.subject}
                  onChange={(e) => handleHeaderChange({ subject: e.target.value })}
                  placeholder="أدخل اسم المادة..."
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCustomSubject(false);
                    handleHeaderChange({ subject: SubjectCatalog.knownSubjects[0] });
                  }}
                  className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800 border rounded-lg"
                >
                  قائمة
                </button>
              </div>
            )}
            <div className="text-[11px] text-blue-600 font-medium mt-1">
              قالب التنسيق: {template === 'english' ? 'English (LTR)' : template === 'islamic' ? 'التربية الإسلامية' : template === 'arabic' ? 'اللغة العربية' : template === 'scientific' ? 'المواد العلمية' : 'القالب العام'}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">الصف</label>
            <input
              type="text"
              value={header.grade}
              onChange={(e) => handleHeaderChange({ grade: e.target.value })}
              placeholder="مثال: الثالث المتوسط"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">الوقت</label>
            <input
              type="text"
              list="timeSuggestions"
              value={header.time}
              onChange={(e) => handleHeaderChange({ time: e.target.value })}
              placeholder="مثال: ساعتان"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
            <datalist id="timeSuggestions">
              {ExamCatalog.timeSuggestions.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>
        </div>
      </div>

      {/* Footer Settings Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-800 text-sm pb-2 border-b border-slate-100 flex items-center gap-2">
          <span>تذييل ورقة الامتحان (أسفل الصفحة الأخيرة)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">العبارة الختامية (في الوسط)</label>
            <select
              value={footer.closingPhrase}
              onChange={(e) => handleFooterChange({ closingPhrase: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
            >
              {ExamCatalog.closingPhrases.map((phrase) => (
                <option key={phrase} value={phrase}>
                  {phrase}
                </option>
              ))}
              <option value="">بدون عبارة ختامية</option>
            </select>
          </div>

          {/* Primary Teacher Signature */}
          <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-700 block">التوقيع الأساسي (يسار الورقة)</span>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={footer.primary.title}
                onChange={(e) =>
                  handleFooterChange({
                    primary: { ...footer.primary, title: e.target.value as SignatureTitle },
                  })
                }
                className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
              >
                {Object.entries(SignatureTitleLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={footer.primary.name}
                onChange={(e) =>
                  handleFooterChange({
                    primary: { ...footer.primary, name: e.target.value },
                  })
                }
                placeholder="اسم المدرس..."
                className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
              />
            </div>
          </div>

          {/* Secondary Teacher Signature (Optional) */}
          <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">توقيع المدرس الثاني (يمين الورقة)</span>
              {footer.secondary ? (
                <button
                  type="button"
                  onClick={() => handleFooterChange({ secondary: undefined })}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>إزالة</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    handleFooterChange({
                      secondary: { title: 'lecturer', name: '' },
                    })
                  }
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة مدرس ثانٍ</span>
                </button>
              )}
            </div>

            {footer.secondary && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <select
                  value={footer.secondary.title}
                  onChange={(e) =>
                    handleFooterChange({
                      secondary: { ...footer.secondary!, title: e.target.value as SignatureTitle },
                    })
                  }
                  className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                >
                  {Object.entries(SignatureTitleLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={footer.secondary.name}
                  onChange={(e) =>
                    handleFooterChange({
                      secondary: { ...footer.secondary!, name: e.target.value },
                    })
                  }
                  placeholder="اسم المدرس الثاني..."
                  className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Typography & Design Settings */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-sm text-slate-800">
          <Palette className="w-4 h-4 text-blue-600" />
          <span>تصميم وخطوط ورقة الامتحان</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">الخط الافتراضي للورقة</label>
            <select
              value={settings.defaultFont}
              onChange={(e) => handleSettingsChange({ defaultFont: e.target.value as PaperFont })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
            >
              {Object.entries(PaperFontMeta).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">حجم الخط الأساسي ({settings.baseFontSize} pt)</label>
            <input
              type="range"
              min="9"
              max="16"
              step="0.5"
              value={settings.baseFontSize}
              onChange={(e) => handleSettingsChange({ baseFontSize: parseFloat(e.target.value) })}
              className="w-full mt-2"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">نسق الأرقام</label>
            <select
              value={settings.numerals}
              onChange={(e) => handleSettingsChange({ numerals: e.target.value as any })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
            >
              <option value="auto">تلقائي حسب المادة</option>
              <option value="arabicIndic">أرقام عربية مشرقية (١٢٣)</option>
              <option value="latin">أرقام لاتينية (123)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">إطارات الترويسة والصفحة</label>
            <div className="space-y-1.5 pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.headerBorder}
                  onChange={(e) => handleSettingsChange({ headerBorder: e.target.checked })}
                  className="rounded-sm text-blue-600"
                />
                <span>إطار جدول الترويسة</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.pageBorder}
                  onChange={(e) => handleSettingsChange({ pageBorder: e.target.checked })}
                  className="rounded-sm text-blue-600"
                />
                <span>إطار كامل الصفحة</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Live Preview Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
          <Eye className="w-4 h-4 text-blue-600" />
          <span>معاينة حية لشكل الترويسة والتذييل على ورقة A4:</span>
        </div>

        <div className="bg-slate-50 p-6 rounded-xl border border-slate-300 shadow-inner overflow-hidden">
          {/* Header Preview Table */}
          <div
            className={`bg-white rounded-lg p-4 grid grid-cols-3 gap-2 text-xs ${
              settings.headerBorder ? 'border-2 border-slate-800' : 'border border-dashed border-slate-300'
            }`}
          >
            {/* Right */}
            <div className="text-center flex flex-col justify-center space-y-0.5 border-l border-slate-200 pl-2">
              <div className="font-bold text-slate-700">{ExamCatalog.administrationLabel}</div>
              <div className="font-bold text-slate-900 text-sm">{header.schoolName || 'مدرسة ....................'}</div>
              {SchoolGenderLabels[header.schoolGender]?.label && (
                <div className="text-slate-600">{SchoolGenderLabels[header.schoolGender].label}</div>
              )}
            </div>

            {/* Center */}
            <div className="text-center flex flex-col justify-center space-y-1">
              {header.showBismillah && (
                <div className="font-amiri font-bold text-sm text-slate-800">{ExamCatalog.bismillah}</div>
              )}
              <div className="font-bold text-slate-900">
                {ExamCatalog.examTitlePrefix} {header.examType || 'نصف السنة'}
              </div>
              <div className="text-slate-600 text-[11px]">
                {ExamCatalog.academicYearPrefix} {formatDocNumber(header.academicYear || '2026/2027', doc)}
              </div>
              {ExamSessionLabels[header.session]?.label && (
                <div className="text-slate-700 font-medium text-[11px]">{ExamSessionLabels[header.session].label}</div>
              )}
            </div>

            {/* Left */}
            <div className="text-right flex flex-col justify-center space-y-1 border-r border-slate-200 pr-2 text-[11px]">
              <div>
                <span className="font-bold text-slate-800">{ExamCatalog.subjectLabel}</span>{' '}
                <span className="text-slate-700">{header.subject || ExamCatalog.blankLine}</span>
              </div>
              <div>
                <span className="font-bold text-slate-800">{ExamCatalog.gradeLabel}</span>{' '}
                <span className="text-slate-700">{header.grade || ExamCatalog.blankLine}</span>
              </div>
              <div>
                <span className="font-bold text-slate-800">{ExamCatalog.timeLabel}</span>{' '}
                <span className="text-slate-700">{header.time || ExamCatalog.blankLine}</span>
              </div>
              <div>
                <span className="font-bold text-slate-800">{ExamCatalog.studentNameLabel}</span>{' '}
                <span className="text-slate-400">{ExamCatalog.blankLine}</span>
              </div>
            </div>
          </div>

          {/* Footer Preview Table */}
          <div className="mt-8 pt-4 border-t border-slate-300 text-xs">
            {footer.closingPhrase && (
              <div className="text-center font-bold text-slate-800 mb-4 tracking-wide">
                *** {footer.closingPhrase} ***
              </div>
            )}
            <div className="flex items-center justify-between px-6">
              {/* Secondary (Right) */}
              <div className="text-right">
                {footer.secondary && (
                  <>
                    <div className="font-bold text-slate-800">
                      {SignatureTitleLabels[footer.secondary.title] || 'مدرس المادة'}
                    </div>
                    <div className="text-slate-600 mt-1">{footer.secondary.name || '....................'}</div>
                  </>
                )}
              </div>

              {/* Primary (Left) */}
              <div className="text-left">
                <div className="font-bold text-slate-800">
                  {SignatureTitleLabels[footer.primary.title] || 'مدرس المادة'}
                </div>
                <div className="text-slate-600 mt-1">{footer.primary.name || '....................'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bottom Navigation Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="text-xs text-slate-500 font-medium">
            الخطوة 1 من 3: اضبط بيانات الترويسة والتذييل، ثم انتقل لبناء الأسئلة.
          </div>
          <button
            type="button"
            onClick={onNext}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition active:scale-95"
          >
            <span>التالي: إعداد أسئلة الامتحان</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
