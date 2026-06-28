"use client";

import { FileText, Upload } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { uploadSyllabusOverviewPdfs } from "@/actions/syllabus-detail";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { OverviewPdf } from "@/lib/types/syllabus-detail";

type Props = {
  syllabusId: string;
  pdfs: OverviewPdf[];
  demo?: boolean;
  onUploaded: (pdfs: OverviewPdf[]) => void;
};

export function SyllabusOverviewPdfUpload({
  syllabusId,
  pdfs,
  demo,
  onUploaded,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    setError(null);
    startTransition(async () => {
      if (demo) {
        const nextPdfs = [
          ...pdfs,
          ...Array.from(files).map((file, index) => ({
            id: `demo-overview-pdf-${Date.now()}-${index}`,
            fileName: file.name,
          })),
        ];
        onUploaded(nextPdfs);
        event.target.value = "";
        return;
      }

      const formData = new FormData();
      for (const file of files) {
        formData.append("files", file);
      }

      const result = await uploadSyllabusOverviewPdfs(syllabusId, formData);
      event.target.value = "";

      if (!result.ok) {
        setError(result.error);
        return;
      }

      onUploaded(result.data.pdfs);
    });
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">PDF</Label>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="mr-1.5 h-3.5 w-3.5" />
        {pending ? "アップロード中..." : "PDFをアップロード"}
      </Button>

      {pdfs.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          アップロードしたPDFはここに表示されます。
        </p>
      ) : (
        <ul className="space-y-1.5 rounded-lg border border-border bg-muted/40 p-2">
          {pdfs.map((pdf) => (
            <li
              key={pdf.id}
              className="flex items-center gap-2 text-xs text-foreground"
            >
              <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="min-w-0 break-all">{pdf.fileName}</span>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
