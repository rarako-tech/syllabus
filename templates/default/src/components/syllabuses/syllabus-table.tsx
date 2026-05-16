"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { deleteSyllabus, type SyllabusRow } from "@/actions/syllabuses";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const statusLabel: Record<SyllabusRow["status"], string> = {
  draft: "下書き",
  published: "公開",
  archived: "アーカイブ",
};

type Props = {
  data: SyllabusRow[];
  demo?: boolean;
};

export function SyllabusTable({ data, demo }: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pending, startTransition] = useTransition();

  const filteredData = useMemo(() => {
    if (statusFilter === "all") return data;
    return data.filter((row) => row.status === statusFilter);
  }, [data, statusFilter]);

  const columns = useMemo<ColumnDef<SyllabusRow>[]>(
    () => [
      {
        accessorKey: "title",
        header: "タイトル",
        cell: ({ row }) => (
          <div>
            <Link
              href={`/syllabuses/${row.original.id}`}
              className="font-medium hover:underline"
            >
              {row.original.title}
            </Link>
            {row.original.description && (
              <div className="text-xs text-muted-foreground line-clamp-1">
                {row.original.description}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "ステータス",
        cell: ({ row }) => (
          <Badge variant="secondary">{statusLabel[row.original.status]}</Badge>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: "更新日",
        cell: ({ row }) =>
          new Date(row.original.updatedAt).toLocaleDateString("ja-JP"),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/syllabuses/${row.original.id}`}>詳細</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/syllabuses/${row.original.id}/edit`}>編集</Link>
            </Button>
            {!demo && (
              <Button
                variant="destructive"
                size="sm"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await deleteSyllabus(row.original.id);
                  })
                }
              >
                削除
              </Button>
            )}
          </div>
        ),
      },
    ],
    [demo, pending],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="タイトル・説明で検索..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(e) => table.getColumn("title")?.setFilterValue(e.target.value)}
          className="max-w-sm"
        />
        <select
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">すべてのステータス</option>
          <option value="draft">下書き</option>
          <option value="published">公開</option>
          <option value="archived">アーカイブ</option>
        </select>
      </div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={header.column.getCanSort() ? "cursor-pointer select-none" : ""}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {{ asc: " ↑", desc: " ↓" }[header.column.getIsSorted() as string] ?? null}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                データがありません
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
