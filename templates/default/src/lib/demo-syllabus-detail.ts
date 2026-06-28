import type { SyllabusDetail, SyllabusOverview } from "@/lib/types/syllabus-detail";
import { demoSyllabuses } from "@/lib/demo-data";

const demoOverview1: SyllabusOverview = {
  textbookName: "実践 Next.js 15 入門",
  courseGoals:
    "App Router と Server Actions を使い、認証付きの CRUD アプリを自力で構築できる。",
  targetStudentLevel: "HTML/CSS の基礎あり。JavaScript は読める程度。",
  plannedSessionCount: 15,
  slides: [
    {
      id: "demo-overview-slide-1",
      title: "第1回：開発環境",
      content: "〜てください\n〜ましょう\n〜ことができます",
    },
    {
      id: "demo-overview-slide-2",
      title: "第2回：ルーティング",
      content: "〜たいです\n〜なければなりません\n〜ほうがいいです",
    },
  ],
  pdfs: [],
};

const session1 = {
  id: "demo-s1-1",
  sessionNumber: 1,
  sessionDate: "2025-04-10",
  title: "開発環境のセットアップ",
  learningObjectives:
    "Node.js と pnpm の役割を説明できる。Next.js プロジェクトを新規作成できる。",
  preparation: "PC（Windows/Mac）、管理者権限、ブラウザ（Chrome 推奨）",
  scheduleItems: [
    {
      id: "demo-sch-1-1",
      time: "0:00",
      content: "オリエンテーション",
      teacherAction: "カリキュラムと評価方法を説明",
      studentActivity: "受講動機をペアで共有",
      materials: "スライド①",
    },
    {
      id: "demo-sch-1-2",
      time: "0:15",
      content: "Node.js / pnpm インストール",
      teacherAction: "画面共有で手順をデモ",
      studentActivity: "各自インストール・バージョン確認",
      materials: "手順書 PDF",
    },
    {
      id: "demo-sch-1-3",
      time: "0:45",
      content: "create-next-app 実習",
      teacherAction: "巡回しつつ個別サポート",
      studentActivity: "プロジェクト作成・dev サーバー起動",
      materials: "公式ドキュメント",
    },
  ],
  slides: [
    {
      id: "demo-slide-1-1",
      title: "第1回 オリエンテーション",
      thumbnailUrl: null,
      linkUrl: "https://drive.google.com/",
      linkProvider: "google_drive" as const,
    },
    {
      id: "demo-slide-1-2",
      title: "環境構築チェックリスト",
      thumbnailUrl: null,
      linkUrl: "https://www.canva.com/",
      linkProvider: "canva" as const,
    },
  ],
  references: [
    {
      id: "demo-ref-1-1",
      title: "Next.js 公式ドキュメント",
      url: "https://nextjs.org/docs",
      type: "公式",
      memo: "App Router セクションを優先",
    },
    {
      id: "demo-ref-1-2",
      title: "pnpm インストール",
      url: "https://pnpm.io/installation",
      type: "ツール",
      memo: "Windows は PowerShell 手順を参照",
    },
  ],
};

const session2 = {
  id: "demo-s1-2",
  sessionNumber: 2,
  sessionDate: "2025-04-17",
  title: "ルーティングとレイアウト",
  learningObjectives:
    "App Router のファイルベースルーティングを説明できる。共有レイアウトを実装できる。",
  preparation: "第1回のプロジェクトを持参、VS Code インストール済み",
  scheduleItems: [
    {
      id: "demo-sch-2-1",
      time: "0:00",
      content: "前回の振り返り",
      teacherAction: "よくあるエラーを共有",
      studentActivity: "質問・つまずきの共有",
      materials: "スライド②",
    },
    {
      id: "demo-sch-2-2",
      time: "0:20",
      content: "app/ ディレクトリ構造",
      teacherAction: "図解で page / layout の関係を説明",
      studentActivity: "メモ取り・質問",
      materials: "ホワイトボード",
    },
    {
      id: "demo-sch-2-3",
      time: "0:50",
      content: "ダッシュボードレイアウト実習",
      teacherAction: "サンプルコードを配布",
      studentActivity: "サイドバー付きレイアウトを実装",
      materials: "サンプルリポジトリ",
    },
  ],
  slides: [
    {
      id: "demo-slide-2-1",
      title: "第2回 App Router",
      thumbnailUrl: null,
      linkUrl: "https://drive.google.com/",
      linkProvider: "google_drive" as const,
    },
  ],
  references: [
    {
      id: "demo-ref-2-1",
      title: "Routing Fundamentals",
      url: "https://nextjs.org/docs/app/building-your-application/routing",
      type: "公式",
      memo: "Route Groups にも触れる",
    },
  ],
};

