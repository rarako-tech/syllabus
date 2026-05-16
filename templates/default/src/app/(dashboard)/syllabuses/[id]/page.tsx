import { notFound } from "next/navigation";
import { getSyllabusDetail } from "@/actions/syllabus-detail";
import { SyllabusDetailView } from "@/components/syllabuses/detail/syllabus-detail-view";
import { isFullyConfigured } from "@/env";
import { getDemoSyllabusDetail } from "@/lib/demo-syllabus-detail";

type Props = { params: Promise<{ id: string }> };

export default async function SyllabusDetailPage({ params }: Props) {
  const { id } = await params;

  const detail = isFullyConfigured
    ? await getSyllabusDetail(id)
    : getDemoSyllabusDetail(id);

  if (!detail) notFound();

  return <SyllabusDetailView detail={detail} demo={!isFullyConfigured} />;
}
