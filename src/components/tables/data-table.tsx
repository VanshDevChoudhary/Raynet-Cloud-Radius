"use client";

import * as React from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from "lucide-react";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  searchKey?: string;
  filters?: FilterConfig[];
  onFilterChange?: (filters: Record<string, string>) => void;
  pageCount?: number;
  pageIndex?: number;
  pageSize?: number;
  onPaginationChange?: (page: number, pageSize: number) => void;
  manualPagination?: boolean;
  manualFiltering?: boolean;
  totalRows?: number;
  toolbar?: React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Search...",
  searchKey,
  filters = [],
  onFilterChange,
  pageCount,
  pageIndex = 0,
  pageSize = 10,
  onPaginationChange,
  manualPagination = false,
  manualFiltering = false,
  totalRows,
  toolbar,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [activeFilters, setActiveFilters] = React.useState<Record<string, string>>({});

  const table = useReactTable({
    data,
    columns,
    pageCount: manualPagination ? pageCount : undefined,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      ...(manualPagination
        ? { pagination: { pageIndex, pageSize } }
        : {}),
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: manualFiltering ? undefined : getFilteredRowModel(),
    getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),
    manualPagination,
    manualFiltering,
  });

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...activeFilters };
    if (value === "all") {
      delete newFilters[key];
      setColumnFilters((prev) => prev.filter((f) => f.id !== key));
    } else {
      newFilters[key] = value;
      setColumnFilters((prev) => [
        ...prev.filter((f) => f.id !== key),
        { id: key, value },
      ]);
    }
    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const displayTotal = totalRows ?? (manualPagination ? 0 : table.getFilteredRowModel().rows.length);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={
                searchKey
                  ? (table.getColumn(searchKey)?.getFilterValue() as string) ?? ""
                  : globalFilter
              }
              onChange={(e) => {
                if (searchKey) {
                  table.getColumn(searchKey)?.setFilterValue(e.target.value);
                } else {
                  setGlobalFilter(e.target.value);
                }
              }}
              className="pl-9"
            />
          </div>
          {filters.map((filter) => (
            <Select
              key={filter.key}
              value={activeFilters[filter.key] ?? "all"}
              onValueChange={(value) => handleFilterChange(filter.key, value)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {filter.label}</SelectItem>
                {filter.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>
        {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
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
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {displayTotal} total row{displayTotal !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-2">
          <Select
            value={String(manualPagination ? pageSize : table.getState().pagination.pageSize)}
            onValueChange={(value) => {
              if (manualPagination) {
                onPaginationChange?.(0, Number(value));
              } else {
                table.setPageSize(Number(value));
              }
            }}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 50, 100].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} rows
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                if (manualPagination) onPaginationChange?.(0, pageSize);
                else table.setPageIndex(0);
              }}
              disabled={manualPagination ? pageIndex === 0 : !table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                if (manualPagination) onPaginationChange?.(pageIndex - 1, pageSize);
                else table.previousPage();
              }}
              disabled={manualPagination ? pageIndex === 0 : !table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="flex items-center gap-1 text-sm">
              Page{" "}
              <strong>
                {(manualPagination ? pageIndex : table.getState().pagination.pageIndex) + 1} of{" "}
                {manualPagination ? (pageCount ?? 1) : table.getPageCount()}
              </strong>
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                if (manualPagination) onPaginationChange?.(pageIndex + 1, pageSize);
                else table.nextPage();
              }}
              disabled={
                manualPagination
                  ? pageIndex >= (pageCount ?? 1) - 1
                  : !table.getCanNextPage()
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                const last = (manualPagination ? (pageCount ?? 1) : table.getPageCount()) - 1;
                if (manualPagination) onPaginationChange?.(last, pageSize);
                else table.setPageIndex(last);
              }}
              disabled={
                manualPagination
                  ? pageIndex >= (pageCount ?? 1) - 1
                  : !table.getCanNextPage()
              }
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
