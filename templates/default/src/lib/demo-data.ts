import type { SyllabusRow } from "@/actions/syllabuses";

export const demoSyllabuses: SyllabusRow[] = [
  {
    id: "demo-1",
    title: "Webアプリ開発 基礎",
    description: "Next.js と TypeScript の入門",
    status: "published",
    createdAt: new Date("2025-04-01"),
    updatedAt: new Date("2025-05-10"),
  },
  {
    id: "demo-2",
    title: "データベース設計",
    description: "正規化とマルチテナント",
    status: "draft",
    createdAt: new Date("2025-04-15"),
    updatedAt: new Date("2025-05-01"),
  },
  {
    id: "demo-3",
    title: "認証と権限",
    description: "Clerk Organizations",
    status: "archived",
    createdAt: new Date("2025-03-20"),
    updatedAt: new Date("2025-04-20"),
  },
];
