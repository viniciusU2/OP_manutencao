import {

  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import type {ColumnDef} from "@tanstack/react-table";


import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

import { Button } from "../ui/button";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pagination,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: pagination ? undefined : getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="w-full overflow-hidden rounded-md border bg-white">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
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
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center">
                Nenhum registro encontrado
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-gray-500">
          {pagination
            ? `${pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1}-${Math.min(
                pagination.page * pagination.pageSize,
                pagination.total
              )} de ${pagination.total}`
            : `${data.length} registro(s)`}
        </span>
        <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          onClick={() => pagination ? pagination.onPageChange(pagination.page - 1) : table.previousPage()}
          disabled={pagination ? pagination.page <= 1 : !table.getCanPreviousPage()}
        >
          Anterior
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          onClick={() => pagination ? pagination.onPageChange(pagination.page + 1) : table.nextPage()}
          disabled={pagination ? pagination.page >= pagination.totalPages : !table.getCanNextPage()}
        >
          Próxima
        </Button>
        </div>
      </div>
    </div>
  );
}
