import { requireTenantId } from "@/lib/session";
import { voucherService } from "@/services/voucher.service";
import { notFound } from "next/navigation";
import { VoucherList } from "./voucher-list";
import { serialize } from "@/lib/types";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata = {
  title: "Voucher Batch Details",
};

export default async function VoucherBatchPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = await params;
  const tenantId = await requireTenantId();

  const result = await voucherService.listVouchers(tenantId, {
    batchId,
    pageSize: 200,
  });

  if (result.data.length === 0) {
    notFound();
  }

  const batch = result.data[0]?.batch;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/vouchers"
          className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Vouchers
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {batch?.batchNumber}
            </h1>
            <p className="text-sm text-muted-foreground">
              {batch?.plan.name} — ₹{Number(batch?.plan.price)} · {result.meta.total} vouchers
            </p>
          </div>
          <Link
            href={`/vouchers/${batchId}/print`}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Print Cards
          </Link>
        </div>
      </div>

      <VoucherList vouchers={serialize(result.data)} batchId={batchId} />
    </div>
  );
}
