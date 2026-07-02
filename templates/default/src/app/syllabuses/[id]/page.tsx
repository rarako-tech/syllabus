import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { resolveSyllabusDetailAccess } from "@/actions/syllabus-detail";
import { SyllabusDetailView } from "@/components/syllabuses/detail/syllabus-detail-view";
import { Button } from "@/components/ui/button";
import { isFullyConfigured } from "@/env";
import { getDemoSyllabusDetail } from "@/lib/demo-syllabus-detail";

type Props = { params: Promise<{ id: string }> };

export const maxDuration = 300;

export default async function SyllabusDetailPage({ params }: Props) {
  const { id } = await params;

  if (!isFullyConfigured) {
    const detail = getDemoSyllabusDetail(id);
    if (!detail) notFound();
    return <SyllabusDetailView detail={detail} demo />;
  }

  const access = await resolveSyllabusDetailAccess(id);

  if (access.status === "unauthorized") {
    redirect("/sign-in");
  }

  if (access.status === "wrong_org") {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-8">
        <h1 className="text-xl font-bold">このシラバスは別の組織にあります</h1>
        <p className="text-sm text-muted-foreground">
          「{access.title}」は組織「{access.orgName}」に紐づいています。
          画面上部の Organization Switcher で「{access.orgName}」を選んでから、もう一度開いてください。
        </p>
        <Button variant="outline" asChild>
          <Link href="/syllabuses">シラバス一覧へ</Link>
        </Button>
      </div>
    );
  }

  if (access.status === "not_found") {
    notFound();
  }

  if (access.status === "db_error") {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-8">
        <h1 className="text-xl font-bold">接続エラー</h1>
        <p className="text-sm text-muted-foreground">{access.message}</p>
        <p className="text-xs text-muted-foreground">
          Neon データベースへの接続がタイムアウトした可能性があります。Wi‑Fi
          を確認し、少し待ってから再読み込みしてください。
        </p>
        <Button variant="outline" asChild>
          <Link href="/syllabuses">シラバス一覧へ</Link>
        </Button>
      </div>
    );
  }

  return <SyllabusDetailView detail={access.detail} />;
}
