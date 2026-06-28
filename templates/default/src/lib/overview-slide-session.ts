import type { OverviewSlide } from "@/lib/types/syllabus-detail";

/** 概要タブの各回スライド（sortOrder 順）の N 番目を第 N 回に紐付ける */
export function getOverviewSlideForSession(
  slides: OverviewSlide[],
  sessionNumber: number,
): OverviewSlide | null {
  const index = sessionNumber - 1;
  if (index < 0 || index >= slides.length) return null;
  return slides[index] ?? null;
}

function cleanPatternLine(line: string): string {
  return line
    .trim()
    .replace(/^[\s・•●○◦\-–—*]+/, "")
    .replace(/^[0-9０-９]+[.)．、)]?\s*/, "")
    .trim();
}

/** 文型名の比較用に正規化する（番号・〜・空白の差を吸収） */
export function normalizePatternKey(pattern: string): string {
  let normalized = cleanPatternLine(pattern);
  normalized = normalized.replace(/^[0-9０-９]+/, "");
  normalized = normalized.replace(/^[〜~～]/, "");
  return normalized.replace(/\s+/g, "");
}

/** 授業進行ラベルなど、文型ではない行 */
const SECTION_LABEL_KEYS = new Set(
  [
    "ウォーミングアップ",
    "warmingup",
    "導入",
    "まとめ",
    "振り返り",
    "確認",
    "復習",
    "語彙",
    "読解",
    "聴解",
    "会話",
    "オリエンテーション",
  ].map((label) => label.replace(/\s+/g, "").toLowerCase()),
);

function isSentencePattern(line: string): boolean {
  const cleaned = cleanPatternLine(line);
  if (!cleaned) return false;

  const key = normalizePatternKey(cleaned).toLowerCase();
  if (SECTION_LABEL_KEYS.has(key)) return false;

  // カタカナのみの行は活動名・セクション名とみなして除外
  if (/^[\u30A0-\u30FFー・\s]+$/.test(cleaned)) return false;

  // 〜 を含む行は文型
  if (/[〜~～]/.test(cleaned)) return true;

  // 短いひらがな中心の行（例: につき、をとわず）
  if (
    cleaned.length <= 15 &&
    /^[\u3040-\u309F、・]+$/u.test(cleaned)
  ) {
    return true;
  }

  return false;
}

function splitPatternSegments(text: string): string[] {
  return text
    .split(/(?=[0-9０-９]+[.)．、)]\s*)/)
    .flatMap((segment) => segment.split(/[、,;；]+/))
    .map(cleanPatternLine)
    .filter(Boolean);
}

/** 概要「内容」テキストから文型リストを抽出する */
export function extractSentencePatterns(content: string): string[] {
  const lines = content
    .split(/\r?\n/)
    .flatMap((line) => splitPatternSegments(line))
    .filter(isSentencePattern);

  return [...new Set(lines)];
}

/** AI が返した文型名を、抽出済みリストの表記に揃える */
export function resolvePatternLabel(
  aiPattern: string,
  patterns: string[],
): string | null {
  const aiKey = normalizePatternKey(aiPattern);
  if (!aiKey) return null;

  return (
    patterns.find((pattern) => normalizePatternKey(pattern) === aiKey) ?? null
  );
}

/** 各文型が問題に含まれているか（表記ゆれを許容） */
export function findMissingPatterns(
  patterns: string[],
  questionPatterns: string[],
): string[] {
  const coveredKeys = new Set(
    questionPatterns
      .map((pattern) => normalizePatternKey(pattern))
      .filter(Boolean),
  );

  return patterns.filter(
    (pattern) => !coveredKeys.has(normalizePatternKey(pattern)),
  );
}