const session3 = {
  id: "demo-s1-3",
  sessionNumber: 3,
  sessionDate: "2025-04-24",
  title: "データ取得と Server Actions",
  learningObjectives:
    "Server Actions の役割を説明できる。フォームから DB 更新の流れを実装できる。",
  preparation: "PostgreSQL 接続情報（講師から配布）、.env.local の編集権限",
  scheduleItems: [
    {
      id: "demo-sch-3-1",
      time: "0:00",
      content: "Server / Client の境界",
      teacherAction: "図で RSC と Actions を説明",
      studentActivity: "既存コードの server / client を分類",
      materials: "スライド③",
    },
    {
      id: "demo-sch-3-2",
      time: "0:30",
      content: "Drizzle + CRUD 実習",
      teacherAction: "デモ後に個別フォロー",
      studentActivity: "syllabuses テーブルへ 1 件登録",
      materials: "スキーマ定義ファイル",
    },
  ],
  slides: [
    {
      id: "demo-slide-3-1",
      title: "第3回 Server Actions",
      thumbnailUrl: null,
      linkUrl: "https://www.canva.com/",
      linkProvider: "canva" as const,
    },
  ],
  references: [
    {
      id: "demo-ref-3-1",
      title: "Server Actions",
      url: "https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations",
      type: "公式",
      memo: "revalidatePath の例を確認",
    },
    {
      id: "demo-ref-3-2",
      title: "Drizzle ORM",
      url: "https://orm.drizzle.team/docs/overview",
      type: "ツール",
      memo: "",
    },
  ],
};

const details: Record<string, SyllabusDetail> = {
  "demo-1": {
    id: "demo-1",
    title: demoSyllabuses[0].title,
    description: demoSyllabuses[0].description,
    status: demoSyllabuses[0].status,
    overview: demoOverview1,
    sessions: [session1, session2, session3],
  },
  "demo-2": {
    id: "demo-2",
    title: demoSyllabuses[1].title,
    description: demoSyllabuses[1].description,
    status: demoSyllabuses[1].status,
    overview: {
      textbookName: "データベース設計の基礎",
      courseGoals: "正規化と ER 図を使い、実務に耐えるスキーマを設計できる。",
      targetStudentLevel: "SQL の SELECT は書ける。",
      plannedSessionCount: 10,
      slides: [],
      pdfs: [],
    },
    sessions: [
      {
        ...session1,
        id: "demo-s2-1",
        sessionNumber: 1,
        title: "正規化の基礎",
        learningObjectives: "第1〜3正規形を説明できる。",
        preparation: "ER 図用紙",
        scheduleItems: session1.scheduleItems.map((s, i) => ({
          ...s,
          id: `demo-s2-sch-${i}`,
        })),
        slides: session1.slides.map((s, i) => ({
          ...s,
          id: `demo-s2-slide-${i}`,
        })),
        references: session1.references.map((r, i) => ({
          ...r,
          id: `demo-s2-ref-${i}`,
        })),
      },
    ],
  },
  "demo-3": {
    id: "demo-3",
    title: demoSyllabuses[2].title,
    description: demoSyllabuses[2].description,
    status: demoSyllabuses[2].status,
    overview: {
      textbookName: "",
      courseGoals: "",
      targetStudentLevel: "",
      plannedSessionCount: null,
      slides: [],
      pdfs: [],
    },
    sessions: [
      {
        ...session1,
        id: "demo-s3-1",
        sessionNumber: 1,
        title: "Clerk Organizations 入門",
        learningObjectives: "マルチテナント認証の概念を説明できる。",
        preparation: "Clerk アカウント",
        scheduleItems: [],
        slides: [],
        references: [],
      },
    ],
  },
};

export function getDemoSyllabusDetail(id: string): SyllabusDetail | null {
  return details[id] ?? null;
}
