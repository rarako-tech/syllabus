"use client";

import { ScheduleAdviceButton } from "@/components/syllabuses/detail/schedule-advice-button";
import { getScheduleItemDuration } from "@/lib/schedule-time";
import type { ScheduleItem } from "@/lib/types/syllabus-detail";

type Props = {
  items: ScheduleItem[];
  demo?: boolean;
};

export function ScheduleTableWithAi({ items, demo }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="w-0 whitespace-nowrap px-1 pb-2 pr-1 text-[10px] font-medium leading-tight">
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
              <td className="w-0 whitespace-nowrap px-1 py-2 pr-1">
                <p
                  className="text-xs font-medium tabular-nums"
                  title={`開始: ${row.time}`}
                >
                  {getScheduleItemDuration(items, index) ?? "—"}
                </p>
              </td>
              <td className="py-2 pr-3">{row.content}</td>
              <td className="py-2 pr-3 text-muted-foreground">
                {row.teacherAction || "—"}
              </td>
              <td className="py-2 pr-3 text-muted-foreground">
                {row.studentActivity || "—"}
              </td>
              <td className="py-2 pr-3">{row.materials || "—"}</td>
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
