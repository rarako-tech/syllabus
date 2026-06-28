/** "0:15" / "1:30" などを授業開始からの分数に変換 */
export function parseScheduleMinutes(time: string): number | null {
  const trimmed = time.trim();
  if (!trimmed || /[-–—~〜]/.test(trimmed)) return null;

  const singleMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!singleMatch) return null;

  return Number(singleMatch[1]) * 60 + Number(singleMatch[2]);
}

/** 範囲表記 "0:00-0:15" の所要時間（分） */
export function parseScheduleRangeDuration(time: string): number | null {
  const trimmed = time.trim();
  const rangeMatch = trimmed.match(
    /^(\d{1,2}):(\d{2})\s*[-–—~〜]\s*(\d{1,2}):(\d{2})$/,
  );
  if (!rangeMatch) return null;

  const start = Number(rangeMatch[1]) * 60 + Number(rangeMatch[2]);
  const end = Number(rangeMatch[3]) * 60 + Number(rangeMatch[4]);
  const diff = end - start;
  return diff > 0 ? diff : null;
}

export function formatScheduleDuration(minutes: number): string {
  return `${minutes}分`;
}

/**
 * 各項目の所要時間を算出する。
 * time は「開始時刻（授業開始から H:MM）」または「0:00-0:15」形式の範囲。
 */
export function getScheduleItemDuration(
  items: { time: string }[],
  index: number,
): string | null {
  const current = items[index]?.time ?? "";
  const rangeDuration = parseScheduleRangeDuration(current);
  if (rangeDuration != null) {
    return formatScheduleDuration(rangeDuration);
  }

  const currentStart = parseScheduleMinutes(current);
  if (currentStart == null) return null;

  const next = items[index + 1];
  if (next) {
    const nextStart = parseScheduleMinutes(next.time);
    if (nextStart != null) {
      const diff = nextStart - currentStart;
      if (diff > 0) return formatScheduleDuration(diff);
    }
  }

  return null;
}

/** 入力欄用の時刻表示（範囲または開始時刻） */
export function formatScheduleTimeLabel(time: string): string {
  return time.trim();
}
