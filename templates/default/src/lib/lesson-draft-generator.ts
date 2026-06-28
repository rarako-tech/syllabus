import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/env";
import { parseAiJsonResponse } from "@/lib/parse-ai-json";
import type { SyllabusOverview } from "@/lib/types/syllabus-detail";
import { truncateText } from "@/lib/text-utils";
import {
  generatedLessonDraftSchema,
  type GeneratedLessonDraft,
} from "@/lib/validations/lesson-draft";

const LESSON_DRAFT_TOOL_NAME = "submit_lesson_drafts";
const MAX_ATTEMPTS = 2;

type SessionSummary = {
  sessionNumber: number;
  title: string;
  learningObjectives: string;
};

const lessonDraftToolSchema = {
  type: "object" as const,
  properties: {
    sessions: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          sessionNumber: { type: "integer" as const },
          items: {
            type: "array" as const,
            items: {
              type: "object" as const,
              properties: {
                time: { type: "string" as const },
                content: { type: "string" as const },
                teacherAction: { type: "string" as const },
                studentActivity: { type: "string" as const },
                materials: { type: "string" as const },
              },
              required: ["time", "content"],
            },
            minItems: 3,
            maxItems: 6,
          },
        },
        required: ["sessionNumber", "items"],
      },
      minItems: 1,
      maxItems: 1,
    },
  },
  required: ["sessions"],
};

function buildSessionPrompt({
  overview,
  session,
  pdfText,
}: {
  overview: SyllabusOverview;
  session: SessionSummary;
  pdfText: { fileName: string; text: string };
}) {
  const slide = overview.slides[session.sessionNumber - 1];
  const overviewSlide = slide
    ? `第${session.sessionNumber}回: ${slide.title}\n${slide.content || "（内容未記入）"}`
    : "（未記入）";

  return `あなたは大学・専門学校の授業設計の専門家です。
以下の情報をもとに、第${session.sessionNumber}回のタイムスケジュール（教案たたき台）のみを作成してください。

【シラバス情報】
教科書名: ${overview.textbookName || "未記入"}
コースの目標: ${overview.courseGoals || "未記入"}
対象学生のレベル: ${overview.targetStudentLevel || "未記入"}

【第${session.sessionNumber}回】${session.title}
学習目標: ${session.learningObjectives || "未記入"}

【各回の概要（手入力）】
${overviewSlide}

【教材テキスト（PDFまたは概要）】
--- ${pdfText.fileName} ---
${truncateText(pdfText.text, 12_000)}

【出力ルール】
- 第${session.sessionNumber}回のみ作成する（sessionNumber は ${session.sessionNumber}）
- 3〜6行のタイムスケジュール
- 時間は各項目の「開始時刻」を "H:MM" 形式で記述（授業開始=0:00。例: 0:00, 0:15, 0:35）。90分授業想定
- 日本語で具体的に記述
- 文字列内にダブルクォート（"）を含めない。引用は「」を使う
- 必ず ${LESSON_DRAFT_TOOL_NAME} ツールを使って結果を返す`;
}

function parseDraftFromMessage(message: Anthropic.Message): unknown {
  const toolBlock = message.content.find(
    (block): block is Anthropic.ToolUseBlock =>
      block.type === "tool_use" && block.name === LESSON_DRAFT_TOOL_NAME,
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

function validateSessionDraft(
  parsed: unknown,
  sessionNumber: number,
): GeneratedLessonDraft["sessions"][number] {
  const result = generatedLessonDraftSchema.safeParse(parsed);
  if (!result.success) {
    const issue = result.error.issues[0]?.message ?? "形式エラー";
    throw new Error(`第${sessionNumber}回: ${issue}`);
  }

  const session = result.data.sessions.find(
    (row) => row.sessionNumber === sessionNumber,
  );
  if (!session) {
    throw new Error(`第${sessionNumber}回のスケジュールが生成されませんでした`);
  }

  return session;
}

async function generateSingleSessionDraft(
  client: Anthropic,
  {
    overview,
    session,
    pdfText,
  }: {
    overview: SyllabusOverview;
    session: SessionSummary;
    pdfText: { fileName: string; text: string };
  },
): Promise<GeneratedLessonDraft["sessions"][number]> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        tools: [
          {
            name: LESSON_DRAFT_TOOL_NAME,
            description: "生成した1回分のタイムスケジュールを送信する",
            input_schema: lessonDraftToolSchema,
          },
        ],
        tool_choice: { type: "tool", name: LESSON_DRAFT_TOOL_NAME },
        messages: [
          {
            role: "user",
            content: buildSessionPrompt({ overview, session, pdfText }),
          },
        ],
      });

      const parsed = parseDraftFromMessage(message);
      return validateSessionDraft(parsed, session.sessionNumber);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < MAX_ATTEMPTS) continue;
    }
  }

  throw lastError ?? new Error(`第${session.sessionNumber}回の生成に失敗しました`);
}

export async function generateLessonDraftsWithAnthropic({
  overview,
  sessions,
  pdfTexts,
}: {
  overview: SyllabusOverview;
  sessions: SessionSummary[];
  pdfTexts: { fileName: string; text: string }[];
}): Promise<GeneratedLessonDraft> {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY が設定されていません");
  }

  if (sessions.length === 0) {
    throw new Error("生成対象の回がありません");
  }

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const generatedSessions: GeneratedLessonDraft["sessions"] = [];

  for (const session of sessions) {
    const pdf = pdfTexts[session.sessionNumber - 1];
    const slide = overview.slides[session.sessionNumber - 1];
    const pdfText = {
      fileName: pdf?.fileName ?? `第${session.sessionNumber}回`,
      text:
        pdf?.text.trim() ||
        slide?.content.trim() ||
        session.learningObjectives.trim(),
    };

    if (!pdfText.text) {
      throw new Error(
        `第${session.sessionNumber}回: 教材テキストがありません（PDFまたは概要の内容を入力してください）`,
      );
    }

    const generated = await generateSingleSessionDraft(client, {
      overview,
      session,
      pdfText,
    });
    generatedSessions.push(generated);
  }

  return { sessions: generatedSessions };
}

export async function generateLessonDraftForSession(
  overview: SyllabusOverview,
  session: SessionSummary,
  pdfTexts: { fileName: string; text: string }[],
): Promise<GeneratedLessonDraft["sessions"][number]> {
  const draft = await generateLessonDraftsWithAnthropic({
    overview,
    sessions: [session],
    pdfTexts,
  });
  const generated = draft.sessions[0];
  if (!generated) {
    throw new Error(`第${session.sessionNumber}回の生成に失敗しました`);
  }
  return generated;
}
