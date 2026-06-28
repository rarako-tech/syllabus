import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/env";
import { parseAiJsonResponse } from "@/lib/parse-ai-json";
import {
  findMissingPatterns,
  resolvePatternLabel,
} from "@/lib/overview-slide-session";
import type { GeneratedWorksheet } from "@/lib/validations/worksheet";
import { generatedWorksheetSchema } from "@/lib/validations/worksheet";

const WORKSHEET_TOOL_NAME = "submit_worksheet";

const worksheetToolSchema = {
  type: "object" as const,
  properties: {
    patterns: {
      type: "array" as const,
      items: { type: "string" as const },
    },
    fourChoice: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          question: { type: "string" as const },
          pattern: { type: "string" as const },
          choices: {
            type: "array" as const,
            items: { type: "string" as const },
            minItems: 4,
            maxItems: 4,
          },
          answer: {
            type: "integer" as const,
            enum: [1, 2, 3, 4],
          },
        },
        required: ["question", "pattern", "choices", "answer"],
      },
      minItems: 10,
      maxItems: 10,
    },
  },
  required: ["patterns", "fourChoice"],
};

function buildPrompt({
  sessionNumber,
  sessionTitle,
  contentText,
  patterns,
}: {
  sessionNumber: number;
  sessionTitle: string;
  contentText: string;
  patterns: string[];
}) {
  const patternList = patterns.map((p, i) => `${i + 1}. ${p}`).join("\n");

  return `あなたは日本語教育の専門家です。日本語能力試験N3レベルの学習者向けに、その回の学習内容を最後に確認する「まとめチェックシート」を作成してください。

【第${sessionNumber}回】${sessionTitle}

【各回スライドの内容（文型リストの元テキスト）】
${contentText || "（未記入）"}

【その回で習った文型】
${patternList}

【出題ルール】
- 4択問題のみ、合計10問を作成する
- 上記の文型をすべて問題に使う（各文型を少なくとも1問は出題し、10問全体でバランスよく配分する）
- 各問題の pattern フィールドには、【その回で習った文型】リストの文字列を可能な限りそのまま使う（例: 〜につき）
- 使用語彙・文法はすべて日本語能力試験N3レベルに限定する（N2以上の語彙は使わない）
- その回で習った内容の理解度を確認するまとめチェックシートとして設計する
- choices は4つの選択肢の配列、answer は正解番号（1〜4）
- 問題文・選択肢はすべて日本語で記述
- 文字列内にダブルクォート（"）を含めない。引用は「」を使う
- 必ず ${WORKSHEET_TOOL_NAME} ツールを使って結果を返す`;
}

function parseWorksheetFromMessage(message: Anthropic.Message): unknown {
  const toolBlock = message.content.find(
    (block): block is Anthropic.ToolUseBlock =>
      block.type === "tool_use" && block.name === WORKSHEET_TOOL_NAME,
  );
  if (toolBlock) {
    return toolBlock.input;
  }

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("AIからテキスト応答がありませんでした");
  }

  return parseAiJsonResponse(textBlock.text);
}

function validateWorksheet(
  parsed: unknown,
  patterns: string[],
): GeneratedWorksheet {
  const result = generatedWorksheetSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error("AIの応答形式が不正です。もう一度お試しください。");
  }

  const normalizedQuestions = result.data.fourChoice.map((question) => {
    const resolved = resolvePatternLabel(question.pattern, patterns);
    return resolved ? { ...question, pattern: resolved } : question;
  });

  const missingPatterns = findMissingPatterns(
    patterns,
    normalizedQuestions.map((question) => question.pattern),
  );
  if (missingPatterns.length > 0) {
    throw new Error(
      `次の文型が問題に含まれていません: ${missingPatterns.join("、")}`,
    );
  }

  return {
    patterns,
    fourChoice: normalizedQuestions,
  };
}

export function buildDemoWorksheet(patterns: string[]): GeneratedWorksheet {
  const fourChoice = Array.from({ length: 10 }, (_, index) => {
    const pattern = patterns[index % patterns.length] ?? patterns[0] ?? "文型";
    return {
      question: `（${pattern}）まとめチェック 問${index + 1}：正しい文を選びなさい。`,
      pattern,
      choices: [
        `${pattern}を使った正しい文`,
        `${pattern}の誤用例A`,
        `${pattern}の誤用例B`,
        `${pattern}の誤用例C`,
      ] as [string, string, string, string],
      answer: 1 as const,
    };
  });

  return {
    patterns,
    fourChoice,
  };
}

export async function generateWorksheetWithAnthropic({
  sessionNumber,
  sessionTitle,
  contentText,
  patterns,
}: {
  sessionNumber: number;
  sessionTitle: string;
  contentText: string;
  patterns: string[];
}): Promise<GeneratedWorksheet> {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY が設定されていません");
  }

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const prompt = buildPrompt({
    sessionNumber,
    sessionTitle,
    contentText,
    patterns,
  });

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    tools: [
      {
        name: WORKSHEET_TOOL_NAME,
        description: "生成したまとめチェックシート（4択10問）を送信する",
        input_schema: worksheetToolSchema,
      },
    ],
    tool_choice: { type: "tool", name: WORKSHEET_TOOL_NAME },
    messages: [{ role: "user", content: prompt }],
  });

  const parsed = parseWorksheetFromMessage(message);
  return validateWorksheet(parsed, patterns);
}
