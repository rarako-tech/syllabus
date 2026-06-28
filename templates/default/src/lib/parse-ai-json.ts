/** AI 応答テキストから JSON オブジェクト部分を抽出する（括弧のネストを考慮） */
export function extractJsonObject(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? text).trim();
  const start = candidate.indexOf("{");
  if (start === -1) {
    throw new Error("AIの応答からJSONを読み取れませんでした");
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < candidate.length; i++) {
    const char = candidate[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === "{") depth++;
    if (char === "}") {
      depth--;
      if (depth === 0) {
        return candidate.slice(start, i + 1);
      }
    }
  }

  throw new Error("AIの応答JSONが不完全です（括弧が閉じられていません）");
}

/** よくある AI 生成 JSON の構文エラーを修復する */
export function repairJsonString(json: string): string {
  let repaired = json.replace(/^\uFEFF/, "").trim();

  repaired = repaired
    .replace(/[\u201C\u201D\uFF02]/g, '"')
    .replace(/[\u2018\u2019]/g, "'");

  repaired = repaired.replace(/,\s*([}\]])/g, "$1");

  return repaired;
}

export function parseAiJsonResponse(text: string): unknown {
  const extracted = extractJsonObject(text);
  const candidates = [extracted, repairJsonString(extracted)];

  let lastError: Error | undefined;
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw new Error(
    lastError
      ? `AIの応答JSONの解析に失敗しました: ${lastError.message}`
      : "AIの応答からJSONを読み取れませんでした",
  );
}
