"use client";

import {
  BookOpen,
  Calendar,
  Clock,
  ExternalLink,
  FileText,
  Link2,
  Presentation,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  SessionReference,
  SessionSlide,
  SyllabusDetail,
  SyllabusSession,
} from "@/lib/types/syllabus-detail";
import { cn } from "@/lib/utils";

const providerLabel = {
  google_drive: "Google Drive",
  canva: "Canva",
} as const;

function formatDate(date: string | null) {
  if (!date) return "—";
  return new Date(`${date}T00:00:00`).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function PaneShell({
  title,
  description,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("flex min-h-0 min-w-0 flex-col overflow-hidden", className)}>
      <CardHeader className="shrink-0 border-b border-border py-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <div>
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            {description && (
              <CardDescription className="text-xs">{description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-auto p-3">{children}</CardContent>
    </Card>
  );
}

function SessionListPane({
  sessions,
  selectedId,
  onSelect,
}: {
  sessions: SyllabusSession[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const selected = sessions.find((s) => s.id === selectedId);

  return (
    <PaneShell
      title="① 各回で教える内容"
      description="回を選ぶと②③④が連動します"
      icon={BookOpen}
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">回が登録されていません</p>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => onSelect(session.id)}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  selectedId === session.id
                    ? "border-foreground bg-foreground text-background"
                    : "border-border hover:bg-muted",
                )}
              >
                <span className="font-medium">第{session.sessionNumber}回</span>
                <span className="mt-0.5 block text-xs opacity-80 line-clamp-1">
                  {session.title}
                </span>
              </button>
            ))
          )}
        </div>

        {selected && (
          <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDate(selected.sessionDate)}</span>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">タイトル</p>
              <p className="font-medium">{selected.title}</p>
            </div>
            <div>
              <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Target className="h-3.5 w-3.5" />
                学習目標
              </p>
              <p className="mt-1 whitespace-pre-wrap">{selected.learningObjectives || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">準備物</p>
              <p className="mt-1 whitespace-pre-wrap">{selected.preparation || "—"}</p>
            </div>
          </div>
        )}
      </div>
    </PaneShell>
  );
}

function SchedulePane({ session }: { session: SyllabusSession | null }) {
  return (
    <PaneShell
      title="② タイムスケジュール・教案メモ"
      description="時間・内容・教師の動き・生徒の活動・使用教材"
      icon={Clock}
    >
      {!session ? (
        <p className="text-sm text-muted-foreground">左のリストから回を選択してください</p>
      ) : session.scheduleItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">スケジュールがありません</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-3 font-medium">時間</th>
                <th className="pb-2 pr-3 font-medium">内容</th>
                <th className="pb-2 pr-3 font-medium">教師の動き</th>
                <th className="pb-2 pr-3 font-medium">生徒の活動</th>
                <th className="pb-2 font-medium">使用教材</th>
              </tr>
            </thead>
            <tbody>
              {session.scheduleItems.map((row) => (
                <tr key={row.id} className="border-b border-border/60 align-top">
                  <td className="py-2 pr-3 font-mono text-xs whitespace-nowrap">
                    {row.time}
                  </td>
                  <td className="py-2 pr-3">{row.content}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{row.teacherAction || "—"}</td>
                  <td className="py-2 pr-3 text-muted-foreground">
                    {row.studentActivity || "—"}
                  </td>
                  <td className="py-2">{row.materials || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PaneShell>
  );
}

function SlidesPane({ session }: { session: SyllabusSession | null }) {
  return (
    <PaneShell
      title="③ 各回のスライド"
      description="タイトル・サムネイル・リンク"
      icon={Presentation}
    >
      {!session ? (
        <p className="text-sm text-muted-foreground">回を選択してください</p>
      ) : session.slides.length === 0 ? (
        <p className="text-sm text-muted-foreground">スライドがありません</p>
      ) : (
        <ul className="space-y-3">
          {session.slides.map((slide) => (
            <SlideCard key={slide.id} slide={slide} />
          ))}
        </ul>
      )}
    </PaneShell>
  );
}

function SlideCard({ slide }: { slide: SessionSlide }) {
  return (
    <li className="flex gap-3 rounded-lg border border-border p-2">
      <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-xs text-muted-foreground">
        {slide.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={slide.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <Presentation className="h-6 w-6 opacity-40" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm line-clamp-2">{slide.title}</p>
        <Badge variant="secondary" className="mt-1 text-[10px]">
          {providerLabel[slide.linkProvider]}
        </Badge>
        <a
          href={slide.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
        >
          開く
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </li>
  );
}

function ReferencesPane({ session }: { session: SyllabusSession | null }) {
  return (
    <PaneShell
      title="④ 参照リンク・メモ"
      description="リンクタイトル・URL・種類・メモ"
      icon={Link2}
    >
      {!session ? (
        <p className="text-sm text-muted-foreground">回を選択してください</p>
      ) : session.references.length === 0 ? (
        <p className="text-sm text-muted-foreground">参照リンクがありません</p>
      ) : (
        <ul className="space-y-3">
          {session.references.map((ref) => (
            <ReferenceCard key={ref.id} reference={ref} />
          ))}
        </ul>
      )}
    </PaneShell>
  );
}

function ReferenceCard({ reference }: { reference: SessionReference }) {
  return (
    <li className="rounded-lg border border-border p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">{reference.title}</p>
        {reference.type && (
          <Badge variant="outline" className="shrink-0 text-[10px]">
            {reference.type}
          </Badge>
        )}
      </div>
      <a
        href={reference.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 flex items-center gap-1 break-all text-xs text-blue-600 hover:underline dark:text-blue-400"
      >
        {reference.url}
        <ExternalLink className="h-3 w-3 shrink-0" />
      </a>
      {reference.memo && (
        <p className="mt-2 flex gap-1 text-xs text-muted-foreground">
          <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="whitespace-pre-wrap">{reference.memo}</span>
        </p>
      )}
    </li>
  );
}

type Props = {
  detail: SyllabusDetail;
  demo?: boolean;
};

export function SyllabusDetailView({ detail, demo }: Props) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    detail.sessions[0]?.id ?? null,
  );

  const activeSession = useMemo(
    () => detail.sessions.find((s) => s.id === selectedSessionId) ?? null,
    [detail.sessions, selectedSessionId],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/syllabuses" className="hover:text-foreground">
              シラバス一覧
            </Link>
            <span>/</span>
            <span>詳細</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold">{detail.title}</h1>
          {detail.description && (
            <p className="text-sm text-muted-foreground">{detail.description}</p>
          )}
          {demo && (
            <Badge variant="secondary" className="mt-2">
              デモデータ
            </Badge>
          )}
        </div>
        <Button variant="outline" asChild>
          <Link href={`/syllabuses/${detail.id}/edit`}>基本情報を編集</Link>
        </Button>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="grid h-[calc(100vh-11rem)] min-h-[32rem] min-w-full grid-cols-4 gap-3">
          <SessionListPane
            sessions={detail.sessions}
            selectedId={selectedSessionId}
            onSelect={setSelectedSessionId}
          />
          <SchedulePane session={activeSession} />
          <SlidesPane session={activeSession} />
          <ReferencesPane session={activeSession} />
        </div>
      </div>
    </div>
  );
}

