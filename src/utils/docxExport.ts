import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
} from 'docx';
import { ExamDocument } from '../types/exam';
import {
  calculateQuestionMarks,
  formatDocNumber,
  formatMarks,
  getBranchDisplayLabel,
  getQuestionDisplayLabel,
} from './formatters';
import { ExamCatalog, ExamSessionLabels, SchoolGenderLabels, SignatureTitleLabels } from '../types/catalog';

export async function exportExamToDocx(doc: ExamDocument): Promise<Blob> {
  const isLtr = doc.header.subject?.toLowerCase().includes('english');
  const dir = isLtr ? AlignmentType.LEFT : AlignmentType.RIGHT;
  const center = AlignmentType.CENTER;

  // 1. Build Header Table (3 columns: Right, Center, Left)
  // Right Column: School administration & name
  const schoolGenderText = SchoolGenderLabels[doc.header.schoolGender]?.label || '';
  const rightParas = [
    new Paragraph({
      alignment: center,
      children: [new TextRun({ text: ExamCatalog.administrationLabel, bold: true, size: 22 })],
    }),
    new Paragraph({
      alignment: center,
      children: [new TextRun({ text: doc.header.schoolName || 'مدرسة ....................', bold: true, size: 24 })],
    }),
  ];
  if (schoolGenderText) {
    rightParas.push(
      new Paragraph({
        alignment: center,
        children: [new TextRun({ text: schoolGenderText, bold: true, size: 20 })],
      })
    );
  }

  // Center Column: Bismillah, Exam Type, Academic Year, Session
  const centerParas: Paragraph[] = [];
  if (doc.header.showBismillah) {
    centerParas.push(
      new Paragraph({
        alignment: center,
        children: [new TextRun({ text: ExamCatalog.bismillah, bold: true, size: 24 })],
      })
    );
  }
  centerParas.push(
    new Paragraph({
      alignment: center,
      children: [
        new TextRun({
          text: `${ExamCatalog.examTitlePrefix} ${doc.header.examType || 'نصف السنة'}`,
          bold: true,
          size: 22,
        }),
      ],
    }),
    new Paragraph({
      alignment: center,
      children: [
        new TextRun({
          text: `${ExamCatalog.academicYearPrefix} ${formatDocNumber(doc.header.academicYear || '2026/2027', doc)}`,
          bold: true,
          size: 20,
        }),
      ],
    })
  );
  const sessionText = ExamSessionLabels[doc.header.session]?.label;
  if (sessionText) {
    centerParas.push(
      new Paragraph({
        alignment: center,
        children: [new TextRun({ text: sessionText, bold: true, size: 20 })],
      })
    );
  }

  // Left Column: Subject, Grade, Time, Student Name
  const leftParas = [
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: `${ExamCatalog.subjectLabel} `, bold: true, size: 20 }),
        new TextRun({ text: doc.header.subject || ExamCatalog.blankLine, size: 20 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: `${ExamCatalog.gradeLabel} `, bold: true, size: 20 }),
        new TextRun({ text: doc.header.grade || ExamCatalog.blankLine, size: 20 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: `${ExamCatalog.timeLabel} `, bold: true, size: 20 }),
        new TextRun({ text: doc.header.time || ExamCatalog.blankLine, size: 20 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: `${ExamCatalog.studentNameLabel} `, bold: true, size: 20 }),
        new TextRun({ text: ExamCatalog.blankLine, size: 20 }),
      ],
    }),
  ];

  const headerTable = new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    borders: doc.settings.headerBorder
      ? undefined
      : {
          top: { style: BorderStyle.NONE },
          bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE },
          insideHorizontal: { style: BorderStyle.NONE },
          insideVertical: { style: BorderStyle.NONE },
        },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            children: rightParas,
          }),
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            children: centerParas,
          }),
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            children: leftParas,
          }),
        ],
      }),
    ],
  });

  // 2. Build Questions Section
  const bodyElements: (Paragraph | Table)[] = [headerTable];

  // Spacing after header
  bodyElements.push(new Paragraph({ spacing: { after: 200 } }));

  for (const question of doc.questions) {
    // Category line
    if (question.category?.trim()) {
      bodyElements.push(
        new Paragraph({
          alignment: center,
          spacing: { before: 180, after: 80 },
          children: [
            new TextRun({
              text: `[ ${question.category.trim()} ]`,
              bold: true,
              size: 24,
              color: '1E3A8A',
            }),
          ],
        })
      );
    }

    // Question title & statement & marks
    const qLabel = getQuestionDisplayLabel(question, doc);
    const marksVal = calculateQuestionMarks(question);
    const marksText = doc.settings.showQuestionMarks && marksVal > 0
      ? `  (${formatDocNumber(formatMarks(marksVal), doc)} درجة)`
      : '';

    bodyElements.push(
      new Paragraph({
        alignment: dir,
        spacing: { before: 140, after: 60 },
        children: [
          new TextRun({ text: `${qLabel}: `, bold: true, size: 22, color: '000000' }),
          new TextRun({ text: question.statement || '', bold: true, size: 22 }),
          new TextRun({ text: marksText, bold: true, size: 20, color: '15803D' }),
        ],
      })
    );

    // Question body
    if (question.body?.trim()) {
      bodyElements.push(
        new Paragraph({
          alignment: dir,
          spacing: { after: 80 },
          children: [new TextRun({ text: question.body.trim(), size: 20 })],
        })
      );
    }

    // Direct items
    for (let i = 0; i < question.items.length; i++) {
      const item = question.items[i];
      const itemLabel = item.labelOverride ?? `${formatDocNumber(i + 1, doc)}- `;
      let itemSuffix = '';
      if (item.kind === 'trueFalse') {
        itemSuffix = `   ${ExamCatalog.trueFalseSlot}`;
      } else if (item.kind === 'fillBlank') {
        if (!item.text.includes('___') && !item.text.includes('...')) {
          itemSuffix = `   ${ExamCatalog.fillBlank}`;
        }
      }

      const itemMarksText = doc.settings.showQuestionMarks && item.marks > 0
        ? `   (${formatDocNumber(formatMarks(item.marks), doc)} درجة)`
        : '';

      bodyElements.push(
        new Paragraph({
          alignment: dir,
          indent: { start: 360 },
          spacing: { after: 60 },
          children: [
            new TextRun({ text: itemLabel, bold: true, size: 20 }),
            new TextRun({ text: item.text, size: 20 }),
            new TextRun({ text: itemSuffix, bold: true, size: 20 }),
            new TextRun({ text: itemMarksText, size: 18, color: '15803D' }),
          ],
        })
      );

      // Multiple choice options
      if (item.kind === 'multipleChoice' && item.options?.length > 0) {
        const optionRuns: TextRun[] = [];
        const optLabels = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];
        item.options.forEach((opt, oIdx) => {
          const optLabel = opt.labelOverride ?? `( ${optLabels[oIdx] || oIdx + 1} ) `;
          optionRuns.push(new TextRun({ text: `    ${optLabel}${opt.text}        `, size: 19 }));
        });
        bodyElements.push(
          new Paragraph({
            alignment: dir,
            indent: { start: 720 },
            spacing: { after: 80 },
            children: optionRuns,
          })
        );
      }
    }

    // Branches
    for (let bIdx = 0; bIdx < question.branches.length; bIdx++) {
      const branch = question.branches[bIdx];
      const bLabel = getBranchDisplayLabel(bIdx, branch, doc);
      const bMarksText = doc.settings.showQuestionMarks && branch.marks > 0
        ? `  (${formatDocNumber(formatMarks(branch.marks), doc)} درجة)`
        : '';

      bodyElements.push(
        new Paragraph({
          alignment: dir,
          indent: { start: 240 },
          spacing: { before: 100, after: 60 },
          children: [
            new TextRun({ text: `${bLabel}) `, bold: true, size: 21, color: '1E3A8A' }),
            new TextRun({ text: branch.content.statement || '', bold: true, size: 21 }),
            new TextRun({ text: bMarksText, bold: true, size: 19, color: '15803D' }),
          ],
        })
      );

      if (branch.content.body?.trim()) {
        bodyElements.push(
          new Paragraph({
            alignment: dir,
            indent: { start: 400 },
            spacing: { after: 60 },
            children: [new TextRun({ text: branch.content.body.trim(), size: 20 })],
          })
        );
      }

      // Branch items
      for (let bi = 0; bi < branch.content.items.length; bi++) {
        const item = branch.content.items[bi];
        const itemLabel = item.labelOverride ?? `${formatDocNumber(bi + 1, doc)}- `;
        let itemSuffix = '';
        if (item.kind === 'trueFalse') {
          itemSuffix = `   ${ExamCatalog.trueFalseSlot}`;
        } else if (item.kind === 'fillBlank') {
          if (!item.text.includes('___') && !item.text.includes('...')) {
            itemSuffix = `   ${ExamCatalog.fillBlank}`;
          }
        }

        const bItemMarksText = doc.settings.showQuestionMarks && item.marks > 0
          ? `   (${formatDocNumber(formatMarks(item.marks), doc)} درجة)`
          : '';

        bodyElements.push(
          new Paragraph({
            alignment: dir,
            indent: { start: 480 },
            spacing: { after: 60 },
            children: [
              new TextRun({ text: itemLabel, bold: true, size: 20 }),
              new TextRun({ text: item.text, size: 20 }),
              new TextRun({ text: itemSuffix, bold: true, size: 20 }),
              new TextRun({ text: bItemMarksText, size: 18, color: '15803D' }),
            ],
          })
        );

        if (item.kind === 'multipleChoice' && item.options?.length > 0) {
          const optionRuns: TextRun[] = [];
          const optLabels = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];
          item.options.forEach((opt, oIdx) => {
            const optLabel = opt.labelOverride ?? `( ${optLabels[oIdx] || oIdx + 1} ) `;
            optionRuns.push(new TextRun({ text: `    ${optLabel}${opt.text}        `, size: 19 }));
          });
          bodyElements.push(
            new Paragraph({
              alignment: dir,
              indent: { start: 800 },
              spacing: { after: 80 },
              children: optionRuns,
            })
          );
        }
      }
    }
  }

  // 3. Build Footer Section
  bodyElements.push(new Paragraph({ spacing: { before: 300 } }));

  // Closing Phrase
  if (doc.footer.closingPhrase?.trim()) {
    bodyElements.push(
      new Paragraph({
        alignment: center,
        spacing: { before: 200, after: 150 },
        children: [
          new TextRun({
            text: `*** ${doc.footer.closingPhrase.trim()} ***`,
            bold: true,
            size: 22,
          }),
        ],
      })
    );
  }

  // Signatures Table
  const primarySig = doc.footer.primary;
  const primaryTitle = SignatureTitleLabels[primarySig.title] || 'مدرس المادة';
  const secSig = doc.footer.secondary;

  const sigCells: TableCell[] = [
    new TableCell({
      width: { size: secSig ? 50 : 100, type: WidthType.PERCENTAGE },
      children: [
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [new TextRun({ text: primaryTitle, bold: true, size: 20 })],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({
              text: primarySig.name || ExamCatalog.blankLine,
              bold: true,
              size: 20,
            }),
          ],
        }),
      ],
    }),
  ];

  if (secSig) {
    const secTitle = SignatureTitleLabels[secSig.title] || 'مدرس المادة';
    sigCells.unshift(
      new TableCell({
        width: { size: 50, type: WidthType.PERCENTAGE },
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: secTitle, bold: true, size: 20 })],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: secSig.name || ExamCatalog.blankLine,
                bold: true,
                size: 20,
              }),
            ],
          }),
        ],
      })
    );
  }

  const signaturesTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: sigCells,
      }),
    ],
  });

  bodyElements.push(signaturesTable);

  const wordDoc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: doc.settings.marginMm * 56.7, // convert mm to twips
              bottom: doc.settings.marginMm * 56.7,
              left: doc.settings.marginMm * 56.7,
              right: doc.settings.marginMm * 56.7,
            },
          },
        },
        children: bodyElements,
      },
    ],
  });

  return await Packer.toBlob(wordDoc);
}
