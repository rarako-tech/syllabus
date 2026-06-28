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
import { useEffect, useMemo, useState } from "react";
import { AddReferenceForm } from "@/components/syllabuses/detail/add-reference-form";
import { GenerateWorksheetButton } from "@/components/syllabuses/detail/generate-worksheet-button";
import { AddScheduleForm } from "@/components/syllabuses/detail/add-schedule-form";
import { ScheduleTableEditable } from "@/components/syllabuses/detail/schedule-table-editable";
import { AddSessionForm } from "@/components/syllabuses/detail/add-session-form";
import { SyllabusOverviewForm } from "@/components/syllabuses/detail/syllabus-overview-form";
import { AddSlideForm } from "@/components/syllabuses/detail/add-slide-form";
import { SessionOverviewPdfSlides } from "@/components/syllabuses/detail/session-overview-pdf-slides";
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
  OverviewPdf,
  ScheduleItem,
  SessionReference,
  SessionSlide,
  SyllabusDetail,
  SyllabusOverview,
  SyllabusSession,
} from "@/lib/types/syllabus-detail";
import { getOverviewPdfForSession } from "@/lib/overview-pdf-session";
import { cn } from "@/lib/utils";

type GenerationNotice = {
  type: "success" | "error";
  text: string;
};

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

type PaneOneTab = "overview" | "sessions";

