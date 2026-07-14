"use client";

import type { ReactNode } from "react";

import {
  Card,
  Checkbox,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { StatCard, type StatCardAccent } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";

export interface AdminColumn<TRow> {
  key: string;
  header: string;
  cell: (row: TRow) => ReactNode;
  className?: string;
}

export function AdminToolbar({
  searchLabel,
  searchValue,
  onSearchChange,
  statusLabel,
  statusValue,
  statusOptions,
  onStatusChange,
  trailing,
}: {
  searchLabel: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  statusLabel?: string;
  statusValue?: string;
  statusOptions?: Array<{ value: string; label: string }>;
  onStatusChange?: (value: string) => void;
  trailing?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/90 p-4 shadow-sm lg:flex-row lg:items-end lg:justify-between">
      <div className="grid flex-1 gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-foreground">{searchLabel}</span>
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search…"
            aria-label={searchLabel}
            className="h-10"
          />
        </label>
        {statusOptions && onStatusChange ? (
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-foreground">{statusLabel ?? "Status"}</span>
            <Select value={statusValue ?? "all"} onValueChange={onStatusChange}>
              <SelectTrigger aria-label={statusLabel ?? "Status"} className="h-10">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        ) : null}
      </div>
      {trailing ? <div className="flex flex-wrap gap-2">{trailing}</div> : null}
    </div>
  );
}

export function AdminDataTable<TRow extends { id: string }>({
  columns,
  rows,
  caption,
  selectable = false,
  selectedIds,
  onToggleAll,
  onToggleRow,
  rowActions,
}: {
  columns: Array<AdminColumn<TRow>>;
  rows: TRow[];
  caption: string;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleAll?: (checked: boolean) => void;
  onToggleRow?: (id: string, checked: boolean) => void;
  rowActions?: (row: TRow) => ReactNode;
}) {
  const allSelected = selectable && rows.length > 0 && rows.every((row) => selectedIds?.has(row.id));

  return (
    <Card className="overflow-hidden border-border/70 bg-card/90 p-0 shadow-sm">
      <Table>
        <caption className="sr-only">{caption}</caption>
        <TableHeader className="sticky top-0 z-10 bg-muted/40">
          <TableRow className="hover:bg-transparent">
            {selectable ? (
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) => onToggleAll?.(checked === true)}
                  aria-label="Select all rows"
                />
              </TableHead>
            ) : null}
            {columns.map((column) => (
              <TableHead key={column.key} className={column.className}>
                {column.header}
              </TableHead>
            ))}
            {rowActions ? <TableHead className="w-28 text-right">Actions</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              data-selected={selectedIds?.has(row.id) ? "true" : undefined}
              className="hover:bg-muted/30"
            >
              {selectable ? (
                <TableCell>
                  <Checkbox
                    checked={selectedIds?.has(row.id) ?? false}
                    onCheckedChange={(checked) => onToggleRow?.(row.id, checked === true)}
                    aria-label={`Select row ${row.id}`}
                  />
                </TableCell>
              ) : null}
              {columns.map((column) => (
                <TableCell key={column.key} className={cn(column.className)}>
                  {column.cell(row)}
                </TableCell>
              ))}
              {rowActions ? <TableCell className="text-right">{rowActions(row)}</TableCell> : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

export function AdminMetricGrid({
  metrics,
}: {
  metrics: Array<{
    label: string;
    value: string | number;
    hint?: string;
    href?: string;
    accent?: StatCardAccent;
  }>;
}) {
  return (
    <div className="mb-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => {
        const accent =
          metric.accent ?? DEFAULT_METRIC_ACCENTS[index % DEFAULT_METRIC_ACCENTS.length] ?? "primary";
        return (
          <StatCard
            key={metric.label}
            title={metric.label}
            value={String(metric.value)}
            {...(metric.hint ? { description: metric.hint } : {})}
            {...(metric.href ? { href: metric.href } : {})}
            accent={accent}
          />
        );
      })}
    </div>
  );
}

const DEFAULT_METRIC_ACCENTS = [
  "sky",
  "rose",
  "amber",
  "primary",
  "emerald",
  "violet",
  "slate",
  "amber",
] as const satisfies readonly StatCardAccent[];
