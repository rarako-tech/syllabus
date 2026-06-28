import "server-only";

import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type { GeneratedWorksheet } from "@/lib/validations/worksheet";

function heading(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]) {
  return new Paragraph({
    text,
    heading: level,
    spacing: { before: 240, after: 120 },
  });
}

function body(text: string) {
  return new Paragraph({
    children: [new TextRun({ text })],
    spacing: { after: 120 },
  });
}

function blankLine() {
  return new Paragraph({ text: "", spacing: { after: 120 } });
}

export async function buildWorksheetDocx({
  sessionNumber,
  sessionTitle,
  worksheet,
}: {
  sessionNumber: number;
  sessionTitle: string;
  worksheet: GeneratedWorksheet;
}): Promise<Buffer> {
  const children: Paragraph[] = [
    heading(`第${sessionNumber}回 まとめチェックシート`, HeadingLevel.TITLE),
    body(`テーマ：${sessionTitle}`),
    body("※ 使用語彙：日本語能力試験 N3 レベル"),
    body("その回で習った文型の理解度を確認するチェックシートです。"),
    blankLine(),
    heading("【習った文型】", HeadingLevel.HEADING_1),
  ];

  worksheet.patterns.forEach((pattern, index) => {
    children.push(body(`${index + 1}. ${pattern}`));
  });

  children.push(blankLine());
  children.push(heading("4択問題（全10問）", HeadingLevel.HEADING_1));

  worksheet.fourChoice.forEach((q, index) => {
    children.push(body(`問${index + 1}. ${q.question}`));
    q.choices.forEach((choice, choiceIndex) => {
      children.push(body(`　${choiceIndex + 1}. ${choice}`));
    });
    children.push(body(`　（　　）`));
    children.push(blankLine());
  });

  children.push(heading("【解答】", HeadingLevel.HEADING_1));
  worksheet.fourChoice.forEach((q, index) => {
    children.push(body(`問${index + 1}. ${q.answer}`));
  });

  const doc = new Document({
    sections: [{ children }],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

export function getWorksheetFileName(sessionNumber: number): string {
  return `${sessionNumber}_まとめチェックシート.docx`;
}