function PaneOneTabs({
  activeTab,
  onChange,
}: {
  activeTab: PaneOneTab;
  onChange: (tab: PaneOneTab) => void;
}) {
  const tabs: { id: PaneOneTab; label: string }[] = [
    { id: "overview", label: "概要" },
    { id: "sessions", label: "各回で教える内容" },
  ];

  return (
    <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
            activeTab === tab.id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function SessionListPane({
  syllabusId,
  overview,
  sessions,
  selectedId,
  demo,
  onSelect,
  onSessionAdded,
  onOverviewSaved,
  onPdfsUploaded,
  onDraftsGenerated,
}: {
  syllabusId: string;
  overview: SyllabusOverview;
  sessions: SyllabusSession[];
  selectedId: string | null;
  demo?: boolean;
  onSelect: (id: string) => void;
  onSessionAdded: (session: SyllabusSession) => void;
  onOverviewSaved: (overview: SyllabusOverview) => void;
  onPdfsUploaded: (pdfs: SyllabusOverview["pdfs"]) => void;
  onDraftsGenerated: (
    sessions: SyllabusSession[],
    message?: string,
    isError?: boolean,
  ) => void;
}) {
  const [activeTab, setActiveTab] = useState<PaneOneTab>("sessions");
  const selected = sessions.find((s) => s.id === selectedId);

  return (
    <PaneShell
      title="① コース情報"
      description="概要と各回の内容"
      icon={BookOpen}
    >
      <div className="space-y-3">
        <PaneOneTabs activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === "overview" ? (
          <SyllabusOverviewForm
            syllabusId={syllabusId}
            overview={overview}
            sessions={sessions}
            demo={demo}
            onSaved={onOverviewSaved}
            onPdfsUploaded={onPdfsUploaded}
            onDraftsGenerated={(updatedSessions, message, isError) => {
              onDraftsGenerated(updatedSessions, message, isError);
              setActiveTab("sessions");
            }}
          />
        ) : (
          <>
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

            <AddSessionForm
              syllabusId={syllabusId}
              sessions={sessions}
              demo={demo}
              onSessionAdded={onSessionAdded}
            />

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
                  <p className="mt-1 whitespace-pre-wrap">
                    {selected.learningObjectives || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">準備物</p>
                  <p className="mt-1 whitespace-pre-wrap">{selected.preparation || "—"}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PaneShell>
  );
}

function SchedulePane({
  session,
  demo,
  onScheduleAdded,
  onScheduleUpdated,
}: {
  session: SyllabusSession | null;
  demo?: boolean;
  onScheduleAdded: (sessionId: string, item: ScheduleItem) => void;
  onScheduleUpdated: (sessionId: string, item: ScheduleItem) => void;
}) {
  return (
    <PaneShell
      title="② タイムスケジュール・教案メモ"
      description="所要時間・内容・教師の動き・生徒の活動・使用教材"
      icon={Clock}
    >
      {!session ? (
        <p className="text-sm text-muted-foreground">左のリストから回を選択してください</p>
      ) : (
        <div className="space-y-3">
          {session.scheduleItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              スケジュールがありません。概要タブの「スケジュールを再生成」で自動作成できます。
            </p>
          ) : (
            <ScheduleTableEditable
              items={session.scheduleItems}
              demo={demo}
              onUpdated={(item) => onScheduleUpdated(session.id, item)}
            />
          )}
          <AddScheduleForm
            sessionId={session.id}
            demo={demo}
            onAdded={(item) => onScheduleAdded(session.id, item)}
          />
        </div>
      )}
    </PaneShell>
  );
}

function SlidesPane({
  session,
  overviewPdfs,
  demo,
  onSlideAdded,
}: {
  session: SyllabusSession | null;
  overviewPdfs: OverviewPdf[];
  demo?: boolean;
  onSlideAdded: (sessionId: string, slide: SessionSlide) => void;
}) {
  const linkedPdf = session
    ? getOverviewPdfForSession(overviewPdfs, session.sessionNumber)
    : null;

  return (
    <PaneShell
      title="③ 各回のスライド"
      description="概要PDFを回ごとに自動表示"
      icon={Presentation}
    >
      {!session ? (
        <p className="text-sm text-muted-foreground">回を選択してください</p>
      ) : (
        <div className="space-y-3">
          {linkedPdf ? (
            <SessionOverviewPdfSlides
              pdf={linkedPdf}
              sessionNumber={session.sessionNumber}
              demo={demo}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              概要タブで第{session.sessionNumber}番目のPDFをアップロードすると、ここに表示されます。
            </p>
          )}

          {session.slides.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                登録済みリンク
              </p>
              <ul className="space-y-3">
                {session.slides.map((slide) => (
                  <SlideCard key={slide.id} slide={slide} />
                ))}
              </ul>
            </div>
          )}

          <AddSlideForm
            sessionId={session.id}
            demo={demo}
            onAdded={(slide) => onSlideAdded(session.id, slide)}
          />
        </div>
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

function ReferencesPane({
  session,
  overview,
  demo,
  onReferenceAdded,
}: {
  session: SyllabusSession | null;
  overview: SyllabusOverview;
  demo?: boolean;
  onReferenceAdded: (sessionId: string, reference: SessionReference) => void;
}) {
  return (
    <PaneShell
      title="④ 参照リンク・メモ"
      description="リンク・メモ・ワークシート生成"
      icon={Link2}
    >
      {!session ? (
        <p className="text-sm text-muted-foreground">回を選択してください</p>
      ) : (
        <div className="space-y-3">
          <GenerateWorksheetButton
            session={session}
            overview={overview}
            demo={demo}
          />

          {session.references.length === 0 ? (
            <p className="text-sm text-muted-foreground">参照リンクがありません</p>
          ) : (
            <ul className="space-y-3">
              {session.references.map((ref) => (
                <ReferenceCard key={ref.id} reference={ref} />
              ))}
            </ul>
          )}
          <AddReferenceForm
            sessionId={session.id}
            demo={demo}
            onAdded={(reference) => onReferenceAdded(session.id, reference)}
          />
        </div>
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
  const [sessions, setSessions] = useState(detail.sessions);
  const [overview, setOverview] = useState(detail.overview);
  const [generationNotice, setGenerationNotice] = useState<GenerationNotice | null>(
    null,
  );
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    detail.sessions[0]?.id ?? null,
  );

  useEffect(() => {
    setSessions(detail.sessions);
    setOverview(detail.overview);
  }, [detail.sessions, detail.overview]);

  const handleSessionAdded = (session: SyllabusSession) => {
    setSessions((prev) =>
      [...prev, session].sort((a, b) => a.sessionNumber - b.sessionNumber),
    );
    setSelectedSessionId(session.id);
  };

  const updateSession = (
    sessionId: string,
    updater: (session: SyllabusSession) => SyllabusSession,
  ) => {
    setSessions((prev) =>
      prev.map((session) => (session.id === sessionId ? updater(session) : session)),
    );
  };

  const handleScheduleAdded = (sessionId: string, item: ScheduleItem) => {
    updateSession(sessionId, (session) => ({
      ...session,
      scheduleItems: [...session.scheduleItems, item],
    }));
  };

  const handleSlideAdded = (sessionId: string, slide: SessionSlide) => {
    updateSession(sessionId, (session) => ({
      ...session,
      slides: [...session.slides, slide],
    }));
  };

  const handleReferenceAdded = (sessionId: string, reference: SessionReference) => {
    updateSession(sessionId, (session) => ({
      ...session,
      references: [...session.references, reference],
    }));
  };

  const handleScheduleUpdated = (sessionId: string, item: ScheduleItem) => {
    updateSession(sessionId, (session) => ({
      ...session,
      scheduleItems: session.scheduleItems.map((row) =>
        row.id === item.id ? item : row,
      ),
    }));
  };

  const handleDraftsGenerated = (
    updatedSessions: SyllabusSession[],
    message?: string,
    isError?: boolean,
  ) => {
    setSessions(updatedSessions);
    if (message) {
      setGenerationNotice({
        type: isError ? "error" : "success",
        text: message,
      });
    }
    if (updatedSessions.length > 0) {
      setSelectedSessionId((current) => {
        const currentSession = updatedSessions.find((session) => session.id === current);
        if (currentSession && currentSession.scheduleItems.length > 0) {
          return current;
        }
        const firstWithSchedule = updatedSessions.find(
          (session) => session.scheduleItems.length > 0,
        );
        return firstWithSchedule?.id ?? updatedSessions[0]?.id ?? null;
      });
    }
  };

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId) ?? null,
    [sessions, selectedSessionId],
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

      {generationNotice && (
        <p
          className={cn(
            "rounded-md border px-3 py-2 text-sm",
            generationNotice.type === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-800",
          )}
        >
          {generationNotice.text}
        </p>
      )}

      <div className="overflow-x-auto pb-1">
        <div className="grid h-[calc(100vh-9rem)] min-h-[32rem] min-w-0 w-full grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3">
          <SessionListPane
            syllabusId={detail.id}
            overview={overview}
            sessions={sessions}
            selectedId={selectedSessionId}
            demo={demo}
            onSelect={setSelectedSessionId}
            onSessionAdded={handleSessionAdded}
            onOverviewSaved={setOverview}
            onPdfsUploaded={(pdfs) =>
              setOverview((prev) => ({
                ...prev,
                pdfs,
              }))
            }
            onDraftsGenerated={handleDraftsGenerated}
          />
          <SchedulePane
            session={activeSession}
            demo={demo}
            onScheduleAdded={handleScheduleAdded}
            onScheduleUpdated={handleScheduleUpdated}
          />
          <SlidesPane
            session={activeSession}
            overviewPdfs={overview.pdfs}
            demo={demo}
            onSlideAdded={handleSlideAdded}
          />
          <ReferencesPane
            session={activeSession}
            overview={overview}
            demo={demo}
            onReferenceAdded={handleReferenceAdded}
          />
        </div>
      </div>
    </div>
  );
}

