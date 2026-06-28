"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateScheduleItem } from "@/actions/syllabus-detail";
import { ScheduleAdviceButton } from "@/components/syllabuses/detail/schedule-advice-button";
import { textareaClassName } from "@/components/syllabuses/detail/form-styles";
import {
  formatScheduleTimeLabel,
  getScheduleItemDuration,
} from "@/lib/schedule-time";
import type { ScheduleItem } from "@/lib/types/syllabus-detail";

const timeInputClassName =
  "w-10 min-w-0 rounded border border-border bg-background px-0.5 py-0.5 text-[10px] font-mono leading-none shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/20";

const durationCellClassName = "w-0 whitespace-nowrap px-1 py-2 pr-1";
const durationHeaderClassName =
  "w-0 whitespace-nowrap px-1 pb-2 pr-1 text-[10px] font-medium leading-tight";

type Props = {
  items: ScheduleItem[];
  demo?: boolean;
  onUpdated: (item: ScheduleItem) => void;
};

export function ScheduleTableEditable({
  items,
  demo,
  onUpdated,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const saveField = (
    item: ScheduleItem,
    field: keyof ScheduleItem,
    value: string,
  ) => {
    const nextItem = { ...item, [field]: value };
    onUpdated(nextItem);

    if (demo) return;

    startTransition(async () => {
      const result = await updateScheduleItem(item.id, {
        time: field === "time" ? value : item.time,
        content: field === "content" ? value : item.content,
        teacherAction: field === "teacherAction" ? value : item.teacherAction,
        studentActivity:
          field === "studentActivity" ? value : item.studentActivity,
        materials: field === "materials" ? value : item.materials,
      });

      if (result.ok) {
        onUpdated(result.data.item);
        router.refresh();
      }
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className={durationHeaderClassName}>
              所要
              <br />
              時間
            </th>
            <th className="pb-2 pr-3 font-medium">内容</th>
            <th className="pb-2 pr-3 font-medium">教師の動き</th>
            <th className="pb-2 pr-3 font-medium">生徒の活動</th>
            <th className="pb-2 pr-3 font-medium">使用教材</th>
            <th className="pb-2 w-10 font-medium text-center">AI</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row, index) => (
            <tr key={row.id} className="border-b border-border/60 align-top">
              <td className={durationCellClassName}>
                <p className="text-xs font-medium leading-none tabular-nums">
                  {getScheduleItemDuration(items, index) ?? "—"}
                </p>
                <input
                  className={`${timeInputClassName} mt-1`}
                  defaultValue={formatScheduleTimeLabel(row.time)}
                  disabled={pending}
                  title="開始時刻（授業開始から H:MM）または 0:00-0:15 形式"
                  placeholder="0:00"
                  onBlur={(event) => {
                    if (event.target.value !== row.time) {
                      saveField(row, "time", event.target.value);
                    }
                  }}
                />
              </td>
              <td className="py-2 pr-3">
                <textarea
                  className={`${textareaClassName} min-h-[56px]`}
                  defaultValue={row.content}
                  rows={2}
                  disabled={pending}
                  onBlur={(event) => {
                    if (event.target.value !== row.content) {
                      saveField(row, "content", event.target.value);
                    }
                  }}
                />
              </td>
              <td className="py-2 pr-3">
                <textarea
                  className={`${textareaClassName} min-h-[56px]`}
                  defaultValue={row.teacherAction}
                  rows={2}
                  disabled={pending}
                  onBlur={(event) => {
                    if (event.target.value !== row.teacherAction) {
                      saveField(row, "teacherAction", event.target.value);
                    }
                  }}
                />
              </td>
              <td className="py-2 pr-3">
                <textarea
                  className={`${textareaClassName} min-h-[56px]`}
                  defaultValue={row.studentActivity}
                  rows={2}
                  disabled={pending}
                  onBlur={(event) => {
                    if (event.target.value !== row.studentActivity) {
                      saveField(row, "studentActivity", event.target.value);
                    }
                  }}
                />
              </td>
              <td className="py-2 pr-3">
                <textarea
                  className={`${textareaClassName} min-h-[56px]`}
                  defaultValue={row.materials}
                  rows={2}
                  disabled={pending}
                  onBlur={(event) => {
                    if (event.target.value !== row.materials) {
                      saveField(row, "materials", event.target.value);
                    }
                  }}
                />
              </td>
              <td className="py-2">
                <ScheduleAdviceButton row={row} demo={demo} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
