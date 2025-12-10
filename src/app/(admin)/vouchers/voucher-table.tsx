"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, Plus, Printer, Download, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { GenerateForm } from "./generate-form";
import { deleteVoucherBatch, exportVoucherBatchCsv } from "./actions";
import Link from "next/link";

interface Plan {
  id: string;
  name: string;
  price: { toString(): string };
  validityDays: number;
}

interface BatchWithStats {
  id: string;
  batchNumber: string;
  prefix: string;
  quantity: number;
  codeLength: number;
  validityDays: number;
  notes: string | null;
  createdAt: Date;
  plan: { id: string; name: string; price: { toString(): string }; validityDays: number };
  _count: { vouchers: number };
  statusCounts: {
    GENERATED: number;
    SOLD: number;
    REDEEMED: number;
    EXPIRED: number;
  };
}

interface VoucherTableProps {
  batches: BatchWithStats[];
  plans: Plan[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

const statusColors: Record<string, string> = {
  GENERATED: "bg-blue-100 text-blue-700",
  SOLD: "bg-amber-100 text-amber-700",
  REDEEMED: "bg-green-100 text-green-700",
  EXPIRED: "bg-red-100 text-red-700",
};

export function VoucherTable({ batches, plans, meta }: VoucherTableProps) {
  const [generateOpen, setGenerateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    const result = await deleteVoucherBatch(deleteId);
    if (result.success) {
      toast.success("Batch deleted");
    } else {
      toast.error(result.error || "Failed to delete batch");
    }
    setDeleteId(null);
  };

  const handleExportCsv = async (batchId: string, batchNumber: string) => {
    const result = await exportVoucherBatchCsv(batchId);
    if (!result.success || !result.data) {
      toast.error(result.error || "Failed to export");
      return;
    }

    const rows = result.data as Array<Record<string, string>>;
    if (rows.length === 0) {
      toast.error("No vouchers to export");
      return;
    }

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((r) => headers.map((h) => `"${r[h] || ""}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vouchers-${batchNumber}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {meta.total} batch{meta.total !== 1 ? "es" : ""}
        </p>
        <Button onClick={() => setGenerateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Generate Vouchers
        </Button>
      </div>

      {batches.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <h3 className="text-lg font-medium">No voucher batches yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate your first batch of vouchers to get started.
          </p>
          <Button className="mt-4" onClick={() => setGenerateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Generate First Batch
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {batches.map((batch) => (
            <div
              key={batch.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{batch.batchNumber}</h3>
                    <Badge variant="outline">{batch.plan.name}</Badge>
                    <span className="text-sm text-muted-foreground">
                      ₹{batch.plan.price.toString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {batch.quantity} vouchers · {batch.validityDays} days validity ·
                    Created {format(new Date(batch.createdAt), "dd MMM yyyy")}
                  </p>
                  {batch.notes && (
                    <p className="text-xs text-muted-foreground">{batch.notes}</p>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/vouchers/${batch.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Vouchers
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/vouchers/${batch.id}/print`}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print Cards
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportCsv(batch.id, batch.batchNumber)}>
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDeleteId(batch.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Batch
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Status breakdown */}
              <div className="mt-3 flex gap-2">
                {Object.entries(batch.statusCounts).map(([status, count]) => (
                  count > 0 && (
                    <span
                      key={status}
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[status]}`}
                    >
                      {count} {status.toLowerCase()}
                    </span>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <GenerateForm
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        plans={plans}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Voucher Batch?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the batch and all its vouchers.
              Batches with redeemed vouchers cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
