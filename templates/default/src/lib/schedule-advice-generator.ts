import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/env";

export type ScheduleAdviceInput = {
  time: string;
  content: string;
  teacherAction: string;
  studentActivity: string;
  materials: string;
};

function buildPrompt(row: ScheduleAdviceInput) {
  return `あなたは大学・専門学校の授業設計の専門家です。
以下の授業の1コマ（タイムスケジュールの1行）について、アドバイスや改善案を提案してください。

【時間】${row.time || "（未記入）"}
【内容】${row.content || "（未記入）"}
【教師の動き】${row.teacherAction || "（未記入）"}
【生徒の活動】${row.studentActivity || "（未記入）"}
【使用教材】${row.materials || "（未記入）"}

【出力ルール】
- 日本語で回答
- 箇条書きで3〜5点程度
- 具体的で実践的な改善提案
- マークダウンは使わずプレーンテキストで`;
}

export function buildDemoScheduleAdvice(row: ScheduleAdviceInput): string {
  const content = row.content || "このコマ";
  const materials = row.materials || "使用教材";

  return `【アドバイス】（デモ）

・「${content}」では、導入を短くし本題の時間を確保すると効果的です。
・教師の動きと生徒の活動の切り替えタイミングを明確にすると、授業のリズムが良くなります。
・${materials}を事前に配布しておくと、活動開始までの待ち時間を減らせます。
・生徒の活動後に短い振り返り（1〜2分）を入れると定着が促進されます。`;
}

export async function generateScheduleAdviceWithAnthropic(
  row: ScheduleAdviceInput,
): Promise<string> {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY が設定されていません");
  }

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: buildPrompt(row),
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("AIからテキスト応答がありませんでした");
  }

  const advice = textBlock.text.trim();
  if (!advice) {
    throw new Error("AIからアドバイスを取得できませんでした");
  }

  return advice;
}
